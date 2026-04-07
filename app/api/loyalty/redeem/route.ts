import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// This would typically involve sending an actual SMS
const sendOTP = async (phone: string, otp: string) => {
    console.log(`Sending OTP ${otp} to ${phone}`);
    // await smsService.send(phone, `Your loyalty redemption OTP is: ${otp}`);
    return true;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, hotelId, orderId, pointsToRedeem, otpCode, isVerifyOnly } = body;

    if (!customerId || !hotelId || pointsToRedeem === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer || customer.hotelId !== hotelId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.pointsBalance < pointsToRedeem) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }

    // Step 1: Send OTP if > 200 points
    if (pointsToRedeem > 200 && !otpCode) {
        // Generate a random 4-digit OTP
        const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        // In a real app, store this in cache/Redis for 5-10 mins. For now, returning it for demo.
        await sendOTP(customer.phone, generatedOTP);
        return NextResponse.json({ 
            message: 'OTP Sent', 
            status: 'OTP_SENT_REQUIRED', 
            otpForDemo: generatedOTP // REMOVE IN PRODUCTION
        });
    }

    // Step 2: Verify OTP
    if (pointsToRedeem > 200 && otpCode) {
        // Mock OTP verification (in reality, compare with stored value)
        if (otpCode.length !== 4) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }
    }

    // If only verifying availability
    if (isVerifyOnly) {
        return NextResponse.json({ status: 'READY_TO_REDEEM' });
    }

    // Step 3: Atomic Transaction for Burn
    const [loyaltyTx, updatedCustomer] = await prisma.$transaction([
        prisma.loyaltyTransaction.create({
            data: {
                customerId,
                hotelId,
                type: 'BURN',
                points: -pointsToRedeem,
                rupeeValue: -pointsToRedeem,
                orderId,
                description: `Bill redemption for ${orderId || 'Current Bill'}`
            }
        }),
        prisma.customer.update({
            where: { id: customerId },
            data: {
                pointsBalance: { decrement: pointsToRedeem }
            }
        })
    ]);

    return NextResponse.json({ status: 'REDEEMED', balance: updatedCustomer.pointsBalance });
  } catch (error) {
    console.error('Redeem Error:', error);
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 });
  }
}
