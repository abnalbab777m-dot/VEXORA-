import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Swords, DollarSign, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminMatchDetail() {
  const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/admin/matches/${id}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to load match detail');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-4" />
        <p>Loading match details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-6 text-center text-[#EF4444]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Match not found'}</p>
          <Link to="/admin/matches" className="inline-block mt-4 text-white font-bold underline">Back to Matches</Link>
        </div>
      </div>
    );
  }

  const { match, game, player1, player2, winner, settlement } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <Link to="/admin/matches" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-semibold text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Match Details
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-black uppercase ${
              match.status === 'COMPLETED' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' :
              match.status === 'DISPUTED' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
              match.status === 'CANCELLED' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' :
              'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
            }`}>
              {match.status}
            </span>
          </h1>
          <p className="text-gray-400 font-mono text-sm mt-2">{match.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Match Info */}
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 space-y-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Swords className="w-5 h-5 text-[#6C5CE7]" /> Info</h2>
          <div className="flex justify-between border-b border-white/5 pb-3">
            <span className="text-gray-400 text-sm">Game</span>
            <span className="font-bold">{game?.name || match.gameId}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-3">
            <span className="text-gray-400 text-sm">Created At</span>
            <span className="font-mono text-sm">{new Date(match.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between pb-3">
            <span className="text-gray-400 text-sm">Finished At</span>
            <span className="font-mono text-sm">{match.finishedAt ? new Date(match.finishedAt).toLocaleString() : 'N/A'}</span>
          </div>
        </div>

        {/* Financial Info */}
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 space-y-4">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#22C55E]" /> Stakes</h2>
          <div className="flex justify-between border-b border-white/5 pb-3">
            <span className="text-gray-400 text-sm">Stake (per player)</span>
            <span className="font-mono font-bold">${parseFloat(match.stakeAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-3">
            <span className="text-gray-400 text-sm">Total Prize Pool</span>
            <span className="font-mono font-bold text-[#22C55E]">${parseFloat(match.prize).toFixed(2)}</span>
          </div>
          <div className="flex justify-between pb-3">
            <span className="text-gray-400 text-sm">Platform Commission (15%)</span>
            <span className="font-mono font-bold text-[#6C5CE7]">${(parseFloat(match.prize) * 0.15 / 0.85).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Players */}
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-gray-400" /> Players</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to={`/admin/users/${match.player1Id}`} className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
          <div className="text-sm text-gray-400 uppercase font-bold mb-2 tracking-wider">Player 1</div>
          <div className="text-xl font-bold mb-1">{player1?.username || match.player1Id}</div>
          <div className="text-xs font-mono text-gray-500">{match.player1Id}</div>
          {winner?.id === match.player1Id && <div className="mt-3 inline-block px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold rounded uppercase">Winner</div>}
        </Link>
        <Link to={`/admin/users/${match.player2Id}`} className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
          <div className="text-sm text-gray-400 uppercase font-bold mb-2 tracking-wider">Player 2</div>
          <div className="text-xl font-bold mb-1">{player2?.username || match.player2Id}</div>
          <div className="text-xs font-mono text-gray-500">{match.player2Id}</div>
          {winner?.id === match.player2Id && <div className="mt-3 inline-block px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold rounded uppercase">Winner</div>}
        </Link>
      </div>

      {match.status === 'DISPUTED' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ShieldAlert className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="font-bold text-yellow-500">This match is currently disputed.</h3>
              <p className="text-sm text-yellow-500/70">Requires admin resolution.</p>
            </div>
          </div>
          <Link to="/admin/disputes" className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors">
            Go to Disputes
          </Link>
        </div>
      )}

      {settlement && (
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 mt-8">
          <h2 className="text-lg font-bold mb-4">Settlement Details</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#070B14] p-4 rounded-xl border border-white/5">
             <div>
                <p className="text-sm text-gray-400 mb-1">Winner</p>
                <p className="font-bold">{winner?.username || settlement.winnerId}</p>
             </div>
             <div>
                <p className="text-sm text-gray-400 mb-1">Prize Paid</p>
                <p className="font-mono font-bold text-[#22C55E]">${parseFloat(settlement.amount).toFixed(2)}</p>
             </div>
             <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <p className="font-bold text-gray-300">{settlement.status}</p>
             </div>
             <div>
                <p className="text-sm text-gray-400 mb-1">Date</p>
                <p className="font-mono text-sm">{new Date(settlement.createdAt).toLocaleString()}</p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
