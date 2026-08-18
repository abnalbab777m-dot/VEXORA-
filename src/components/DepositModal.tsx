import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, Copy, CheckCircle2, ArrowDownToLine, Check, Building2, Wallet as WalletIcon, Network } from 'lucide-react';

export function DepositModal({ isOpen, onClose, isDemoMode, onSuccess }) {
  const [step, setStep] = useState(1);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedMethod(null);
      setAmount('');
      setSenderName('');
      setTransactionHash('');
      setError(null);
      setConfirmed(false);
      const url = `/api/wallet/payment-methods?t=${Date.now()}`;
      console.log('[DEPOSIT DEBUG] Fetching URL:', url);
      console.log('[DEPOSIT DEBUG] Window Origin:', window.location.origin);
      fetch(url, { credentials: 'include' }).then(async (res) => {
        console.log('[DEPOSIT DEBUG] HTTP Status:', res.status);
        const text = await res.text();
        console.log('[DEPOSIT DEBUG] Raw Response Body:', text);
        try {
          const data = JSON.parse(text);
          console.log('[DEPOSIT DEBUG] Parsed Data.success:', data.success);
          console.log('[DEPOSIT DEBUG] Parsed Data.data:', data.data);
          console.log('[DEPOSIT DEBUG] Number of payment methods:', data.data ? data.data.length : 0);
          if (data.success && Array.isArray(data.data)) {
            setMethods(data.data.filter((m: any) => m.isActive && m.isDepositEnabled));
          }
        } catch (e) {
          console.error('[DEPOSIT DEBUG] Failed to parse JSON:', e);
        }
      }).catch(err => {
        console.error('[DEPOSIT DEBUG] Network or Fetch Error:', err);
      });
    }
  }, [isOpen]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDeposit = async () => {
    if (isDemoMode) {
      alert('Wallet operations are unavailable in Demo Mode.');
      onClose();
      return;
    }
    setError(null);
    if (!amount || isNaN(Number(amount)) || Number(amount) < 5) {
      setError('Minimum deposit is 5 USD');
      return;
    }
    if (selectedMethod) {
      if ((selectedMethod.type === 'BANK' || selectedMethod.type === 'E_WALLET') && !senderName.trim()) {
        setError('Sender Name is required');
        return;
      }
      if (selectedMethod.type === 'CRYPTO' && !transactionHash.trim()) {
        setError('Transaction Hash (TXID) is required');
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          idempotencyKey: crypto.randomUUID(),
          paymentMethodId: selectedMethod.id,
          senderName: (selectedMethod.type === 'BANK' || selectedMethod.type === 'E_WALLET') ? senderName.trim() : undefined,
          transactionHash: selectedMethod.type === 'CRYPTO' ? transactionHash.trim() : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `Failed to deposit`);
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
          <ArrowDownToLine className="w-6 h-6 text-[#6C5CE7]" /> Deposit Funds
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{error}</div>}
        
        {step === 1 && (
          <div>
            <p className="text-gray-400 mb-4 text-sm font-medium uppercase tracking-wider">Step 1: Select Payment Method</p>
            <div className="space-y-3">
              {methods.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payment methods available.</p>
              ) : methods.map(method => (
                <button
                  key={method.id}
                  onClick={() => { setSelectedMethod(method); setStep(2); }}
                  className="w-full bg-[#070B14] hover:bg-[#131A2A] border border-white/5 hover:border-white/20 p-4 rounded-xl flex items-center gap-4 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#6C5CE7]/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {method.type === 'BANK' ? <Building2 className="w-6 h-6 text-[#6C5CE7]" /> : 
                     method.type === 'CRYPTO' ? <Network className="w-6 h-6 text-[#00D4FF]" /> :
                     <WalletIcon className="w-6 h-6 text-green-400" />}
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
            <p className="text-gray-400 mb-4 text-sm font-medium uppercase tracking-wider">Step 2: Transfer Funds</p>
            
            <div className="bg-[#070B14] border border-white/10 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-lg mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
                {selectedMethod.type === 'BANK' ? <Building2 className="w-5 h-5 text-[#6C5CE7]" /> : 
                 selectedMethod.type === 'CRYPTO' ? <Network className="w-5 h-5 text-[#00D4FF]" /> :
                 <WalletIcon className="w-5 h-5 text-green-400" />}
                {selectedMethod.name}
              </h3>
              
              <div className="space-y-4">
                {selectedMethod.details.accountHolder && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Account Holder</p>
                    <p className="font-bold text-gray-300">{selectedMethod.details.accountHolder}</p>
                  </div>
                )}
                
                {selectedMethod.details.iban && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono bg-black/50 px-3 py-2 rounded-lg flex-1 break-all text-sm">{selectedMethod.details.iban}</p>
                      <button onClick={() => handleCopy(selectedMethod.details.iban, 'iban')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg shrink-0">
                        {copied === 'iban' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedMethod.details.network && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Network</p>
                    <p className="font-bold text-gray-300">{selectedMethod.details.network}</p>
                  </div>
                )}
                
                {selectedMethod.details.address && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Address / Wallet ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono bg-black/50 px-3 py-2 rounded-lg flex-1 break-all text-sm">{selectedMethod.details.address}</p>
                      <button onClick={() => handleCopy(selectedMethod.details.address, 'address')} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg shrink-0">
                        {copied === 'address' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Deposit Amount (USD)</label>
              <input type="number" min="5" step="1" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-3 font-mono focus:outline-none focus:border-[#6C5CE7] text-lg" placeholder="Enter amount..." />
              <p className="text-xs text-gray-500 mt-2">Minimum deposit is $5.00</p>
            </div>
            {(selectedMethod.type === 'BANK' || selectedMethod.type === 'E_WALLET') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">Sender Name <span className="text-red-500">*</span></label>
                <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-3 font-medium focus:outline-none focus:border-[#6C5CE7]" placeholder="Enter the exact name of the sender..." />
              </div>
            )}
            {selectedMethod.type === 'CRYPTO' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">Transaction Hash / TXID <span className="text-red-500">*</span></label>
                <input type="text" value={transactionHash} onChange={e => setTransactionHash(e.target.value)} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-3 font-mono focus:outline-none focus:border-[#6C5CE7] text-sm" placeholder="Enter transaction hash..." />
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors mb-6">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 shrink-0 w-5 h-5 accent-[#6C5CE7]" />
              <span className="text-sm text-gray-300 leading-snug">I confirm that I have sent exactly <strong className="text-white">${amount || '0.00'}</strong> to the provided details. I understand that submitting false requests may lead to account suspension.</span>
            </label>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors">Back</button>
              <button onClick={handleDeposit} disabled={loading || !confirmed || !amount} className="flex-1 px-4 py-3 bg-[#6C5CE7] hover:bg-[#5a4cd1] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Deposit Request'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
