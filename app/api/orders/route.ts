import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, hotelId, items } = body;
    const computedTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // 1. Create the Order
    const order = await prisma.order.create({
      data: {
        tableId,
        hotelId,
        totalAmount: computedTotal,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            itemId: item.id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || '',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order Creation Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelId = searchParams.get('hotelId') || 'SFB-99'; // Fallback for mock

    const orders = await prisma.order.findMany({
      where: { hotelId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Order Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
