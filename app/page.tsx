'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Receipt, User, ArrowRight, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-webbill-cream font-sans antialiased text-webbill-dark overflow-x-hidden">
      {/* Premium Gradient Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
         <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-webbill-burgundy/40 blur-[120px]" />
         <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-webbill-tan/40 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-24">
        {/* Header/Nav */}
        <header className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-webbill-burgundy flex items-center justify-center text-white shadow-xl shadow-webbill-burgundy/20">
                <LayoutGrid size={20} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tighter leading-none uppercase">WebBill</h1>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-webbill-muted opacity-60">by WebCultivation</p>
             </div>
          </div>
          <div className="hidden md:flex gap-8 items-center text-[10px] font-black uppercase tracking-widest text-webbill-muted">
             <span className="cursor-pointer hover:text-webbill-burgundy transition-colors">Architecture</span>
             <span className="cursor-pointer hover:text-webbill-burgundy transition-colors">Documentation</span>
             <span className="cursor-pointer hover:text-webbill-burgundy transition-colors">Security</span>
             <div className="w-8 h-8 rounded-full border border-webbill-tan flex items-center justify-center text-[9px] font-black text-webbill-tan">WC</div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] mb-8 text-webbill-dark">
              Precision <br /> 
              <span className="text-webbill-burgundy">Hospitality</span> <br /> 
              Operating System.
            </h2>
            <p className="text-lg text-webbill-muted font-medium mb-12 max-w-md leading-relaxed">
              Experience the excellence of WebBill. Zero-latency ordering, real-time KDS, and distraction-free billing in one unified cloud ecosystem developed by WebCultivation.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-20">
               <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Network Live</span>
               </div>
               <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-webbill-tan animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest">v3.0.0 Stable</span>
               </div>
            </div>
          </motion.div>

          {/* Module Cards Grid */}
          <div className="grid gap-4">
            {[
              { 
                name: 'Waiter Panel', 
                desc: 'Mobile-first cart & table management',
                path: '/waiter', 
                icon: User, 
                color: 'bg-webbill-burgundy',
                stat: 'Fast Execution'
              },
              { 
                name: 'Kitchen Display', 
                desc: 'Real-time Kanban production board',
                path: '/kitchen', 
                icon: ChefHat, 
                color: 'bg-webbill-dark',
                stat: 'Live Sync'
              },
              { 
                name: 'Billing Counter', 
                desc: 'Distraction-free checkout & receipts',
                path: '/billing', 
                icon: Receipt, 
                color: 'bg-webbill-tan',
                stat: 'GST Ready'
              },
            ].map((panel, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                key={panel.path}
              >
                <Link href={panel.path}>
                  <div className="premium-card p-6 bg-white hover:scale-[1.02] transition-all group flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 ${panel.color} rounded-2xl flex items-center justify-center text-white shadow-xl shadow-${panel.color}/20 group-hover:rotate-6 transition-transform`}>
                        <panel.icon size={26} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-black text-lg text-webbill-dark leading-none">{panel.name}</h3>
                           <span className="text-[8px] font-black bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-webbill-muted uppercase">{panel.stat}</span>
                        </div>
                        <p className="text-xs text-webbill-muted font-medium leading-relaxed max-w-[200px]">{panel.desc}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-webbill-cream border border-gray-50 flex items-center justify-center text-webbill-burgundy group-hover:bg-webbill-burgundy group-hover:text-white transition-all shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Brand Bar */}
        <div className="mt-32 pt-12 border-t border-webbill-muted/5 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-[9px] font-black text-webbill-muted uppercase tracking-[0.4em] opacity-40">WebBill Premium Suite by WebCultivation</p>
           <div className="flex gap-8 opacity-20 filter grayscale">
              <div className="text-sm font-black italic">TRUSTED BY INDUSTRY LEADERS</div>
              <div className="w-1 h-4 bg-webbill-muted rounded-full" />
              <div className="text-sm font-black italic">GST COMPLIANT CORE</div>
           </div>
        </div>
      </div>
    </div>
  );
}
