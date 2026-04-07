'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, IndianRupee, MapPin, Receipt, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/hooks/store/useCartStore';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const OrderReviewDrawer = ({ isOpen, onClose, onConfirm }: ReviewDrawerProps) => {
  const { items, updateQuantity, getTotal, clearCart } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[32px] shadow-2xl z-[201] p-6 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Receipt size={24} className="text-[#ed1c24]" />
                <h2 className="text-xl font-black">Order Review</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-4 mb-8">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">₹{item.price} each</p>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="flex items-center bg-white border border-[#ed1c24] rounded-lg text-[#ed1c24] font-bold p-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 px-3 hover:bg-[#ed1c24]/5"><IndianRupee size={12} /></button>
                        <span className="px-2 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 px-3 hover:bg-[#ed1c24]/5"><IndianRupee size={12} /></button>
                     </div>
                     <span className="font-bold w-16 text-right text-gray-800">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Billing Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 border border-dashed border-gray-300">
               <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Item Total</span>
                  <span>₹{getTotal()}</span>
               </div>
               <div className="flex justify-between text-sm text-green-600 font-medium mb-4">
                  <span>GST (5%)</span>
                  <span>+ ₹{(getTotal() * 0.05).toFixed(0)}</span>
               </div>
               <div className="h-[1px] bg-gray-200 mb-4"></div>
               <div className="flex justify-between items-center text-xl font-black">
                  <span>Grand Total</span>
                  <span className="text-[#ed1c24]">₹{(getTotal() * 1.05).toFixed(0)}</span>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
               <button 
                 onClick={() => { clearCart(); onClose(); }}
                 className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 active:scale-95 transition-all text-sm"
               >
                 Cancel Order
               </button>
               <button 
                 onClick={onConfirm}
                 className="flex-[2] py-4 px-6 bg-[#ed1c24] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#ed1c24]/20 active:scale-95 transition-all"
               >
                 <span>Place KOT Order</span>
                 <ArrowRight size={18} />
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
