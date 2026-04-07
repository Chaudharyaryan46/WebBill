import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelId = searchParams.get('hotelId') || 'SFB-99';

    const categories = await prisma.menuCategory.findMany({
      where: { hotelId },
      include: {
        items: {
          where: { isAvailable: true }
        }
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Menu Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
