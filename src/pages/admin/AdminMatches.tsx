import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminMatches() {
    const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/matches?search=${search}&status=${status}&page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch matches');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchMatches();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, status, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Matches Management</h1>
          <p className="text-gray-400">View and manage all platform matches.</p>
        </div>
      </div>

      <div className="bg-[#0F1624] p-4 rounded-2xl border border-white/5 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Match ID or User ID..."
            className="w-full bg-[#070B14] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] flex-1 md:w-48 appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="READY">Ready</option>
            <option value="LIVE">Live</option>
            <option value="RESULT_SUBMITTED">Result Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="p-4 font-semibold">Match ID</th>
                <th className="p-4 font-semibold">Stake</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold hidden sm:table-cell">Created</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mx-auto mb-4" />
                    <p>Loading matches...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#EF4444]">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>{error}</p>
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Swords className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No matches found.</p>
                  </td>
                </tr>
              ) : (
                matches.map((match) => (
                  <tr key={match.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-sm text-white">{match.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-white font-bold">${parseFloat(match.stakeAmount).toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        match.status === 'COMPLETED' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                        match.status === 'DISPUTED' ? 'bg-yellow-500/10 text-yellow-500' :
                        match.status === 'CANCELLED' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                        'bg-[#00D4FF]/10 text-[#00D4FF]'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 hidden sm:table-cell">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/admin/matches/${match.id}`}
                        className="inline-flex px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && matches.length > 0 && (
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
