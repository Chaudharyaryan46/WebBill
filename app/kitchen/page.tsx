'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Clock, ChevronLeft, Bell, Settings, Filter, Flame
} from 'lucide-react';
import Link from 'next/link';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?hotelId=SFB-99');
      const data = await res.json();
      // Format data for UI
      const formatted = data.map((o: any) => ({
        id: o.id,
        table: o.table?.number || 'T?',
        items: o.items.map((i: any) => ({ name: i.item?.name || 'Item', quantity: i.quantity })),
        time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: o.status,
        late: (new Date().getTime() - new Date(o.createdAt).getTime()) > 15 * 60 * 1000 // 15 mins
      }));
      setOrders(formatted);
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000); // Polling every 2s
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id: string, nextStatus: string) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      console.error('Status update failed', err);
      fetchOrders(); // Rollback/Refetch on error
    }
  };

  const renderColumn = (title: string, status: string, color: string) => {
    const filteredOrders = orders.filter(o => o.status === status);
    
    return (
      <div className="min-w-[320px] md:min-w-[400px] flex-1 flex flex-col h-full bg-white/30 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm overflow-hidden">
        {/* Kanban Column Header */}
        <div className="p-5 border-b border-white/50 flex justify-between items-center bg-white/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-lg`}>
                {status === 'PENDING' ? <Clock size={16} /> : <ChefHat size={16} />}
             </div>
             <h2 className="font-black text-sm uppercase tracking-widest text-dineflow-dark">{title}</h2>
          </div>
          <span className="bg-dineflow-burgundy text-white text-[10px] font-black px-2 py-0.5 rounded-full">{filteredOrders.length}</span>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1 pb-32">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.1 }}
                 key="empty"
                 className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-dineflow-dark rounded-2xl"
               >
                  <Clock size={24} className="mb-2" />
                  <p className="text-[10px] font-black uppercase">No active projects</p>
               </motion.div>
            ) : filteredOrders.map((order) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order.id} 
                className={`premium-card p-5 bg-white border-l-4 relative shadow-sm ${order.late ? 'border-l-red-500 ring-2 ring-red-500/10 animate-pulse-subtle' : 'border-l-dineflow-burgundy'}`}
              >
                {order.late && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg rotate-12 uppercase tracking-widest">
                    Delayed
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] font-black text-dineflow-muted uppercase tracking-widest mb-1">Order #{order.id}</p>
                    <h3 className="text-xl font-black text-dineflow-dark">Table {order.table}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-dineflow-muted bg-gray-50 px-2 py-1 rounded-lg">
                    <Clock size={10} />
                    <span>{order.time}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-black text-dineflow-dark"><span className="text-dineflow-burgundy mr-1">x{item.quantity}</span> {item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {status === 'PENDING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="flex-1 bg-dineflow-dark text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      Start Prep
                    </button>
                  )}
                  {status === 'PREPARING' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-webbill-cream flex flex-col font-sans antialiased text-webbill-dark overflow-hidden">
      {/* Top Navigation */}
      <div className="px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer">
              <ChevronLeft size={20} />
            </div>
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-tight">WebBill</h1>
            <p className="text-[9px] font-bold text-webbill-muted uppercase tracking-widest text-webbill-burgundy/80">by WebCultivation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-webbill-dark">Terminal 01</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
              <Flame size={14} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-webbill-dark">Live Monitor</span>
            </div>
          </div>
          <div className="p-2.5 bg-webbill-burgundy text-white rounded-xl shadow-lg shadow-webbill-burgundy/20 cursor-pointer active:scale-95 transition-transform">
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full min-w-max items-stretch pb-20">
          {renderColumn('Pending Orders', 'PENDING', 'bg-webbill-burgundy')}
          {renderColumn('In Preparation', 'PREPARING', 'bg-webbill-tan')}
        </div>
      </div>

      {/* Bottom Quick Stats */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-between items-center px-8 fixed bottom-0 left-0 right-0 z-50">
         <div className="flex gap-8">
            <div>
               <p className="text-[9px] font-black text-webbill-muted uppercase tracking-widest">Avg Prep Time</p>
               <p className="text-sm font-black">12.4 mins</p>
            </div>
            <div>
               <p className="text-[9px] font-black text-webbill-muted uppercase tracking-widest">Load Factor</p>
               <p className="text-sm font-black text-green-600">Optimal</p>
            </div>
         </div>
         <div className="flex gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl text-webbill-muted hover:bg-gray-100 transition-colors cursor-pointer">
               <Filter size={18} />
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl text-webbill-muted hover:bg-gray-100 transition-colors cursor-pointer">
               <Settings size={18} />
            </div>
         </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
