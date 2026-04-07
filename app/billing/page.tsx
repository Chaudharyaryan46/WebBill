'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Wallet, CreditCard, 
  Search, Users, Printer,
  CheckCircle2, DollarSign, ArrowRight,
  TrendingUp, Table as TableIcon,
  Phone, User as UserIcon, Tag,
  X, ChevronRight, BarChart3, PieChart,
  ShieldCheck, AlertTriangle, Calendar, Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BillingDashboard() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeTables: 0,
    pendingBills: 0,
    completionRate: 100,
    growth: 0,
    breakdown: {
      Cash: 0,
      UPI: 0,
      Card: 0
    },
    totalGst: 0,
    topItems: [] as { name: string, quantity: number }[],
    hourlyStats: Array(24).fill(0),
    weeklyStats: [] as { date: string, revenue: number }[],
    recentTransactions: []
  });
  const [showInsights, setShowInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'menu' | 'tax' | 'closure'>('performance');
  const [isShiftOpen, setIsShiftOpen] = useState<boolean>(true);
  const [isStartingShift, setIsStartingShift] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/billing/revenue?hotelId=SFB-99');
      const data = await res.json();
      if (!data.error) {
        setStats(data);
        setIsShiftOpen(data.isShiftOpen);
      }
    } catch (err) {
      console.error('Stats fetch failed', err);
    }
  };

  const fetchOrders = async () => {
    try {
      await fetchStats();
      const res = await fetch('/api/orders?hotelId=SFB-99');
      const data = await res.json();
      // Filter for orders that need billing (READY or COMPLETED but not settled)
      setOrders(data.filter((o: any) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED'));
    } catch (err) {
      console.error('Billing fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const generateThermalPDF = (tableData: any) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 250] // Extended height for more content
    });

    const subtotal = tableData.total;
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;
    const earnedPoints = Math.floor(total * 0.02);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SAFFRON BAY', 40, 12, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Premium Hotel & Resort', 40, 16, { align: 'center' });
    doc.text('123 Ocean Drive, Marine City', 40, 20, { align: 'center' });
    doc.text('Tel: +91 98765 43210', 40, 24, { align: 'center' });
    doc.text('GSTIN: 27AABCU9600R1ZM', 40, 28, { align: 'center' });
    
    // Divider
    doc.setLineWidth(0.5);
    doc.line(5, 32, 75, 32);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TAX INVOICE', 40, 37, { align: 'center' });
    
    doc.line(5, 40, 75, 40);

    // Meta details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Invoice No: #${Math.random().toString(16).slice(2, 8).toUpperCase()}`, 5, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 45);
    doc.text(`Table: ${tableData.tableId}`, 5, 50);
    doc.text(`Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 50, 50);
    doc.text(`Covers: ${tableData.customers || 2}`, 5, 55);

    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 59, 75, 59);
    doc.setLineDashPattern([], 0);

    // Items Table
    const tableItems = tableData.items.map((item: any) => [
      item.name,
      item.quantity.toString(),
      ` ${item.price.toFixed(2)}`,
      ` ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 61,
      head: [['Item Description', 'Qty', 'Rate', 'Amount']],
      body: tableItems,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: { 
        0: { cellWidth: 32 }, 
        1: { cellWidth: 8, halign: 'center' }, 
        2: { cellWidth: 12, halign: 'right' }, 
        3: { cellWidth: 16, halign: 'right' } 
      },
      margin: { left: 5, right: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, finalY, 75, finalY);
    doc.setLineDashPattern([], 0);

    // Totals
    doc.setFontSize(8);
    doc.text(`Subtotal :`, 40, finalY + 5);
    doc.text(` ${subtotal.toFixed(2)}`, 74, finalY + 5, { align: 'right' });
    
    doc.text(`CGST (2.5%) :`, 40, finalY + 9);
    doc.text(` ${cgst.toFixed(2)}`, 74, finalY + 9, { align: 'right' });
    doc.text(`SGST (2.5%) :`, 40, finalY + 13);
    doc.text(` ${sgst.toFixed(2)}`, 74, finalY + 13, { align: 'right' });
    
    doc.setLineWidth(0.5);
    doc.line(5, finalY + 16, 75, finalY + 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`GRAND TOTAL:`, 5, finalY + 22);
    doc.text(`INR ${total.toFixed(2)}`, 74, finalY + 22, { align: 'right' });

    doc.line(5, finalY + 26, 75, finalY + 26);

    // Loyalty points
    if (earnedPoints > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`*** You earned ${earnedPoints} Loyalty Points ***`, 40, finalY + 32, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.line(5, finalY + 36, 75, finalY + 36);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const footerY = earnedPoints > 0 ? finalY + 42 : finalY + 32;
    doc.text('Thank you for choosing Saffron Bay!', 40, footerY, { align: 'center' });
    doc.text('We hope to see you again soon.', 40, footerY + 4, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text('Powered by WebBill Digital', 40, footerY + 12, { align: 'center' });

    doc.save(`SaffronBay_Invoice_${tableData.tableId}_${Date.now()}.pdf`);
  };

  const handleShareWhatsApp = (tableData: any, phone: string) => {
    if (!phone) return;
    
    // Using the first order ID for the public link
    const primaryOrderId = tableData.orderIds[0];
    const receiptUrl = `${window.location.origin}/receipt/${primaryOrderId}`;
    
    const itemsList = tableData.items.map((item: any) => `▪️ ${item.quantity}x ${item.name} - ₹${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    // Automatically calculate straightforward 2% points earned on grand total
    const earnedPoints = Math.floor((tableData.total * 1.05) * 0.02);
    const pointsMsg = earnedPoints > 0 ? `\n🎉 You earned *${earnedPoints} Loyalty Points* on this bill!\n` : '';
    
    const message = `*🧾 WebBill Digital Receipt - WebCultivation*\n\nHello! Your bill for *Table ${tableData.tableId}* is ready.\n\n*Order Details:*\n${itemsList}\n\n*Total Due:* ₹${(tableData.total * 1.05).toFixed(2)}\n${pointsMsg}\nYou can view and download your full thermal receipt here:\n🔗 ${receiptUrl}\n\nThank you for dining with us! 🙏`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.includes('+') ? phone : '+91' + phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Group Orders by Table for Billing
  const activeTables = orders.reduce((acc: any[], order: any) => {
    const tableNum = order.table?.number || 'T?';
    const existingTable = acc.find(a => a.tableId === tableNum);

    // Calculate this order's total from items to be safe
    const orderItemsTotal = order.items.reduce((sum: number, oi: any) => sum + (oi.price * oi.quantity), 0);

    if (existingTable) {
      existingTable.total += orderItemsTotal;
      existingTable.orderIds.push(order.id);
      // Collect items for breakdown
      order.items.forEach((oi: any) => {
        const itemName = oi.item?.name || 'Item';
        const existingItem = existingTable.items.find((i: any) => i.name === itemName);
        if (existingItem) {
          existingItem.quantity += oi.quantity;
        } else {
          existingTable.items.push({ name: itemName, quantity: oi.quantity, price: oi.price });
        }
      });
      if (order.status === 'READY') existingTable.status = 'WAITING_BILL';
    } else {
      acc.push({
        id: tableNum,
        tableId: tableNum,
        orderIds: [order.id],
        items: order.items.map((oi: any) => ({ 
          name: oi.item?.name || 'Item', 
          quantity: oi.quantity, 
          price: oi.price 
        })),
        customers: order.table?.capacity || 2, 
        total: orderItemsTotal,
        status: order.status === 'READY' ? 'WAITING_BILL' : 'EATING'
      });
    }
    return acc;
  }, []);

  const handleOpenShift = async () => {
    setIsStartingShift(true);
    try {
      const res = await fetch('/api/billing/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: 'SFB-99' })
      });
      if (res.ok) {
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to open shift', err);
    } finally {
      setIsStartingShift(false);
    }
  };

  return (
    <div className="min-h-screen bg-webbill-cream font-sans antialiased text-webbill-dark">
      {/* Sidebar/Desktop Layout Mockup - Focus on Mobile/Compact for consistency */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-webbill-burgundy shadow-xl border border-gray-100">
              <Receipt size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">WebBill</h1>
              <p className="text-webbill-muted text-[10px] font-bold uppercase tracking-widest text-webbill-burgundy/80">by WebCultivation</p>
            </div>
          </div>
          <div 
            onClick={() => setShowInsights(true)}
            className="w-12 h-12 rounded-full border-2 border-webbill-burgundy overflow-hidden bg-white flex items-center justify-center shadow-lg cursor-pointer active:scale-90 transition-all hover:bg-webbill-burgundy/5"
          >
             <TrendingUp size={20} className="text-webbill-burgundy" />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Today Revenue', value: `₹${stats.todayRevenue.toLocaleString()}`, color: 'bg-webbill-burgundy' },
            { label: 'Active Tables', value: stats.activeTables.toString(), color: 'bg-white' },
            { label: 'Pending Bills', value: stats.pendingBills.toString(), color: 'bg-white' },
            { label: 'Completion', value: `${stats.completionRate}%`, color: 'bg-white' },
          ].map((stat, idx) => (
            <div key={stat.label} className={`${stat.color} ${stat.color === 'bg-white' ? 'text-webbill-dark border border-gray-100' : 'text-white'} p-4 rounded-2xl shadow-sm`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${stat.color === 'bg-white' ? 'text-webbill-muted' : 'text-white/60'}`}>{stat.label}</p>
              <p className="text-lg font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Payment Breakdown Dashboard */}
        <div className="mb-10">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-webbill-muted mb-4">Collection Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cash', value: stats.breakdown.Cash, icon: Wallet, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'UPI', value: stats.breakdown.UPI, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Card', value: stats.breakdown.Card, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((item) => (
              <div key={item.label} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-2`}>
                   <item.icon size={18} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-webbill-muted mb-1">{item.label}</p>
                <p className="text-sm font-black text-webbill-dark">₹{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-webbill-dark text-lg">Active Tables</h3>
          <button className="text-webbill-burgundy text-xs font-black uppercase tracking-widest">View All</button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-webbill-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search Table or Order..." 
            className="w-full bg-white py-4 pl-14 pr-6 rounded-2xl border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-webbill-burgundy/20 font-medium"
          />
        </div>

        <h3 className="font-black text-lg mb-6 flex items-center gap-2">
           <TableIcon size={20} className="text-webbill-burgundy" />
           Active Tables
        </h3>
        
        <div className="grid gap-4">
          {activeTables.map((table) => (
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => setSelectedTable(table.id)}
              key={table.id}
              className={`p-5 premium-card transition-all cursor-pointer flex items-center justify-between ${
                selectedTable === table.id 
                  ? 'border-2 border-webbill-burgundy ring-4 ring-webbill-burgundy/5' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-4">
                 <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${
                    table.status === 'WAITING_BILL' ? 'bg-webbill-burgundy text-white' : 'bg-webbill-cream text-webbill-burgundy'
                 }`}>
                   <span className="text-[8px] uppercase opacity-60">Tab</span>
                   <span className="text-xl">{table.tableId}</span>
                 </div>
                 <div>
                    <h4 className="font-bold text-sm text-webbill-dark">Order #{table.id.slice(-4)}</h4>
                    <p className="text-xs text-webbill-muted font-medium flex items-center gap-1">
                       <Users size={12} /> {table.customers} Guests
                    </p>
                 </div>
              </div>

              <div className="text-right">
                 <p className="text-xl font-black text-webbill-dark">₹{table.total.toFixed(2)}</p>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${
                    table.status === 'WAITING_BILL' ? 'text-red-500 animate-pulse' : 'text-blue-500'
                 }`}>
                    {table.status.replace('_', ' ')}
                 </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Transactions Section */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              Recent Transactions
            </h3>
            <span className="text-[10px] font-bold text-webbill-muted uppercase tracking-widest">Last 10 Settlements</span>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-webbill-muted">Table</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-webbill-muted">Order ID</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-webbill-muted">Method</th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest text-webbill-muted text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentTransactions?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-xs font-bold text-webbill-muted italic">
                        No transactions recorded today yet.
                      </td>
                    </tr>
                  ) : (
                    stats.recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-webbill-cream/30 transition-colors group">
                        <td className="p-5">
                          <div className="w-8 h-8 rounded-lg bg-webbill-cream text-webbill-burgundy flex items-center justify-center font-black text-xs border border-webbill-burgundy/5">
                            {tx.order?.table?.number || 'T?'}
                          </div>
                        </td>
                        <td className="p-5">
                          <p className="text-xs font-bold text-webbill-dark">#{tx.orderId.slice(-6).toUpperCase()}</p>
                          <p className="text-[9px] text-webbill-muted font-bold">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                            tx.paymentMethod === 'Cash' ? 'bg-green-50 text-green-600' :
                            tx.paymentMethod === 'UPI' ? 'bg-blue-50 text-blue-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="p-5 text-right font-black text-sm text-webbill-burgundy">
                          ₹{tx.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Drawer */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-webbill-dark/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-[40px] shadow-2xl p-8 z-50 overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black mb-1">Final Settlement</h2>
                    <p className="text-webbill-muted text-sm font-medium">Table {selectedTable} • Premium Service</p>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="p-3 bg-webbill-cream rounded-full text-webbill-burgundy hover:bg-webbill-burgundy hover:text-white transition-colors">
                    <ArrowRight className="rotate-90" size={20} />
                  </button>
              </div>

               <div className="bg-webbill-cream rounded-3xl p-6 mb-8 border border-webbill-burgundy/5 shadow-inner">
                  {(() => {
                    const tableData = activeTables.find(t => t.tableId === selectedTable);
                    const subtotal = tableData?.total || 0;
                    const tax = subtotal * 0.05;
                    const total = subtotal + tax;
                    return (
                      <>
                        <div className="mb-6 space-y-3 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                           <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-2">Itemized Breakdown</p>
                           {tableData?.items.map((item: any, idx: number) => (
                             <div key={idx} className="flex justify-between items-center text-xs">
                               <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-white rounded flex items-center justify-center font-black text-webbill-burgundy border border-webbill-burgundy/10">{item.quantity}</span>
                                  <span className="font-bold text-webbill-dark">{item.name}</span>
                               </div>
                               <span className="font-black text-webbill-muted">₹{(item.price * item.quantity).toFixed(2)}</span>
                             </div>
                           ))}
                        </div>

                        <div className="pt-6 border-t border-webbill-burgundy/10">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-webbill-muted text-xs uppercase tracking-widest">Subtotal</span>
                            <span className="font-bold text-webbill-dark">₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-webbill-muted text-xs uppercase tracking-widest">Taxes (5%)</span>
                            <span className="font-bold text-webbill-dark">₹{tax.toFixed(2)}</span>
                          </div>
                          <div className="pt-4 flex justify-between items-center bg-white/50 -mx-6 px-6 py-4 border-y border-webbill-burgundy/5 my-4">
                             <span className="text-sm font-black text-webbill-muted uppercase tracking-[0.2em]">Total Due</span>
                             <div className="text-right">
                                <span className="text-4xl font-black text-webbill-burgundy tracking-tighter leading-none">
                                  ₹{(total + tax).toFixed(2)}
                                </span>
                             </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </div>

              {/* Customer Phone for WhatsApp Receipt */}
              <div className="mb-8">
                 <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-3">Share Receipt via WhatsApp</p>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-3 h-2/3">
                       <span className="text-xs font-black text-webbill-dark">+91</span>
                    </div>
                    <input 
                      type="tel"
                      placeholder="Enter Mobile Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-webbill-cream/50 py-4 pl-20 pr-6 rounded-2xl border border-webbill-burgundy/5 focus:outline-none focus:ring-4 focus:ring-webbill-burgundy/5 font-black text-sm tracking-widest text-webbill-dark placeholder:text-webbill-muted/40 placeholder:font-bold"
                    />
                 </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { name: 'Cash', icon: Wallet },
                    { name: 'UPI', icon: DollarSign },
                    { name: 'Card', icon: CreditCard },
                  ].map((method) => (
                    <button 
                      key={method.name}
                      onClick={() => setSelectedPaymentMethod(method.name)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        selectedPaymentMethod === method.name 
                        ? 'border-webbill-burgundy bg-webbill-burgundy/5 text-webbill-burgundy ring-4 ring-webbill-burgundy/10' 
                        : 'border-gray-50 bg-gray-50 text-webbill-muted grayscale opacity-60 hover:border-gray-100'
                      }`}
                    >
                      <method.icon size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{method.name}</span>
                    </button>
                  ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      const tableData = activeTables.find(t => t.tableId === selectedTable);
                      if (tableData) generateThermalPDF(tableData);
                    }}
                    className="h-16 rounded-2xl border-2 border-gray-100 bg-gray-50 text-webbill-muted font-black flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-[10px] uppercase tracking-[0.15em] active:scale-95"
                  >
                    <Printer size={18} />
                    Print Bill
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const tableData = activeTables.find(t => t.tableId === selectedTable);
                        if (!tableData) return;

                        const res = await fetch('/api/billing/settle', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            orderIds: tableData.orderIds,
                            paymentMethod: selectedPaymentMethod,
                            hotelId: 'SFB-99',
                            customerPhone: customerPhone
                          })
                        });

                        if (!res.ok) throw new Error('Settlement failed');
                        
                        // Share via WhatsApp after success
                        if (customerPhone) {
                          handleShareWhatsApp(tableData, customerPhone);
                        }

                        setSelectedTable(null);
                        setCustomerPhone('');
                        await fetchOrders();
                      } catch (err) {
                        alert('Settlement failed');
                      }
                    }}
                    className="h-16 btn-primary shadow-xl shadow-webbill-burgundy/20 group text-[10px] uppercase tracking-[0.15em]"
                  >
                    Settle Bill
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Business Insights Modal */}
      <AnimatePresence>
        {showInsights && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsights(false)}
              className="fixed inset-0 bg-webbill-dark/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-10 z-[70] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
               {/* Modal Sidebar */}
               <div className="w-full md:w-80 bg-webbill-cream/50 border-r border-gray-100 p-8 flex flex-col">
                  <div className="flex items-center gap-4 mb-12">
                     <div className="w-12 h-12 rounded-2xl bg-webbill-burgundy flex items-center justify-center text-white shadow-lg">
                        <TrendingUp size={24} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black">Insights</h2>
                        <p className="text-[10px] font-black uppercase text-webbill-muted tracking-widest">Business Intelligence</p>
                     </div>
                  </div>

                  <div className="flex-1 space-y-2">
                     {[
                        { id: 'performance', label: 'Performance', icon: BarChart3 },
                        { id: 'menu', label: 'Top Items', icon: PieChart },
                        { id: 'tax', label: 'Tax Summary', icon: ShieldCheck },
                        { id: 'closure', label: 'Shift Closure', icon: Calendar },
                     ].map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                              activeTab === tab.id 
                              ? 'bg-webbill-burgundy text-white shadow-xl shadow-webbill-burgundy/20' 
                              : 'text-webbill-muted hover:bg-white hover:text-webbill-dark'
                           }`}
                        >
                           <tab.icon size={18} />
                           {tab.label}
                        </button>
                     ))}
                  </div>

                  <button 
                    onClick={() => setShowInsights(false)}
                    className="mt-auto flex items-center gap-3 p-4 text-webbill-muted hover:text-red-500 font-black text-xs uppercase tracking-widest transition-all"
                  >
                    <X size={18} /> Close Panel
                  </button>
               </div>

               {/* Modal Content */}
               <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-white">
                  {activeTab === 'performance' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                        <section>
                           <div className="flex justify-between items-end mb-8">
                              <div>
                                 <h3 className="text-2xl font-black flex items-center gap-3">
                                    <BarChart3 className="text-webbill-burgundy" /> Revenue Velocity
                                 </h3>
                                 <p className="text-[10px] font-black uppercase text-webbill-muted tracking-widest mt-1">Hourly Sales Performance (24h)</p>
                              </div>
                              <div className="flex items-center gap-2 bg-webbill-burgundy/5 px-4 py-2 rounded-xl">
                                 <div className="w-2 h-2 rounded-full bg-webbill-burgundy animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-webbill-burgundy">Live Momentum</span>
                              </div>
                           </div>

                           <div className="h-72 bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-webbill-burgundy/5 p-4 relative overflow-hidden group/chart">
                              {/* Background Grid */}
                              <div className="absolute inset-x-12 inset-y-12 flex flex-col justify-between pointer-events-none">
                                 {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="w-full h-px bg-gray-50 border-t border-dashed border-gray-200" />
                                 ))}
                              </div>

                              <div className="absolute inset-x-12 inset-y-12">
                                 <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                       <linearGradient id="chart-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" stopColor="#2A73B6" stopOpacity="0.15" />
                                          <stop offset="100%" stopColor="#2A73B6" stopOpacity="0.01" />
                                       </linearGradient>
                                       <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                          <feGaussianBlur stdDeviation="1.5" result="blur" />
                                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                       </filter>
                                    </defs>

                                    {/* Area Path */}
                                    <motion.path 
                                       initial={{ pathLength: 0, opacity: 0 }}
                                       animate={{ pathLength: 1, opacity: 1 }}
                                       transition={{ duration: 1.5, ease: "easeInOut" }}
                                       d={(() => {
                                          const max = Math.max(...stats.hourlyStats, 10);
                                          const points = stats.hourlyStats.map((val: number, h: number) => ({
                                             x: (h / 23) * 100,
                                             y: 100 - (val / max) * 85 - 5
                                          }));
                                          
                                          const path = points.reduce((acc, point, i, a) => {
                                             if (i === 0) return `M ${point.x},${point.y}`;
                                             const prev = a[i - 1];
                                             const cp1x = (prev.x + point.x) / 2;
                                             return `${acc} C ${cp1x},${prev.y} ${cp1x},${point.y} ${point.x},${point.y}`;
                                          }, "");
                                          return `${path} L 100 110 L 0 110 Z`;
                                       })()}
                                       fill="url(#chart-fill)"
                                    />

                                    {/* Smooth Line Path */}
                                    <motion.path 
                                       initial={{ pathLength: 0 }}
                                       animate={{ pathLength: 1 }}
                                       transition={{ duration: 2, ease: "easeInOut" }}
                                       d={(() => {
                                          const max = Math.max(...stats.hourlyStats, 10);
                                          const points = stats.hourlyStats.map((val: number, h: number) => ({
                                             x: (h / 23) * 100,
                                             y: 100 - (val / max) * 85 - 5
                                          }));
                                          
                                          return points.reduce((acc, point, i, a) => {
                                             if (i === 0) return `M ${point.x},${point.y}`;
                                             const prev = a[i - 1];
                                             const cp1x = (prev.x + point.x) / 2;
                                             return `${acc} C ${cp1x},${prev.y} ${cp1x},${point.y} ${point.x},${point.y}`;
                                          }, "");
                                       })()}
                                       fill="none"
                                       stroke="#2A73B6"
                                       strokeWidth="3"
                                       strokeLinecap="round"
                                       filter="url(#glow)"
                                    />
                                 </svg>
                              </div>

                              {/* Interactive Overlay & Markers */}
                              <div className="absolute inset-x-12 inset-y-12 flex justify-between">
                                 {stats.hourlyStats.map((val: number, h: number) => {
                                    const max = Math.max(...stats.hourlyStats, 10);
                                    const y = (val / max) * 85 + 5;
                                    const isPeak = val > 0 && val === Math.max(...stats.hourlyStats);
                                    
                                    // 12-hour format converter
                                    const hour12 = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

                                    return (
                                       <div key={h} className="group flex-1 relative flex justify-center cursor-pointer">
                                          {/* Seeker Line */}
                                          <div className="absolute inset-y-0 w-px bg-webbill-burgundy/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          
                                          {/* Pulse Dot */}
                                          <div 
                                             style={{ bottom: `calc(${y}% - 6px)` }}
                                             className="absolute w-3 h-3 bg-white border-2 border-webbill-burgundy rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 z-10"
                                          >
                                             <div className="absolute inset-0 bg-webbill-burgundy rounded-full animate-ping opacity-20" />
                                          </div>

                                          {/* Bottom Time Label (Visible on Hover or for even hours only to avoid clutter) */}
                                          {h % 3 === 0 && (
                                             <div className="absolute -bottom-8 opacity-40 group-hover:opacity-100 transition-all">
                                                <p className="text-[7px] font-black text-webbill-muted whitespace-nowrap">{hour12}</p>
                                             </div>
                                          )}

                                          {/* Tooltip */}
                                          <div className="absolute bottom-full mb-6 bg-webbill-dark text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none z-20">
                                             <div className="px-4 py-2 border-b border-white/10 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Hourly Sales</p>
                                                <p className="text-sm font-black text-white">₹{val.toLocaleString()}</p>
                                             </div>
                                             <div className="px-4 py-1.5 flex items-center justify-center gap-2 bg-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-webbill-burgundy" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">{hour12}</span>
                                             </div>
                                          </div>

                                          {/* Peak Badge */}
                                          {isPeak && (
                                             <div 
                                                style={{ bottom: `calc(${y}% + 12px)` }}
                                                className="absolute bg-webbill-burgundy text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-10 uppercase tracking-tighter"
                                             >
                                                Peak
                                             </div>
                                          )}
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                           <div className="mt-8 flex justify-center gap-12">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full bg-webbill-burgundy/20 border border-webbill-burgundy flex items-center justify-center">
                                    <div className="w-1 h-1 rounded-full bg-webbill-burgundy" />
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-webbill-muted">Projected Revenue</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-1 rounded-full bg-webbill-burgundy/10 border-t border-dashed border-webbill-burgundy/40" />
                                 <span className="text-[9px] font-black uppercase tracking-widest text-webbill-muted">Average Baseline</span>
                              </div>
                           </div>
                        </section>

                        <section>
                           <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                              <Calendar className="text-webbill-burgundy" /> Weekly Trajectory
                           </h3>
                           <div className="bg-webbill-cream/50 p-8 rounded-[40px] border border-gray-100">
                              <div className="h-24 flex items-end gap-3 mb-6">
                                 {stats.weeklyStats.map((day: any, i: number) => {
                                    const max = Math.max(...stats.weeklyStats.map((s:any) => s.revenue), 1);
                                    const height = (day.revenue / max) * 100;
                                    return (
                                       <div key={i} className="flex-1 flex flex-col items-center">
                                          <div className="w-full flex-1 flex flex-col justify-end">
                                             <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                className={`w-full rounded-t-xl ${i === 6 ? 'bg-webbill-burgundy shadow-lg shadow-webbill-burgundy/20' : 'bg-webbill-muted/20'}`}
                                             />
                                          </div>
                                          <p className="text-[10px] font-black text-webbill-muted uppercase mt-3">{new Date(day.date).toLocaleDateString([], { weekday: 'short' })}</p>
                                          <p className="text-[10px] font-black text-webbill-dark mt-1">₹{day.revenue > 1000 ? (day.revenue/1000).toFixed(1) + 'k' : day.revenue}</p>
                                       </div>
                                    );
                                 })}
                              </div>
                              <div className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-sm">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                       <TrendingUp size={20} />
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest">Projection</p>
                                       <p className="text-sm font-black text-webbill-dark">On track for 12% Monthly Growth</p>
                                    </div>
                                 </div>
                                 <button className="text-webbill-burgundy text-[10px] font-black uppercase tracking-widest hover:underline">Full Audit</button>
                              </div>
                           </div>
                        </section>
                     </motion.div>
                  )}

                  {activeTab === 'menu' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                           <PieChart className="text-webbill-burgundy" /> Top Selling Items
                        </h3>
                        <div className="space-y-4">
                           {stats.topItems.length === 0 ? (
                              <div className="p-12 text-center bg-webbill-cream rounded-3xl border border-dashed border-webbill-muted/30">
                                 <p className="text-webbill-muted font-bold">No items sold yet today.</p>
                              </div>
                           ) : (
                              stats.topItems.map((item: any, idx: number) => (
                                 <div key={idx} className="premium-card p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                       <div className="w-14 h-14 bg-webbill-burgundy text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                          #{idx + 1}
                                       </div>
                                       <div>
                                          <h4 className="text-lg font-black text-webbill-dark">{item.name}</h4>
                                          <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest">Performance Score: High</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-2xl font-black text-webbill-burgundy">{item.quantity}</span>
                                       <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest">Units Sold</p>
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </motion.div>
                  )}

                  {activeTab === 'tax' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                           <ShieldCheck className="text-webbill-success" /> Live Tax Summary (GST)
                        </h3>
                        <div className="grid grid-cols-2 gap-8 mb-12">
                           <div className="bg-webbill-cream p-8 rounded-[40px] border border-webbill-success/10 text-center">
                              <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-4">Total CGST (2.5%)</p>
                              <p className="text-4xl font-black text-webbill-dark">₹{(stats.totalGst / 2).toLocaleString()}</p>
                           </div>
                           <div className="bg-webbill-cream p-8 rounded-[40px] border border-webbill-success/10 text-center">
                              <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-4">Total SGST (2.5%)</p>
                              <p className="text-4xl font-black text-webbill-dark">₹{(stats.totalGst / 2).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="bg-webbill-success/5 p-8 rounded-[40px] border-2 border-webbill-success/20 flex justify-between items-center">
                           <div>
                              <p className="text-xs font-black text-webbill-success uppercase tracking-widest mb-1">Combined GST Liability</p>
                              <p className="text-lg font-black text-webbill-dark">Daily Total Collection</p>
                           </div>
                           <p className="text-5xl font-black text-webbill-success">₹{stats.totalGst.toLocaleString()}</p>
                        </div>
                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4 items-center">
                           <Info className="text-webbill-muted" size={20} />
                           <p className="text-[10px] font-bold text-webbill-muted leading-relaxed">
                              Values are calculated based on a 5.0% flat GST rate (2.5% CGST + 2.5% SGST) applied to all settled items today.
                           </p>
                        </div>
                     </motion.div>
                  )}

                  {activeTab === 'closure' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-10">
                           <div>
                              <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                                 <Calendar className="text-red-500" /> End-of-Day Closure
                              </h3>
                              <p className="text-webbill-muted font-medium">Review and finalize today's business session.</p>
                           </div>
                           <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest animate-pulse">
                              Pending Closure
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-10">
                           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                              <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-2">Net Cash</p>
                              <p className="text-2xl font-black text-webbill-dark">₹{stats.breakdown.Cash.toLocaleString()}</p>
                           </div>
                           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                              <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-2">Digital (UPI/Card)</p>
                              <p className="text-2xl font-black text-webbill-dark">₹{(stats.breakdown.UPI + stats.breakdown.Card).toLocaleString()}</p>
                           </div>
                           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                              <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest mb-2">Total Sales</p>
                              <p className="text-2xl font-black text-webbill-burgundy">₹{stats.todayRevenue.toLocaleString()}</p>
                           </div>
                        </div>

                        <div className="bg-webbill-cream p-10 rounded-[40px] border-2 border-dashed border-webbill-muted/20 flex flex-col items-center text-center space-y-6">
                           <div className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/20">
                              <AlertTriangle size={40} />
                           </div>
                           <div>
                              <h4 className="text-xl font-black">Ready to close the shop?</h4>
                              <p className="text-sm text-webbill-muted max-w-md mx-auto mt-2">
                                 Closing the shift will summarize all transactions and generate a final PDF report for the owner. This action is irreversible for the current session.
                              </p>
                           </div>
                           <div className="flex gap-4 w-full max-w-md">
                              <button 
                                 onClick={async () => {
                                    // 1. Close the shift in the database
                                    try {
                                       const closeRes = await fetch('/api/billing/shift/close', {
                                           method: 'POST',
                                           headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify({ hotelId: 'SFB-99', closedBy: 'Counter Admin' })
                                       });

                                       if (!closeRes.ok) {
                                           const errData = await closeRes.json();
                                           alert(errData.error || 'Failed to close shop');
                                           return;
                                       }

                                       // 2. Generate the PDF report
                                       const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                                       doc.getFontList();
                                       doc.setFont('helvetica', 'bold');
                                       doc.setFontSize(22);
                                       doc.text('SHIFT CLOSURE REPORT', 105, 20, { align: 'center' });
                                       
                                       doc.setFontSize(10);
                                       doc.setFont('helvetica', 'normal');
                                       doc.text(`Hotel: Saffron Bay (SFB-99)`, 20, 35);
                                       doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
                                       doc.text(`Closure Time: ${new Date().toLocaleTimeString()}`, 20, 45);

                                       autoTable(doc, {
                                           startY: 55,
                                           head: [['Revenue Item', 'Amount (INR)']],
                                           body: [
                                               ['Total Revenue', stats.todayRevenue.toFixed(2)],
                                               ['Cash In Hand', stats.breakdown.Cash.toFixed(2)],
                                               ['UPI Payments', stats.breakdown.UPI.toFixed(2)],
                                               ['Card Payments', stats.breakdown.Card.toFixed(2)],
                                               ['Total GST Collected', stats.totalGst.toFixed(2)],
                                               ['Growth vs Yesterday', `${stats.growth}%`]
                                           ],
                                           theme: 'striped',
                                           headStyles: { fillColor: [42, 115, 182], textColor: [255, 255, 255] }
                                       });

                                       const finalY = (doc as any).lastAutoTable.finalY + 10;
                                       doc.setFont('helvetica', 'bold');
                                       doc.text('Top Items Sold:', 20, finalY);
                                       
                                       stats.topItems.forEach((item: any, i: number) => {
                                           doc.setFont('helvetica', 'normal');
                                           doc.text(`${i+1}. ${item.name} (x${item.quantity})`, 25, finalY + 7 + (i * 5));
                                       });

                                       doc.save(`EOD_Report_${Date.now()}.pdf`);

                                       // 3. Create WhatsApp Message
                                       const message = `*🧾 WebBill EOD Shift Closure Summary*\n\n*Hotel:* Saffron Bay\n*Date:* ${new Date().toLocaleDateString()}\n\n*Financials:*\n💰 Total Sales: ₹${stats.todayRevenue.toLocaleString()}\n💵 Cash: ₹${stats.breakdown.Cash.toLocaleString()}\n💳 Digital: ₹${(stats.breakdown.UPI + stats.breakdown.Card).toLocaleString()}\n⚖️ Tax Collected: ₹${stats.totalGst.toLocaleString()}\n📈 Daily Growth: ${stats.growth}%\n\n*Top Items:* \n${stats.topItems.map(i => `▪️ ${i.name} (x${i.quantity})`).join('\n')}\n\nShift closed successfully! ✅`;
                                       window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                       
                                       // 4. Update UI
                                       setShowInsights(false);
                                       setIsShiftOpen(false);
                                       await fetchStats();
                                    } catch (err) {
                                       console.error('Final closure failed', err);
                                       alert('Shift closure failed in database');
                                    }
                                 }}
                                 className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                              >
                                 <ShieldCheck size={20} /> Close Shop
                              </button>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Start Day Overlay */}
      <AnimatePresence>
        {!isShiftOpen && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-webbill-dark/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-center"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[50px] p-12 max-w-lg w-full shadow-2xl relative overflow-hidden"
             >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-webbill-burgundy via-blue-500 to-webbill-burgundy" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-webbill-burgundy/5 rounded-full blur-3xl" />
                
                <div className="w-24 h-24 bg-webbill-burgundy/10 text-webbill-burgundy rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                   <Calendar size={40} className="animate-bounce" />
                </div>
                
                <h2 className="text-3xl font-black text-webbill-dark mb-4">Start Your Business Day</h2>
                <p className="text-webbill-muted font-medium mb-10 leading-relaxed">
                   The shop is currently closed. To begin accepting orders and tracking revenue, please open the shift for today.
                </p>

                <button 
                  disabled={isStartingShift}
                  onClick={handleOpenShift}
                  className="w-full h-20 bg-webbill-burgundy text-white rounded-3xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-webbill-burgundy/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                   {isStartingShift ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                   ) : (
                      <>
                        <ShieldCheck size={24} />
                        Start Day
                      </>
                   )}
                </button>
                
                <p className="mt-8 text-[10px] font-black text-webbill-muted uppercase tracking-widest opacity-60">
                   System Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
