import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderIds, paymentMethod, hotelId, discount = 0, customerPhone } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Missing orderIds' }, { status: 400 });
    }

    // Use a transaction to ensure all orders and transactions are updated together
    const results = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        include: { 
          items: {
            include: {
              item: {
                include: {
                  category: true
                }
              }
            }
          } 
        }
      });

      if (orders.length !== orderIds.length) {
        throw new Error('Some orders not found');
      }

      let activeCustomerId = null;
      if (customerPhone) {
        const hId = hotelId || 'SFB-99';
        let customer = await tx.customer.findUnique({
          where: {
            phone_hotelId: {
              phone: customerPhone,
              hotelId: hId
            }
          }
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              phone: customerPhone,
              hotelId: hId
            }
          });
        }
        activeCustomerId = customer.id;
      }

      const transactions = await Promise.all(orders.map(async (order) => {
        // Calculate the actual order total from items for data integrity
        const actualOrderTotal = order.items.reduce((sum: number, oi: any) => sum + (oi.price * oi.quantity), 0);
        
        // Calculate tax for this specific order (5% GST as per requirement)
        const gstAmount = actualOrderTotal * 0.05;
        
        // Check if a transaction already exists for this orderId to avoid unique constraint violation
        const existingTx = await tx.transaction.findUnique({
          where: { orderId: order.id }
        });

        if (existingTx) {
          // If transaction exists but order was not completed, we just update it
          return tx.transaction.update({
            where: { id: existingTx.id },
            data: {
              amount: actualOrderTotal + gstAmount,
              status: 'PAID',
              paymentMethod: paymentMethod || 'Cash'
            }
          });
        }

        // Calculate straightforward 2% loyalty points on the total bill
        const finalPointsEarned = Math.floor((actualOrderTotal + gstAmount) * 0.02);

        // Create transaction for this order
        const txRecord = await tx.transaction.create({
          data: {
            orderId: order.id,
            hotelId: hotelId || order.hotelId,
            amount: actualOrderTotal + gstAmount, 
            gstAmount: gstAmount,
            discount: discount / orders.length, 
            loyaltyPointsRedeemed: 0,
            loyaltyPointsEarned: finalPointsEarned,
            paymentMethod: paymentMethod || 'Cash',
            customerId: activeCustomerId,
            status: 'PAID'
          }
        });

        // If customer is attached, update their points
        if (activeCustomerId) {
            await tx.customer.update({
                where: { id: activeCustomerId },
                data: {
                    pointsBalance: { 
                        increment: finalPointsEarned
                    },
                    totalPointsEarned: { increment: finalPointsEarned }
                }
            });

            if (finalPointsEarned > 0) {
                await tx.loyaltyTransaction.create({
                    data: {
                        customerId: activeCustomerId,
                        hotelId: hotelId || order.hotelId,
                        type: 'EARN',
                        points: finalPointsEarned,
                        rupeeValue: finalPointsEarned,
                        orderId: order.id,
                        description: `Points earned on bill`
                    }
                });
            }
        }
        return txRecord;
      }));

      // Update all orders to COMPLETED
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: { status: 'COMPLETED' }
      });

      return transactions;
    });

    return NextResponse.json({ success: true, transactions: results });
  } catch (error: any) {
    console.error('Settlement Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to settle bill' }, { status: 500 });
  }
}
