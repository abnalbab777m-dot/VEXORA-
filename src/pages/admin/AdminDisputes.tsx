import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldAlert, Eye, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminDisputes() {
    const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    
    const fetchDisputes = async () => {
      try {
        const res = await fetch('/api/admin/disputes');
        const data = await res.json();
        if (data.success) {
          setDisputes(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch disputes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter(d => filter === 'ALL' || d.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-[#EF4444]" />
            Dispute Resolution
          </h1>
          <p className="text-gray-400">Admin oversight and match conflict resolution.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider font-bold">Total</p>
          <p className="text-3xl font-black">{disputes.length}</p>
        </div>
        <div className="bg-[#0F1624] border border-[#EF4444]/20 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-[#EF4444] text-sm mb-1 uppercase tracking-wider font-bold">Open</p>
          <p className="text-3xl font-black">{disputes.filter(d => d.status === 'OPEN').length}</p>
        </div>
        <div className="bg-[#0F1624] border border-yellow-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-yellow-500 text-sm mb-1 uppercase tracking-wider font-bold">Under Review</p>
          <p className="text-3xl font-black">{disputes.filter(d => d.status === 'UNDER_REVIEW').length}</p>
        </div>
        <div className="bg-[#0F1624] border border-green-500/20 rounded-2xl p-4 flex flex-col justify-center">
          <p className="text-green-500 text-sm mb-1 uppercase tracking-wider font-bold">Resolved</p>
          <p className="text-3xl font-black">{disputes.filter(d => d.status === 'RESOLVED').length}</p>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-2">
          {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#070B14]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Match ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Players</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stake</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading disputes...</td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No disputes found.</td>
                </tr>
              ) : (
                filteredDisputes.map(dispute => (
                  <tr key={dispute.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs bg-black/30 px-2 py-1 rounded border border-white/5">
                        {dispute.matchId.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{dispute.player1?.username || 'Unknown'}</span>
                        <span className="text-gray-600 text-xs">vs</span>
                        <span className="font-bold text-sm">{dispute.player2?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-[#22C55E]">
                      ${dispute.match ? (parseFloat(dispute.match.stakeAmount) * 2).toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dispute.status === 'OPEN' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase bg-[#EF4444]/10 text-[#EF4444]"><AlertTriangle className="w-3 h-3" /> OPEN</span>}
                      {dispute.status === 'UNDER_REVIEW' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-500/10 text-yellow-500"><Search className="w-3 h-3" /> REVIEW</span>}
                      {dispute.status === 'RESOLVED' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase bg-[#22C55E]/10 text-[#22C55E]"><CheckCircle className="w-3 h-3" /> RESOLVED</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/admin/disputes/${dispute.id}`} className="text-[#00D4FF] hover:text-white flex items-center justify-end gap-1 transition-colors">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
