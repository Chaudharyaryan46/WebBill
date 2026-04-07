import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const hotelId = searchParams.get('hotelId');

    if (!phone || !hotelId) {
      return NextResponse.json({ error: 'Missing phone or hotelId' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        phone_hotelId: {
          phone,
          hotelId
        }
      },
      include: {
        loyaltyTransactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found', status: 'NOT_FOUND' }, { status: 200 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer Loyalty GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer loyalty' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, hotelId, referredByCode } = body;

    if (!phone || !hotelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: {
        phone_hotelId: {
          phone,
          hotelId
        }
      }
    });

    if (customer) {
        // Update existing
        customer = await prisma.customer.update({
            where: { id: customer.id },
            data: { name }
        });
    } else {
        // Create new
        let referredById = null;
        if (referredByCode) {
            const referrer = await prisma.customer.findUnique({
                where: { referralCode: referredByCode }
            });
            if (referrer) referredById = referrer.id;
        }

        customer = await prisma.customer.create({
            data: {
                phone,
                name,
                hotelId,
                referredById,
                referralCode: Math.random().toString(36).substring(2, 10).toUpperCase()
            }
        });

        // If referred, give points (logic can be adjusted)
        if (referredById) {
            await prisma.loyaltyTransaction.create({
                data: {
                    customerId: referredById,
                    hotelId,
                    type: 'REFERRAL',
                    points: 50, // ₹50 bonus
                    rupeeValue: 50,
                    description: `Referral bonus for ${phone}`
                }
            });
            
            await prisma.customer.update({
                where: { id: referredById },
                data: {
                    pointsBalance: { increment: 50 },
                    totalPointsEarned: { increment: 50 }
                }
            });
        }
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Customer Loyalty POST Error:', error);
    return NextResponse.json({ error: 'Failed to manage customer' }, { status: 500 });
  }
}
