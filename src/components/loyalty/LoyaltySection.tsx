import React, { useState, useEffect } from 'react';
import { Search, User, Gift, CheckCircle2, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  pointsBalance: number;
  referralCode: string | null;
}

interface LoyaltySectionProps {
  hotelId: string;
  initialPhone?: string;
  onRedeem: (amount: number, customerId: string) => void;
  onReset: () => void;
  billTotal: number;
}

export const LoyaltySection: React.FC<LoyaltySectionProps> = ({ 
  hotelId, 
  initialPhone = '', 
  onRedeem, 
  onReset,
  billTotal 
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     if (initialPhone && initialPhone.length >= 10) {
         setPhone(initialPhone);
         searchCustomer(initialPhone);
     }
  }, [initialPhone]);

  const searchCustomer = async (searchPhone: string) => {
    if (searchPhone.length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/loyalty/customer?phone=${searchPhone}&hotelId=${hotelId}`);
      const data = await res.json();
      if (data.status === 'NOT_FOUND') {
        setCustomer(null);
      } else {
        setCustomer(data);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loyalty/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, hotelId })
      });
      const data = await res.json();
      setCustomer(data);
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = async () => {
    if (!customer || redeemAmount <= 0) return;
    
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: customer.id, 
          hotelId, 
          pointsToRedeem: redeemAmount,
          otpCode: otpSent ? otpCode : undefined
        })
      });
      const data = await res.json();

      if (data.status === 'OTP_SENT_REQUIRED') {
        setOtpSent(true);
        // data.otpForDemo is used for demo purposes
        console.log("DEMO OTP:", data.otpForDemo);
      } else if (data.status === 'REDEEMED') {
        onRedeem(redeemAmount, customer.id);
        setCustomer({ ...customer, pointsBalance: data.balance });
        setRedeemAmount(0);
        setOtpSent(false);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Redemption failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    const maxRedeem = Math.min(customer?.pointsBalance || 0, billTotal * 0.5); // Cap at 50% of bill
    setRedeemAmount(Math.min(val, maxRedeem));
  };

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-webbill-burgundy/10 text-webbill-burgundy flex items-center justify-center">
          <Gift size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-sm uppercase tracking-wider">Loyalty Rewards</h3>
          <p className="text-[10px] text-webbill-muted font-bold font-mono">RUPEE-BASED POINTS SYSTEM</p>
        </div>
        {customer && (
          <button 
            onClick={() => { setCustomer(null); onReset(); }}
            className="p-2 hover:bg-gray-100 rounded-full text-webbill-muted"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!customer ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-webbill-muted" size={16} />
            <input 
              type="tel"
              placeholder="Enter Phone to Check Points..."
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (e.target.value.length >= 10) searchCustomer(e.target.value);
              }}
              className="w-full bg-webbill-cream/30 py-3 pl-12 pr-4 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-webbill-burgundy/20 font-bold text-sm"
            />
          </div>
          {loading && <div className="text-center py-2"><div className="animate-spin h-5 w-5 border-2 border-webbill-burgundy border-t-transparent rounded-full mx-auto" /></div>}
          {phone.length >= 10 && !loading && !customer && (
            <button 
              onClick={createCustomer}
              className="w-full py-3 bg-webbill-burgundy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-webbill-burgundy/20 active:scale-95 transition-transform"
            >
              Register New Loyalty Member
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center bg-webbill-burgundy/5 p-4 rounded-3xl border border-webbill-burgundy/10">
            <div>
              <p className="text-[9px] font-black text-webbill-muted uppercase tracking-[0.2em] mb-1">Current Points</p>
              <p className="text-3xl font-black text-webbill-burgundy">₹{customer.pointsBalance.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-webbill-muted uppercase tracking-[0.2em] mb-1">Referral Code</p>
              <code className="text-xs font-black bg-white px-2 py-1 rounded-lg border border-gray-200">{customer.referralCode}</code>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-webbill-muted uppercase tracking-widest leading-none">Redeem Amount</p>
                <p className="text-xl font-black text-webbill-dark">₹{redeemAmount}</p>
             </div>
             
             <input 
               type="range" 
               min="0" 
               max={Math.min(customer.pointsBalance, billTotal * 0.5)} 
               step="10"
               value={redeemAmount}
               onChange={handleSliderChange}
               className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-webbill-burgundy mt-2"
             />

             <div className="flex justify-between text-[9px] font-black text-webbill-muted/50 tracking-widest">
                <span>₹0</span>
                <span>₹{Math.min(customer.pointsBalance, billTotal * 0.5).toFixed(0)} MAX</span>
             </div>

             <div className="flex gap-2">
                {[10, 50, 100].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setRedeemAmount(Math.min(amt, customer.pointsBalance, billTotal * 0.5))}
                      className={`flex-1 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          redeemAmount === amt ? 'bg-webbill-burgundy text-white border-webbill-burgundy' : 'bg-white text-webbill-muted border-gray-100 hover:border-webbill-burgundy/30'
                      }`}
                    >
                      ₹{amt}
                    </button>
                ))}
             </div>
          </div>

          {otpSent && (
            <AnimatePresence>
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-4 bg-orange-50 border border-orange-100 rounded-2xl"
                >
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} /> Enter 4-Digit OTP
                    </p>
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            maxLength={4}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="0 0 0 0"
                            className="w-full py-3 text-center bg-white border border-orange-200 rounded-xl font-black tracking-[1em] text-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-2">
                <AlertCircle size={14} /> {error}
            </div>
          )}

          <button 
            disabled={redeemAmount <= 0 || verifying || (otpSent && otpCode.length !== 4)}
            onClick={handleRedeemClick}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                redeemAmount > 0 
                ? 'bg-webbill-burgundy text-white shadow-webbill-burgundy/20' 
                : 'bg-gray-100 text-webbill-muted shadow-none cursor-not-allowed'
            }`}
          >
            {verifying ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
                <>
                    {otpSent ? 'Confirm Redemption' : 'Apply Discount'}
                    <CheckCircle2 size={18} />
                </>
            )}
          </button>
          
          <p className="text-[9px] text-center text-webbill-muted font-bold font-mono uppercase tracking-widest opacity-60">
             OTP REQUIRED FOR REDEMPTION ABOVE ₹200
          </p>
        </motion.div>
      )}
    </div>
  );
};
