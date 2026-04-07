import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hotelId = 'SFB-99', closedBy } = body;

    const activeShift = await prisma.shift.findFirst({
      where: {
        hotelId,
        status: 'OPEN',
      },
    });

    if (!activeShift) {
      return NextResponse.json({ error: 'No active shift found' }, { status: 404 });
    }

    // Calculate totals for the shift
    const transactions = await prisma.transaction.findMany({
      where: {
        hotelId,
        createdAt: {
          gte: activeShift.startTime,
        },
      },
    });

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTax = transactions.reduce((sum, tx) => sum + tx.gstAmount, 0);
    const totalCash = transactions.reduce((sum, tx) => sum + (tx.paymentMethod === 'Cash' ? tx.amount : 0), 0);
    const totalDigital = transactions.reduce((sum, tx) => sum + (tx.paymentMethod !== 'Cash' ? tx.amount : 0), 0);
    const totalOrders = transactions.length;

    const closedShift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        totalRevenue,
        totalTax,
        totalCash,
        totalDigital,
        totalOrders,
        closedBy,
      },
    });

    return NextResponse.json({ success: true, shift: closedShift });
  } catch (error: any) {
    console.error('Shift Close Error:', error);
    return NextResponse.json({ error: 'Failed to close shift' }, { status: 500 });
  }
}
