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
    
    // Get Active Shift
    const activeShift = await prisma.shift.findFirst({
        where: {
            hotelId,
            status: 'OPEN'
        },
        orderBy: {
            startTime: 'desc'
        }
    });

    // If no shift is open, revenue for the current view is 0
    if (!activeShift) {
        return NextResponse.json({
            todayRevenue: 0,
            yesterdayRevenue: 0,
            growth: 0,
            activeTables: 0,
            pendingBills: 0,
            completionRate: 100,
            breakdown: { Cash: 0, UPI: 0, Card: 0 },
            totalGst: 0,
            topItems: [],
            hourlyStats: Array(24).fill(0),
            weeklyStats: [],
            recentTransactions: [],
            isShiftOpen: false
        });
    }

    const startTime = activeShift.startTime;
    const endTime = endOfToday; // For aggregates up to now

    // 1. Get Today Revenue (Active Shift)
    const todayTransactions = await prisma.transaction.aggregate({
      where: {
        hotelId: hotelId,
        createdAt: {
          gte: startTime,
          lte: endTime
        }
      },
      _sum: {
        amount: true
      }
    });

    const todayRevenue = todayTransactions._sum.amount || 0;

    // 2. Get Yesterday Revenue for growth
    const yesterday = subDays(today, 1);
    const startOfYesterday = startOfDay(yesterday);
    const endOfYesterday = endOfDay(yesterday);

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

    // 5. Completion Rate (Current Shift)
    const totalTodayOrders = await prisma.order.count({
        where: {
            hotelId,
            createdAt: {
                gte: startTime,
                lte: endTime
            }
        }
    });

    const completedTodayOrders = await prisma.order.count({
        where: {
            hotelId,
            status: 'COMPLETED',
            createdAt: {
                gte: startTime,
                lte: endTime
            }
        }
    });

    const completionRate = totalTodayOrders > 0 
        ? Math.round((completedTodayOrders / totalTodayOrders) * 100) 
        : 100;

    // 6. Revenue Breakdown by Payment Method (Current Shift)
    const transactionsToday = await prisma.transaction.findMany({
        where: {
            hotelId,
            createdAt: {
                gte: startTime,
                lte: endTime
            }
        }
    });

    const breakdown = {
        Cash: 0,
        UPI: 0,
        Card: 0
    };
    
    let totalGst = 0;
    // We'll keep hourly stats for the last 24 hours regardless of shift to show momentum
    const hourlyBreakdown = Array(24).fill(0);
    const momentumStart = subDays(today, 1);

    const momentumTransactions = await prisma.transaction.findMany({
        where: {
            hotelId,
            createdAt: {
                gte: momentumStart,
                lte: endTime
            }
        }
    });

    momentumTransactions.forEach((tx: any) => {
        const hour = new Date(tx.createdAt).getHours();
        hourlyBreakdown[hour] += tx.amount;
    });

    transactionsToday.forEach((tx: any) => {
        if (tx.paymentMethod && tx.paymentMethod in breakdown) {
            breakdown[tx.paymentMethod as keyof typeof breakdown] += tx.amount || 0;
        }
        totalGst += tx.gstAmount || 0;
    });

    // 7. Top 5 Selling Items Today (Current Shift)
    const topOrderItems = await prisma.orderItem.groupBy({
        by: ['itemId'],
        where: {
            order: {
                hotelId,
                createdAt: {
                    gte: startTime,
                    lte: endTime
                }
            }
        },
        _sum: {
            quantity: true
        },
        orderBy: {
            _sum: {
                quantity: 'desc'
            }
        },
        take: 5
    });

    const topItems = await Promise.all(topOrderItems.map(async (oi) => {
        const item = await prisma.menuItem.findUnique({
            where: { id: oi.itemId },
            select: { name: true }
        });
        return {
            name: item?.name || 'Unknown',
            quantity: oi._sum.quantity || 0
        };
    }));

    // 8. Weekly History (last 7 days)
    const weeklyStats = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
        const date = subDays(today, i);
        const start = startOfDay(date);
        const end = endOfDay(date);
        
        const dayRevenue = await prisma.transaction.aggregate({
            where: {
                hotelId,
                createdAt: { gte: start, lte: end }
            },
            _sum: { amount: true }
        });

        return {
            date: date.toISOString().split('T')[0],
            revenue: dayRevenue._sum.amount || 0
        };
    })).then(stats => stats.reverse());

    // 9. Get Recent Transactions (Current Shift)
    const recentTransactions = await prisma.transaction.findMany({
        where: {
            hotelId: hotelId,
            createdAt: {
                gte: startTime,
                lte: endTime
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
        totalGst: totalGst,
        topItems: topItems,
        hourlyStats: hourlyBreakdown,
        weeklyStats: weeklyStats,
        recentTransactions: recentTransactions,
        isShiftOpen: true,
        shiftStartTime: startTime
    });
  } catch (error: any) {
    console.error('Revenue API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
