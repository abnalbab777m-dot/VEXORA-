import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { DepositModal } from '../components/DepositModal';
import { WithdrawModal } from '../components/WithdrawModal';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Wallet() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'DEPOSIT' | 'WITHDRAW'>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/wallet/transactions')
      ]);
      const walletData = await walletRes.json();
      const txData = await txRes.json();

      if (walletRes.ok && walletData.success) {
        setWallet(walletData.data);
      } else {
        setError(walletData.error?.message || 'Failed to load wallet');
      }
      
      if (txRes.ok && txData.success) {
        setTransactions(txData.data);
      } else {
        if (!error) setError(txData.error?.message || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    if (isDemoMode) {
      alert('Wallet operations are unavailable in Demo Mode.');
      setIsDepositModalOpen(false);
      setIsWithdrawModalOpen(false);
      return;
    }
  };

  const filteredTransactions = transactions.filter(t => activeTab === 'all' || t.type === activeTab);

  // Calculate monthly spending budget (Match Entries)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const spentThisMonth = transactions
    .filter(t => 
      t.type === 'MATCH_ENTRY' && 
      t.status === 'COMPLETED' && 
      new Date(t.createdAt).getMonth() === currentMonth &&
      new Date(t.createdAt).getFullYear() === currentYear
    )
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  
  // Calculate a "budget" based on balance + spent this month, 
  // minimum $100 to avoid 100% on $0 balance.
  const baseTotal = parseFloat(wallet?.balance || '0') + spentThisMonth;
  const budgetTotal = Math.max(100, baseTotal); 
  const spendPercentage = Math.min(100, Math.round((spentThisMonth / budgetTotal) * 100));
  const circleCircumference = 2 * Math.PI * 36; // r=36
  const strokeDashoffset = circleCircumference - (spendPercentage / 100) * circleCircumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
      {/* Deposit Modal */}
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
        isDemoMode={isDemoMode}
        onSuccess={fetchData}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        isDemoMode={isDemoMode}
        onSuccess={fetchData}
      />

      <h1 className="text-3xl font-bold mb-8">Wallet</h1>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">{error}</div>
      ) : wallet && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Balance */}
            <div className="md:col-span-2 bg-gradient-to-br from-[#6C5CE7] to-[#00D4FF] rounded-2xl p-[1px]">
              <div className="bg-[#0F1624] rounded-2xl p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-gray-300 uppercase tracking-wider text-sm font-medium">
                      <WalletIcon className="w-5 h-5" /> Total Balance
                    </div>
                  </div>
                  <div className="text-5xl font-black font-mono tracking-tight mb-2">${wallet.balance}</div>
                  <p className="text-gray-400 text-sm">~$ {wallet.balance} USD</p>
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                    <ArrowDownToLine className="w-5 h-5" /> Deposit
                  </button>
                  <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/10 flex items-center justify-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5" /> Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Balances & Stats */}
            <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-[#070B14] rounded-xl border border-white/5 flex flex-col justify-center">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-medium">Available</p>
                  <p className="text-xl font-bold font-mono text-white">${wallet.availableBalance}</p>
                </div>
                <div className="p-4 bg-[#070B14] rounded-xl border border-white/5 flex flex-col justify-center">
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-medium">Locked</p>
                  <p className="text-xl font-bold font-mono text-gray-400">${wallet.lockedBalance}</p>
                </div>
              </div>
              
              {/* Circular Gauge */}
              <div className="flex-1 p-4 bg-[#070B14] rounded-xl border border-white/5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-medium">Monthly Spend</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold font-mono text-white">${spentThisMonth.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total match entries this month</p>
                </div>
                
                <div className="relative w-20 h-20 flex-shrink-0">
                  {/* Background Circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#1F2937"
                      strokeWidth="6"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke={spendPercentage > 80 ? '#EF4444' : spendPercentage > 50 ? '#F59E0B' : '#6C5CE7'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{spendPercentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center px-2 mt-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Deposits</p>
                  <p className="font-mono text-sm">${wallet.totalDeposits}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Withdrawals</p>
                  <p className="font-mono text-sm">${wallet.totalWithdrawals}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold">Transaction Ledger</h2>
              <div className="flex bg-[#070B14] p-1 rounded-lg border border-white/5">
                {['all', 'DEPOSIT', 'WITHDRAW'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                      activeTab === tab ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#070B14] text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="p-4 font-semibold">Transaction ID / Type</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            trx.type.includes('WIN') || trx.type === 'DEPOSIT' || trx.type === 'REFUND'
                              ? 'bg-[#22C55E]/10 text-[#22C55E]' 
                              : 'bg-white/5 text-gray-400'
                          }`}>
                            {trx.type === 'DEPOSIT' ? <ArrowDownToLine className="w-5 h-5" /> : 
                             trx.type === 'WITHDRAW' ? <ArrowUpFromLine className="w-5 h-5" /> :
                             <WalletIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {trx.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500 font-mono" title={trx.id}>{trx.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{new Date(trx.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {trx.status === 'COMPLETED' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                          ) : trx.status === 'PENDING' ? (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#EF4444]" />
                          )}
                          <span className="text-xs font-bold text-gray-300">{trx.status}</span>
                        </div>
                      </td>
                      <td className={`p-4 text-right font-mono font-bold ${
                        ['DEPOSIT', 'PRIZE', 'REFUND'].includes(trx.type) ? 'text-[#22C55E]' : 'text-white'
                      }`}>
                        {['DEPOSIT', 'PRIZE', 'REFUND'].includes(trx.type) ? '+' : '-'}${trx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
