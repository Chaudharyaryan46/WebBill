'use client';

import { useCartStore } from './store/useCartStore';
import { useState } from 'react';

export const useOrder = () => {
  const { items, clearCart, getTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Place an order optimistically.
   * In a real app, this sends data to the API as a 'PENDING' state while
   * immediately clearing the UI cart to provide instant feedback.
   */
  const placeOrder = async (tableId: string, hotelId: string) => {
    if (items.length === 0) return;

    setIsSubmitting(true);

    // Optimistic Logic: Clear UI immediately
    const cartSnapshot = [...items];
    clearCart(); // UI feels 'instant' as cart is cleared immediately

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          hotelId,
          items: cartSnapshot,
          totalAmount: getTotal(),
        }),
      });

      if (!response.ok) {
        throw new Error('Order submission failed');
      }

      // 1. WhatsApp Receipt (Background logic)
      // triggerWhatsAppReceipt(response.data.orderId);

      return await response.json();
    } catch (error) {
      // ROLLBACK: If submission fails, restore the cart items
      console.error('Failed to submit order, rolling back cart:', error);
      items.forEach((item) => useCartStore.getState().addItem(item));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { placeOrder, isSubmitting };
};
