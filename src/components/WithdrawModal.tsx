import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, ArrowUpFromLine, Building2, Wallet as WalletIcon, Network } from 'lucide-react';

export function WithdrawModal({ isOpen, onClose, isDemoMode, onSuccess }) {
  const [step, setStep] = useState(1);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountIban, setAccountIban] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedMethod(null);
      setAmount('');
      setAccountName('');
      setAccountIban('');
      setWalletAddress('');
      setError(null);

      fetch('/api/wallet/payment-methods?t=' + Date.now(), { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setMethods(data.data.filter((m: any) => m.isActive && m.isWithdrawalEnabled));
          }
        })
        .catch(err => console.error('Failed to fetch methods', err));
    }
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (isDemoMode) {
      alert('Wallet operations are unavailable in Demo Mode.');
      onClose();
      return;
    }
    setError(null);
    if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
      setError('Minimum withdrawal is 10 USD');
      return;
    }
    
    let withdrawalDetails: any = {};
    if (selectedMethod.type === 'BANK') {
      if (!accountName.trim() || !accountIban.trim()) {
        setError('Account Holder Name and IBAN are required');
        return;
      }
      withdrawalDetails = { accountName: accountName.trim(), iban: accountIban.trim() };
    } else if (selectedMethod.type === 'CRYPTO') {
      if (!walletAddress.trim()) {
        setError('Wallet Address is required');
        return;
      }
      withdrawalDetails = { address: walletAddress.trim(), network: selectedMethod.details?.network || 'Unknown' };
    } else if (selectedMethod.type === 'E_WALLET') {
      if (!walletAddress.trim()) {
        setError('Account Number/ID is required');
        return;
      }
      withdrawalDetails = { address: walletAddress.trim() };
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          idempotencyKey: crypto.randomUUID(),
          paymentMethodId: selectedMethod.id,
          paymentMethodName: selectedMethod.name,
          paymentMethodType: selectedMethod.type,
          withdrawalDetails
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to withdraw`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0F1624] border border-white/10 p-6 sm:p-8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ArrowUpFromLine className="w-6 h-6 text-[#00D4FF]" /> Withdraw Funds
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{error}</div>}
        
        {step === 1 && (
          <div>
            <p className="text-gray-400 mb-4 text-sm font-medium uppercase tracking-wider">Step 1: Select Withdrawal Method</p>
            <div className="space-y-3">
              {methods.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No withdrawal methods available.</p>
              ) : methods.map(method => (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method); setStep(2); }}
                  className="w-full bg-[#070B14] hover:bg-[#131A2A] border border-white/5 hover:border-white/20 p-4 rounded-xl flex items-center gap-4 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {method.type === 'BANK' ? <Building2 className="w-6 h-6 text-[#00D4FF]" /> : 
                     method.type === 'CRYPTO' ? <Network className="w-6 h-6 text-[#00D4FF]" /> : 
                     <WalletIcon className="w-6 h-6 text-[#00D4FF]" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{method.name}</h3>
                    <p className="text-sm text-gray-500">{method.type}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {step === 2 && selectedMethod && (
          <div>
            <p className="text-gray-400 mb-4 text-sm font-medium uppercase tracking-wider">Step 2: Enter Details & Amount</p>
            
            <div className="bg-[#070B14] border border-white/10 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-lg pb-3 border-b border-white/5 flex items-center gap-2 mb-4">
                {selectedMethod.type === 'BANK' ? <Building2 className="w-5 h-5 text-[#00D4FF]" /> : 
                 selectedMethod.type === 'CRYPTO' ? <Network className="w-5 h-5 text-[#00D4FF]" /> : 
                 <WalletIcon className="w-5 h-5 text-[#00D4FF]" />}
                {selectedMethod.name}
              </h3>

              {selectedMethod.type === 'BANK' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">Account Holder Name <span className="text-red-500">*</span></label>
                    <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF]" placeholder="Exact name on bank account" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">IBAN <span className="text-red-500">*</span></label>
                    <input type="text" value={accountIban} onChange={e => setAccountIban(e.target.value)} className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00D4FF]" placeholder="TR00 0000 0000 0000 0000 0000 00" />
                  </div>
                </div>
              )}

              {selectedMethod.type === 'CRYPTO' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">Wallet Address <span className="text-red-500">*</span></label>
                    <input type="text" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00D4FF]" placeholder="Enter destination address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Network</label>
                    <p className="text-gray-300 font-bold">{selectedMethod.details?.network || 'Unknown'}</p>
                    <p className="text-xs text-yellow-500/80 mt-1">Make sure you only provide a {selectedMethod.details?.network} address to avoid loss of funds.</p>
                  </div>
                </div>
              )}

              {selectedMethod.type === 'E_WALLET' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">Account Number / ID <span className="text-red-500">*</span></label>
                    <input type="text" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00D4FF]" placeholder="Enter account details" />
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Withdrawal Amount (USD)</label>
              <input type="number" min="10" step="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-3 font-mono focus:outline-none focus:border-[#00D4FF] text-lg" placeholder="Enter amount..." />
              <p className="text-xs text-gray-500 mt-2">Minimum withdrawal is $10.00</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors">Back</button>
              <button onClick={handleWithdraw} disabled={loading || !amount} className="flex-1 px-4 py-3 bg-[#00D4FF] hover:bg-[#00badd] text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
