import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminTransactions() {
    const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        search,
        type,
        page: page.toString(),
        limit: '20'
      });
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, type, page, startDate, endDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Transactions Ledger</h1>
          <p className="text-gray-400">View platform-wide financial transactions.</p>
        </div>
      </div>

      <div className="bg-[#0F1624] p-4 rounded-2xl border border-white/5 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Transaction ID or User ID..."
            className="w-full bg-[#070B14] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] appearance-none"
            title="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] appearance-none"
            title="End Date"
          />
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] flex-1 md:w-48 appearance-none"
          >
            <option value="ALL">All Types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAW">Withdraw</option>
            <option value="MATCH_ENTRY">Match Entry</option>
            <option value="PRIZE">Prize</option>
            <option value="REFUND">Refund</option>
            <option value="COMMISSION">Commission</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold hidden sm:table-cell text-right">Balance After</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold hidden md:table-cell">Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mx-auto mb-4" />
                    <p>Loading transactions...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#EF4444]">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>{error}</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No transactions found.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-sm text-white" title={tx.id}>{tx.id.substring(0, 8)}...</div>
                      {tx.metadata && (
                        <div className="text-xs text-gray-400 mt-2 space-y-2 bg-black/20 p-2 rounded-lg border border-white/5">
                          {(tx.metadata.paymentMethodName || tx.metadata.paymentMethodType) && (
                            <div className="text-[#00D4FF] font-semibold flex items-center gap-1">
                                <span>{tx.metadata.paymentMethodName}</span>
                                {tx.metadata.paymentMethodType && <span className="text-[10px] bg-[#00D4FF]/10 text-[#00D4FF] px-1.5 py-0.5 rounded ml-1">{tx.metadata.paymentMethodType}</span>}
                            </div>
                          )}
                          {tx.metadata.senderName && (
                            <div><span className="font-semibold text-gray-300">Sender:</span> <span className="text-white">{tx.metadata.senderName}</span></div>
                          )}
                          {tx.metadata.transactionHash && (
                            <div><span className="font-semibold text-gray-300">TXID:</span> <span className="font-mono text-white bg-black/40 px-1 py-0.5 rounded">{tx.metadata.transactionHash}</span></div>
                          )}
                          {tx.metadata.withdrawalDetails && (
                            <div className="text-[11px] space-y-1 leading-tight">
                              {Object.entries(tx.metadata.withdrawalDetails).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-gray-500 uppercase tracking-widest text-[9px]">{k.replace(/([A-Z])/g, ' $1').trim()}</span> 
                                  <span className="text-white font-mono break-all">{v as string}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Link to={`/admin/users/${tx.userId}`} className="font-mono text-xs text-[#6C5CE7] hover:underline">
                        {tx.userId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        tx.type === 'DEPOSIT' || tx.type === 'PRIZE' || tx.type === 'REFUND' ? 'text-[#22C55E]' :
                        tx.type === 'WITHDRAW' || tx.type === 'MATCH_ENTRY' ? 'text-[#EF4444]' :
                        'text-[#00D4FF]'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-mono font-bold ${
                        tx.type === 'DEPOSIT' || tx.type === 'PRIZE' || tx.type === 'REFUND' ? 'text-[#22C55E]' :
                        tx.type === 'WITHDRAW' || tx.type === 'MATCH_ENTRY' ? 'text-[#EF4444]' :
                        'text-white'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'PRIZE' || tx.type === 'REFUND' ? '+' :
                         tx.type === 'WITHDRAW' || tx.type === 'MATCH_ENTRY' ? '-' : ''}
                        ${parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell">
                      <div className="font-mono text-gray-400">${parseFloat(tx.balanceAfter).toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase ${
                        tx.status === 'COMPLETED' || tx.status === 'APPROVED' ? 'text-green-500' :
                        tx.status === 'PENDING' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 hidden md:table-cell font-mono text-xs">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {tx.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/transactions/${tx.id}/approve`, {
                                  method: 'POST',
                                  
                                });
                                if (res.ok) fetchTransactions();
                              } catch (err) {}
                            }}
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt('Please enter the reason for rejection:');
                              if (reason === null) return; // User cancelled
                              try {
                                const res = await fetch(`/api/admin/transactions/${tx.id}/reject`, {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    },
                                  body: JSON.stringify({ reason: reason || 'Rejected by admin' })
                                });
                                if (res.ok) fetchTransactions();
                              } catch (err) {}
                            }}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{pagination.totalPages}</span>
              {' '} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
