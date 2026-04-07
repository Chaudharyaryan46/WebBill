import { prisma } from '@/lib/db';

export class SuperAdminService {
  /**
   * Onboard a new hotel tenant
   */
  static async onboardHotel(data: { name: string; slug: string; days: number }) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + data.days);

    return await prisma.hotel.create({
      data: {
        name: data.name,
        slug: data.slug,
        subscriptionExpiry: expiry,
        isActive: true,
      },
    });
  }

  /**
   * Manage hotel subscription and activation
   */
  static async updateHotelStatus(hotelId: string, isActive: boolean, days?: number) {
    let expiry = undefined;
    if (days) {
      expiry = new Date();
      expiry.setDate(expiry.getDate() + days);
    }

    return await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        isActive,
        ...(expiry && { subscriptionExpiry: expiry }),
      },
    });
  }

  /**
   * Global control panel stats
   */
  static async getGlobalStats() {
    const [totalHotels, activeHotels, totalOrders] = await Promise.all([
      prisma.hotel.count(),
      prisma.hotel.count({ where: { isActive: true } }),
      prisma.order.count(),
    ]);

    return { totalHotels, activeHotels, totalOrders };
  }
}
