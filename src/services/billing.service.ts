import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export class BillingService {
  /**
   * Daily Summary Logic for only the current date
   */
  static async getDailySummary(hotelId: string) {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const transactions = await prisma.transaction.findMany({
      where: {
        hotelId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        order: true,
      },
    });

    const summary = transactions.reduce(
      (acc, t) => {
        acc.totalSales += t.amount;
        acc.totalGST += t.gstAmount;
        acc.totalDiscounts += t.discount;
        return acc;
      },
      { totalSales: 0, totalGST: 0, totalDiscounts: 0, count: transactions.length }
    );

    return { transactions, summary };
  }

  /**
   * Generates WhatsApp Receipt Content & Triggers Service
   */
  static async sendWhatsAppReceipt(orderId: string, phone: string, amount: number) {
    const receiptUrl = `https://hotel.saas/receipt/${orderId}`;
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'order_completion',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: orderId },
              { type: 'text', text: `₹${amount.toFixed(2)}` },
              { type: 'text', text: receiptUrl },
            ],
          },
        ],
      },
    };

    // Generic API Trigger (Internal Service)
    const response = await fetch('https://graph.facebook.com/v18.0/WHATSAPP_ID/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  }
}
