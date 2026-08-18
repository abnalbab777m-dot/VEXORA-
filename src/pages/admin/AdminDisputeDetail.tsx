import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminDisputeDetail() {
  const { id } = useParams();
    const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDispute = async () => {
      try {
        const res = await fetch(`/api/admin/disputes/${id}`);
        const d = await res.json();
        if (d.success) {
          setData(d.data);
        } else {
          setError(d.error?.message || 'Failed to load dispute');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchDispute();
  }, [id]);

  const handleResolve = async (resolution: string) => {
    if (!confirm(`Are you sure you want to execute resolution: ${resolution}? This action is final.`)) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ resolution })
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        setError(d.error?.message || 'Failed to resolve dispute');
      } else {
        // Refresh data
        setData({ ...data, dispute: d.data });
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading dispute details...</div>;
  }

  if (!data || !data.dispute) {
    return <div className="p-10 text-center text-red-500">{error || 'Dispute not found'}</div>;
  }

  const { dispute, match, result, player1, player2, openedBy } = data;
  
  const totalStake = (parseFloat(match.stakeAmount) * 2).toFixed(2);
  const commission = (parseFloat(totalStake) * 0.15).toFixed(2);
  const prize = (parseFloat(totalStake) - parseFloat(commission)).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 w-full">
      <AdminNavigation />
      <Link to="/admin/disputes" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-bold">
        <ArrowLeft className="w-4 h-4" /> Back to Disputes
      </Link>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Dispute Overview
          </h1>
          <p className="text-gray-400 font-mono text-sm">ID: {dispute.id}</p>
        </div>
        <div>
          {dispute.status === 'RESOLVED' ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-[#22C55E]/10 text-[#22C55E]">
              <CheckCircle className="w-5 h-5" /> RESOLVED ({dispute.resolution})
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-[#EF4444]/10 text-[#EF4444]">
              <AlertTriangle className="w-5 h-5" /> {dispute.status}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-8">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* MATCH DETAILS */}
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
            Match Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Match ID</span>
              <span className="font-mono text-white">{match.id.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Status</span>
              <span className="font-bold text-white">{match.status}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Total Pool</span>
              <span className="font-mono text-[#22C55E] font-bold">${totalStake}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Commission (15%)</span>
              <span className="font-mono text-[#EF4444] font-bold">-${commission}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Potential Prize</span>
              <span className="font-mono text-[#22C55E] font-bold">${prize}</span>
            </div>
          </div>
        </div>

        {/* DISPUTE DETAILS */}
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
            Dispute Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Opened By</span>
              <span className="font-bold text-white">{openedBy?.username || 'Unknown'}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-500">Date</span>
              <span className="text-white">{new Date(dispute.createdAt).toLocaleString()}</span>
            </div>
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Reason</span>
              <div className="bg-black/30 p-3 rounded-lg text-white/80 whitespace-pre-wrap font-mono text-xs">
                {dispute.reason}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT DETAILS */}
      <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
          Submitted Result
        </h2>
        {result ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Status</p>
              <p className="font-bold">{result.status}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Score</p>
              <p className="font-mono font-bold text-xl">{result.score}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <p className="text-gray-500 text-xs uppercase font-bold mb-1">Evidence</p>
              {result.evidenceUrl ? (
                <a href={result.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-[#00D4FF] hover:underline break-all">
                  View Proof
                </a>
              ) : (
                <p className="text-gray-600 italic">No evidence provided</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500 bg-black/20 rounded-xl border border-white/5">
            No formal result was submitted before the dispute.
          </div>
        )}
      </div>

      {/* ADMIN ACTIONS */}
      {dispute.status !== 'RESOLVED' && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <ShieldAlert className="w-5 h-5 text-[#EF4444]" /> Admin Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleResolve('PLAYER_1_WINS')}
              disabled={actionLoading}
              className="bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] border border-[#22C55E]/30 font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center text-center justify-center gap-1"
            >
              <span className="text-sm">Award to</span>
              <span className="text-lg">{player1?.username || 'Player 1'}</span>
            </button>
            
            <button
              onClick={() => handleResolve('PLAYER_2_WINS')}
              disabled={actionLoading}
              className="bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] border border-[#22C55E]/30 font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center text-center justify-center gap-1"
            >
              <span className="text-sm">Award to</span>
              <span className="text-lg">{player2?.username || 'Player 2'}</span>
            </button>

            <button
              onClick={() => handleResolve('REFUND_BOTH')}
              disabled={actionLoading}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/30 font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center text-center justify-center gap-1"
            >
              <span className="text-sm">Draw</span>
              <span className="text-lg">Refund Both</span>
            </button>

            <button
              onClick={() => handleResolve('CANCEL_MATCH')}
              disabled={actionLoading}
              className="bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/30 font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center text-center justify-center gap-1"
            >
              <span className="text-sm">Void</span>
              <span className="text-lg">Cancel Match</span>
            </button>
          </div>
          
          <p className="text-gray-500 text-xs mt-6 text-center">
            WARNING: Executing a resolution is final. It immediately alters wallet balances and finalizes the match.
          </p>
        </div>
      )}
    </div>
  );
}
