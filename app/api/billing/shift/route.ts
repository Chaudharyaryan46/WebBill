import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelId = searchParams.get('hotelId') || 'SFB-99';

    const activeShift = await prisma.shift.findFirst({
      where: {
        hotelId,
        status: 'OPEN',
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({ activeShift });
  } catch (error: any) {
    console.error('Shift Get Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shift status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hotelId = 'SFB-99' } = body;

    // Check if there is already an open shift
    const existingShift = await prisma.shift.findFirst({
      where: {
        hotelId,
        status: 'OPEN',
      },
    });

    if (existingShift) {
      return NextResponse.json({ error: 'A shift is already open', shift: existingShift }, { status: 400 });
    }

    const newShift = await prisma.shift.create({
      data: {
        hotelId,
        status: 'OPEN',
        startTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, shift: newShift });
  } catch (error: any) {
    console.error('Shift Open Error:', error);
    return NextResponse.json({ error: 'Failed to open shift' }, { status: 500 });
  }
}
