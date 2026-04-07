'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Minus, ShoppingBag, 
  Settings, User,
  CheckCircle2, ChevronLeft, LayoutGrid, Clock, Users
} from 'lucide-react';
import { useCartStore } from '@/hooks/store/useCartStore';
import { useOrder } from '@/hooks/useOrder';

// Views
type View = 'DASHBOARD' | 'MENU';

export default function WaiterPanel() {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTableOrders, setActiveTableOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [performanceScore, setPerformanceScore] = useState(8.5);
  const [menu, setMenu] = useState<any[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { placeOrder, isSubmitting } = useOrder();

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables?hotelId=SFB-99');
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    }
  };

  // Fetch all orders for table status grid
  const fetchAllOrders = async () => {
    try {
      const res = await fetch(`/api/orders?hotelId=SFB-99`);
      const data = await res.json();
      
      // Calculate today's total orders (from midnight)
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      const today = data.filter((o: any) => new Date(o.createdAt) >= startOfDay);
      setTodayOrdersCount(today.length);

      // Performance Score Calculation (Mock logic based on order volume)
      const mockPerformance = Math.min(6.0 + (today.length * 0.1), 9.9).toFixed(1);
      setPerformanceScore(Number(mockPerformance));

      setAllOrders(data.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/menu?hotelId=SFB-99`);
      const data = await res.json();
      setMenu(data);
      if (data.length > 0 && !activeCategory) {
        setActiveCategory(data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch menu', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchAllOrders();
    fetchMenu();
    const interval = setInterval(() => {
        fetchAllOrders();
        fetchTables();
    }, 3000); // Live sync every 3s
    return () => clearInterval(interval);
  }, []);

  // Fetch active orders for table when selected
  useEffect(() => {
    if (selectedTable) {
      const active = allOrders.filter((o: any) => o.table?.number === selectedTable);
      setActiveTableOrders(active);
    }
  }, [selectedTable, allOrders]);

  const handlePassOrder = async () => {
    try {
      await placeOrder(selectedTable || 'T1', 'SFB-99');
      setCurrentView('DASHBOARD');
      setSelectedTable(null);
    } catch (error) {
      alert('Failed to send order. Please try again.');
    }
  };

  // --- RENDERING DASHBOARD ---
  const renderDashboard = () => (
    <div className="p-6 bg-webbill-cream min-h-screen">
      {/* Profile Header */}
        <header className="px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50 rounded-3xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-webbill-burgundy flex items-center justify-center text-white shadow-lg shadow-webbill-burgundy/20">
              <User size={20} />
            </div>
            <div>
               <h1 className="font-black text-sm tracking-tight leading-none mb-1">WebBill</h1>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[8px] font-black text-webbill-muted uppercase tracking-widest leading-none text-webbill-burgundy/80">by WebCultivation</p>
               </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-webbill-tan flex items-center justify-center font-black text-[10px] text-webbill-tan">
             WK
          </div>
        </header>

      {/* Live Analytics Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <div className="premium-card p-5 bg-white border-b-4 border-b-webbill-burgundy relative overflow-hidden group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:rotate-12 transition-transform duration-500">
               <ShoppingBag size={40} className="text-webbill-burgundy" />
            </div>
            <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-1 relative z-10">Today's Orders</p>
            <div className="flex items-end justify-between relative z-10">
               <span className="text-3xl font-black text-webbill-dark tabular-nums">{todayOrdersCount}</span>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100 mb-1">LIVE</span>
                  <p className="text-[8px] font-black text-webbill-muted uppercase opacity-50">Volume</p>
               </div>
            </div>
         </div>
         <div className="premium-card p-5 bg-white border-b-4 border-b-webbill-tan relative overflow-hidden group">
            <div className="absolute top-2 right-2 opacity-10 group-hover:rotate-12 transition-transform duration-500">
               <Clock size={40} className="text-webbill-tan" />
            </div>
            <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-1 relative z-10">Performance</p>
            <div className="flex items-end justify-between relative z-10">
               <span className="text-3xl font-black text-webbill-dark tabular-nums">{performanceScore}</span>
               <div className="flex gap-1 mb-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: [12, 16, 12] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className={`w-1.5 rounded-full ${i < 3 ? 'bg-webbill-tan' : 'bg-gray-200'}`} 
                    />
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Tables Status Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-webbill-dark text-xs uppercase tracking-[0.2em]">Table Management</h3>
          <div className="flex gap-2">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> <span className="text-[8px] font-black text-webbill-muted uppercase">Free</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> <span className="text-[8px] font-black text-webbill-muted uppercase">Active</span></div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> <span className="text-[8px] font-black text-webbill-muted uppercase">Billed</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((table) => {
            const tableOrders = allOrders.filter(o => o.tableId === table.id);
            const isWaitingBill = tableOrders.some(o => o.status === 'READY');
            const isTaken = tableOrders.length > 0;
            const status = isWaitingBill ? 'billed' : isTaken ? 'active' : 'free';
            
            return (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                key={table.id}
                onClick={() => { setSelectedTable(table.number); setCurrentView('MENU'); }}
                className={`bg-white p-5 rounded-[28px] border-2 relative flex flex-col items-start transition-all shadow-sm ${
                    status === 'billed' ? 'border-red-500 bg-red-50/20' : 
                    status === 'active' ? 'border-orange-400 bg-orange-50/20' : 
                    'border-gray-100'
                }`}
              >
                <div className="flex justify-between w-full items-start mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        status === 'billed' ? 'bg-red-500 text-white' : 
                        status === 'active' ? 'bg-orange-400 text-white' : 
                        'bg-webbill-cream text-webbill-burgundy'
                    }`}>
                        {table.number}
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                        status === 'billed' ? 'bg-red-100 text-red-600' : 
                        status === 'active' ? 'bg-orange-100 text-orange-600' : 
                        'bg-green-100 text-green-600'
                    }`}>
                        <div className={`w-1 h-1 rounded-full ${
                             status === 'billed' ? 'bg-red-500 animate-pulse' : 
                             status === 'active' ? 'bg-orange-500' : 
                             'bg-green-500'
                        }`} />
                        {status}
                    </div>
                </div>

                <div className="flex flex-col items-start gap-1">
                    <p className="text-[9px] font-black text-webbill-muted uppercase tracking-widest leading-none">Capacity</p>
                    <div className="flex items-center gap-1 text-webbill-dark">
                        <Users size={12} className="opacity-40" />
                        <span className="text-sm font-black tracking-tight">{table.capacity} Seats</span>
                    </div>
                </div>

                {isTaken && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 w-full">
                         <p className="text-[8px] font-black text-webbill-muted uppercase tracking-widest mb-1.5">Active Order</p>
                         <p className="text-[10px] font-bold text-webbill-dark truncate">
                             {tableOrders[0]?.items?.length || 0} Items • ₹{tableOrders[0]?.totalAmount || 0}
                         </p>
                    </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // --- RENDERING MENU/ORDERING ---
  const renderMenu = () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between items-center mb-8 mt-4">
           <button onClick={() => setCurrentView('DASHBOARD')} className="p-3 bg-white shadow-xl shadow-gray-200/50 rounded-full border border-gray-50 active:scale-90 transition-all">
              <ChevronLeft className="text-webbill-dark" size={20} />
           </button>
           <h3 className="font-bold text-webbill-dark text-lg">Table - {selectedTable || 'T3'}</h3>
           <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-100">
                <span className="font-bold text-webbill-dark text-sm">T</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-webbill-burgundy shadow-lg flex items-center justify-center border border-white">
                <LayoutGrid className="text-white" size={16} />
              </div>
           </div>
        </div>

      {/* Active Table Items (Already Passed) */}
      <AnimatePresence>
        {activeTableOrders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-6 mb-6"
          >
            <div className="bg-webbill-burgundy/5 rounded-3xl p-4 border border-webbill-burgundy/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-webbill-burgundy uppercase tracking-widest">Active Table Items</h4>
                <span className="text-[9px] font-bold text-webbill-muted bg-white px-2 py-0.5 rounded-full border border-gray-100">Live Production</span>
              </div>
              <div className="space-y-2">
                {activeTableOrders.map((order: any) => (
                  order.items.map((item: any, idx: number) => (
                    <div key={`${order.id}-${idx}`} className="flex justify-between items-center">
                       <span className="text-xs font-bold text-webbill-dark">
                         <span className="text-webbill-burgundy opacity-60 mr-1">x{item.quantity}</span> {item.item?.name || 'Item'}
                       </span>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                         order.status === 'READY' ? 'bg-green-100 text-green-600' : 'bg-webbill-tan/20 text-webbill-tan'
                       }`}>
                         {order.status}
                       </span>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Category Tabs */}
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar mb-4">
        {menu.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeCategory === cat.name
                ? 'bg-webbill-burgundy text-white shadow-lg shadow-webbill-burgundy/20 ring-2 ring-webbill-burgundy/20'
                : 'bg-white text-webbill-muted border border-gray-100 hover:border-webbill-tan'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      </div>

      {/* Item List */}
      <div className="px-6 space-y-6 pb-32">
        {isLoadingMenu ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
             <div className="w-8 h-8 border-4 border-webbill-burgundy/30 border-t-webbill-burgundy rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest">Compiling Menu...</p>
          </div>
        ) : (
          menu.find(c => c.name === activeCategory)?.items.map((item: any) => {
            const cartItem = items.find(i => i.id === item.id);
            return (
              <motion.div 
                initial={{ opacity:0, x: 20 }}
                animate={{ opacity:1, x: 0 }}
                key={item.id} 
                className="flex items-center gap-4 group premium-card p-3"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 shrink-0 bg-webbill-cream flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                  ) : (
                    <div className="text-webbill-burgundy/20 font-black text-xl">{item.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-webbill-dark mb-0.5">{item.name}</h4>
                  <p className="text-[10px] text-webbill-muted font-bold leading-tight mb-1.5 line-clamp-2">{item.description || 'Delicious freshly prepared selection'}</p>
                  <p className="text-webbill-burgundy font-black text-xs">₹{item.price}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                  {cartItem && cartItem.quantity > 0 ? (
                    <>
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-webbill-burgundy border border-gray-100 shadow-sm active:scale-90 transition-all font-bold"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-black text-webbill-dark min-w-[20px] text-center">{cartItem.quantity}</span>
                      <button 
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
                        className="w-8 h-8 bg-webbill-burgundy rounded-lg flex items-center justify-center text-white shadow-md active:scale-90 transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
                      className="px-4 py-2 bg-webbill-burgundy rounded-lg text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
                    >
                      ADD <Plus size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Zomato-style Wide Bottom Order Bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
          >
             <div className="bg-webbill-burgundy rounded-2xl p-4 flex justify-between items-center shadow-xl shadow-webbill-burgundy/20">
                <div className="text-white">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Selected Items: {items.reduce((acc, i) => acc + i.quantity, 0)}</p>
                  <p className="text-lg font-black">₹{items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)}</p>
                </div>
                <button 
                  onClick={handlePassOrder}
                  disabled={isSubmitting}
                  className={`bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20 uppercase tracking-tight ${isSubmitting ? 'opacity-50' : ''}`}
                >
                  {isSubmitting ? 'Sending...' : 'Pass Order'} <ShoppingBag size={16} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="antialiased select-none font-sans bg-webbill-cream">
      <AnimatePresence mode="wait">
        {currentView === 'DASHBOARD' && (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderDashboard()}
          </motion.div>
        )}
        {currentView === 'MENU' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderMenu()}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
