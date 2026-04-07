'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Real-time Kitchen logic for KDS (Kitchen Display System)
 */
export const useKitchenOrders = (hotelId: string) => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial Load
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('Order')
        .select('*, orderItems:OrderItem(*)')
        .eq('hotelId', hotelId)
        .eq('status', 'PENDING');

      if (data) setOrders(data);
    };

    fetchOrders();

    // 2. Real-time Subscription Logic
    const channel = supabase
      .channel(`hotel-orders-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order',
          filter: `hotelId=eq.${hotelId}`,
        },
        (payload) => {
          // Instant update for the kitchen team
          setOrders((current) => [payload.new, ...current]);
          new Notification('New Order Received!'); // Local browser notification
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  return { orders };
};
