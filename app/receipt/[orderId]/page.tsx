'use client';

import React, { useEffect, useState } from 'react';
import { ChefHat, Printer, FileDown, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PublicReceipt({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${params.orderId}?hotelId=SFB-99`);
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error('Fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.orderId]);

  const generatePDF = () => {
    if (!order) return;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 250] // Extended height for more content
    });

    const subtotal = order.totalAmount;
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
    doc.text(`Invoice No: #${order.id.slice(-6).toUpperCase()}`, 5, 45);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 45);
    doc.text(`Table: ${order.table?.number || 'T?'}`, 5, 50);
    doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 50, 50);
    doc.text(`Covers: ${order.table?.capacity || 2}`, 5, 55);

    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 59, 75, 59);
    doc.setLineDashPattern([], 0);

    // Items Table
    const tableItems = order.items.map((item: any) => [
      item.item?.name || 'Item',
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

    doc.save(`Receipt_${order.id.slice(-4)}.pdf`);
  };

  if (loading) return (
     <div className="min-h-screen bg-webbill-cream flex flex-col items-center justify-center p-10 opacity-40">
        <div className="w-10 h-10 border-4 border-webbill-burgundy/30 border-t-webbill-burgundy rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-webbill-dark">Fetching Thermal Copy...</p>
     </div>
  );

  if (!order) return <div className="p-20 text-center font-black">Receipt not found.</div>;

  const subtotal = order.totalAmount;
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;
  const earnedPoints = Math.floor(total * 0.02);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 py-8 px-4 flex flex-col items-center pb-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-slate-50 to-gray-100">
      <div className="mb-8 w-full max-w-[400px] flex justify-between items-center px-4">
         <Link href="/billing">
           <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm hover:bg-white transition-all border border-gray-200 text-gray-600">
              <ArrowLeft size={18} />
           </div>
         </Link>
         <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-webbill-burgundy">Digital Folio</h1>
         <Link href="/">
           <div className="p-3 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm hover:bg-white transition-all border border-gray-200 text-gray-600">
              <TrendingUp size={18} />
           </div>
         </Link>
      </div>

      {/* Premium Digital Folio */}
      <div className="w-full max-w-[340px] relative">
        {/* Glow behind the card */}
        <div className="absolute inset-x-10 top-10 bottom-10 bg-blue-500/10 blur-[80px] rounded-full z-0" />

        <div className="bg-white/90 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-gray-200 rounded-[40px] relative z-10 overflow-hidden">
          
          <div className="bg-slate-50 p-8 border-b border-gray-100 text-center relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full" />
             <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-webbill-burgundy rounded-[20px] mx-auto flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(42,115,182,0.3)] border border-blue-300/50">
               <TrendingUp size={24} className="text-white" />
             </div>
             <h2 className="text-2xl font-black tracking-widest text-webbill-dark mb-1">WEBBILL</h2>
             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-webbill-tan">Fast. Digital. Done.</p>
             <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-medium">
               123 Ocean Drive, Marine City<br />
               Tel: +91 98765 43210
             </p>
             <div className="mt-5 inline-block">
               <span className="px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-[8px] font-black uppercase tracking-widest text-gray-500">GSTIN: 27AABCU9600R1ZM</span>
             </div>
          </div>

          <div className="p-8">
            <section className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
               <div>
                  <span className="block text-gray-400 text-[8px] mb-1">Inv No</span>
                  <span className="text-gray-900">#{order.id.slice(-6).toUpperCase()}</span>
               </div>
               <div>
                  <span className="block text-gray-400 text-[8px] mb-1">Date</span>
                  <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
               </div>
               <div>
                  <span className="block text-gray-400 text-[8px] mb-1">Table</span>
                  <span className="text-gray-900 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-webbill-success" /> {order.table?.number || 'T?'}</span>
               </div>
               <div>
                  <span className="block text-gray-400 text-[8px] mb-1">Covers</span>
                  <span className="text-gray-900">{order.table?.capacity || 2} Pax</span>
               </div>
            </section>

            <div className="mb-8">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                        <th className="pb-3 px-1">Item</th>
                        <th className="pb-3 text-center">Qty</th>
                        <th className="pb-3 text-right px-1">Price</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {order.items.map((item: any, idx: number) => (
                        <tr key={idx} className="text-[11px] font-medium transition-colors hover:bg-gray-50 group">
                           <td className="py-4 px-1 text-gray-800 group-hover:text-webbill-burgundy text-[10px] sm:text-[11px] leading-tight pr-4">{item.item?.name || 'Item'}</td>
                           <td className="py-4 text-center text-gray-500 font-bold">{item.quantity}</td>
                           <td className="py-4 text-right px-1 text-gray-900 font-bold whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <section className="space-y-3 pt-6 border-t border-gray-200">
               <div className="flex justify-between text-[11px] font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-800">₹{subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-[11px] font-bold text-gray-500">
                  <span>CGST (2.5%)</span>
                  <span className="text-gray-800">₹{cgst.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-[11px] font-bold text-gray-500">
                  <span>SGST (2.5%)</span>
                  <span className="text-gray-800">₹{sgst.toFixed(2)}</span>
               </div>
               
               <div className="flex justify-between text-base font-black py-5 mt-4 border-y border-gray-200 items-center">
                  <span className="text-webbill-burgundy uppercase tracking-widest text-[10px]">Grand Total</span>
                  <span className="text-2xl text-gray-900">₹{total.toFixed(2)}</span>
               </div>

               {earnedPoints > 0 && (
                 <div className="text-center pt-5 pb-2">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-webbill-burgundy shadow-[0_0_15px_rgba(42,115,182,0.05)]">
                       <span className="text-sm">✨</span>
                       <span className="text-[10px] font-black uppercase tracking-wider">
                         Earned {earnedPoints} Loyalty Pts
                       </span>
                    </div>
                 </div>
               )}
            </section>
          </div>

          <footer className="text-center py-8 bg-slate-50 border-t border-gray-100 relative overflow-hidden">
             {/* subtle bottom glow */}
             <div className="absolute inset-x-10 -bottom-10 h-20 bg-blue-500/10 blur-[40px] rounded-full" />
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700 mb-1 z-10 relative">Thank you for dining!</p>
             <p className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500 mt-6 relative z-10">WebBill Digital Standard</p>
          </footer>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-xl px-2 py-2 rounded-full border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50">
         <button 
           onClick={generatePDF}
           className="flex items-center gap-2 px-6 py-4 bg-gray-100 text-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
         >
            <FileDown size={16} className="text-cyan-600" />
            PDF Copy
         </button>
         <button 
           onClick={() => window.print()}
           className="flex items-center gap-2 px-6 py-4 bg-webbill-burgundy text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-[0_0_20px_rgba(42,115,182,0.3)]"
         >
            <Printer size={16} />
            Direct Print
         </button>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          body * { visibility: hidden; }
          .max-w-[340px], .max-w-[340px] * { 
            visibility: visible; 
            border-color: #eee !important; 
            color: black !important; 
            background: transparent !important; 
          }
          .text-amber-500 { color: black !important; }
          .text-gray-400, .text-gray-500 { color: #666 !important; }
          .max-w-[340px] { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 5mm; box-shadow: none; border: none; }
          .fixed { display: none !important; }
        }
      `}</style>
    </div>
  );
}
