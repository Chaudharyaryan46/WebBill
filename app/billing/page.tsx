'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, Wallet, CreditCard, 
  Search, Users, Printer,
  CheckCircle2, DollarSign, ArrowRight,
  TrendingUp, Table as TableIcon,
  Phone, User as UserIcon, Tag
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
    recentTransactions: []
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/billing/revenue?hotelId=SFB-99');
      const data = await res.json();
      if (!data.error) setStats(data);
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
          <div className="w-12 h-12 rounded-full border-2 border-webbill-burgundy overflow-hidden bg-white flex items-center justify-center shadow-lg">
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
    </div>
  );
}
