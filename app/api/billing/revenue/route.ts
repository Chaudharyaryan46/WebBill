import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'Missing hotelId' }, { status: 400 });
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    const yesterday = subDays(today, 1);
    const startOfYesterday = startOfDay(yesterday);
    const endOfYesterday = endOfDay(yesterday);

    // 1. Get Today Revenue
    const todayTransactions = await prisma.transaction.aggregate({
      where: {
        hotelId: hotelId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      _sum: {
        amount: true
      }
    });

    const todayRevenue = todayTransactions._sum.amount || 0;

    // 2. Get Yesterday Revenue for growth
    const yesterdayTransactions = await prisma.transaction.aggregate({
      where: {
        hotelId: hotelId,
        createdAt: {
          gte: startOfYesterday,
          lte: endOfYesterday
        }
      },
      _sum: {
        amount: true
      }
    });

    const yesterdayRevenue = yesterdayTransactions._sum.amount || 0;
    const growth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 100;

    // 3. Get Active Tables (tables with non-completed/non-cancelled orders)
    const activeOrders = await prisma.order.findMany({
      where: {
        hotelId,
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      },
      select: {
          tableId: true,
          status: true
      }
    });

    const activeTableIds = new Set(activeOrders.map(o => o.tableId));
    const activeTablesCount = activeTableIds.size;

    // 4. Get Pending Bills (orders ready but not completed)
    const pendingBillsCount = activeOrders.filter(o => o.status === 'READY').length;

    // 5. Completion Rate (today)
    const totalTodayOrders = await prisma.order.count({
        where: {
            hotelId,
            createdAt: {
                gte: startOfToday,
                lte: endOfToday
            }
        }
    });

    const completedTodayOrders = await prisma.order.count({
        where: {
            hotelId,
            status: 'COMPLETED',
            createdAt: {
                gte: startOfToday,
                lte: endOfToday
            }
        }
    });

    const completionRate = totalTodayOrders > 0 
        ? Math.round((completedTodayOrders / totalTodayOrders) * 100) 
        : 100;

    // 6. Revenue Breakdown by Payment Method (Today)
    const paymentBreakdown = await prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: {
            hotelId,
            createdAt: {
                gte: startOfToday,
                lte: endOfToday
            }
        },
        _sum: {
            amount: true
        }
    });

    const breakdown = {
        Cash: 0,
        UPI: 0,
        Card: 0
    };

    paymentBreakdown.forEach((item: any) => {
        if (item.paymentMethod && item.paymentMethod in breakdown) {
            breakdown[item.paymentMethod as keyof typeof breakdown] = item._sum.amount || 0;
        }
    });

    // 7. Get Recent Transactions (today)
    const recentTransactions = await prisma.transaction.findMany({
        where: {
            hotelId: hotelId,
            createdAt: {
                gte: startOfToday,
                lte: endOfToday
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10,
        include: {
            order: {
                include: {
                    table: true
                }
            }
        }
    });

    return NextResponse.json({
        todayRevenue,
        yesterdayRevenue,
        growth: Math.round(growth * 10) / 10,
        activeTables: activeTablesCount,
        pendingBills: pendingBillsCount,
        completionRate: completionRate,
        breakdown: breakdown,
        recentTransactions: recentTransactions
    });

  } catch (error: any) {
    console.error('Revenue API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
