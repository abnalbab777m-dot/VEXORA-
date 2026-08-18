import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet, Trophy, Swords, Target, TrendingUp, History, ArrowUpRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickJoinLoading, setQuickJoinLoading] = useState(false);

  const handleQuickJoin = async () => {
    if (!token) return;
    setQuickJoinLoading(true);
    try {
      const res = await fetch('/api/matchmaking/quick-join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data.match) {
        navigate(`/match/${data.data.match.id}`);
      } else {
        alert(data.error?.message || 'Could not find a suitable match. Try again later.');
      }
    } catch (err) {
      alert('Network error while trying to quick join.');
    } finally {
      setQuickJoinLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    const fetchData = async () => {
      try {
        const [matchRes, walletRes, statsRes] = await Promise.all([
          fetch('/api/matches', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/statistics/me', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          if (matchData.success) setMatches(matchData.data);
        }
        
        if (walletRes.ok) {
          const walletData = await walletRes.json();
          if (walletData.success) setWallet(walletData.data);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) setStats(statsData.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  const getStatusDisplay = (match: any) => {
    const status = match.status;
    if (status === 'COMPLETED') {
      if (match.winnerId === user?.id) return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-[#22C55E]/10 text-[#22C55E]">WIN</span>;
      return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-[#EF4444]/10 text-[#EF4444]">LOSS</span>;
    }
    if (status === 'CANCELLED') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-gray-500/10 text-gray-400">{status}</span>;
    if (status === 'DISPUTED') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-red-500/10 text-red-500">{status}</span>;
    // PENDING, READY, LIVE, RESULT_SUBMITTED, UNDER_REVIEW
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-500/10 text-yellow-500">{status}</span>;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate ? Math.round(stats.winRate) : 0;
  
  const totalWinnings = stats?.earnings ? parseFloat(stats.earnings).toFixed(2) : '0.00';
  const balance = wallet?.balance || '0.00';
  const available = wallet?.availableBalance || '0.00';
  const locked = wallet?.lockedBalance || '0.00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back, {user?.username || 'Player'}</h1>
          <p className="text-gray-400">Here's your competitive summary.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleQuickJoin}
            disabled={quickJoinLoading}
            className="bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 border border-[#00D4FF]/50 px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {quickJoinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
            Quick Join
          </button>
          <Link to="/games" className="bg-[#6C5CE7] hover:bg-[#5a4cd1] text-white px-6 py-3 rounded-lg font-bold shadow-[0_0_15px_rgba(108,92,231,0.3)] transition-all flex items-center gap-2">
            <Swords className="w-5 h-5" /> Start Challenge
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2 bg-[#0F1624] rounded-2xl border border-white/5 p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C5CE7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-2 text-gray-400 mb-4 font-medium uppercase tracking-wider text-sm">
            <Wallet className="w-4 h-4 text-[#00D4FF]" /> Wallet Balance
          </div>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-black font-mono tracking-tight">${balance}</span>
            <span className="text-gray-500 font-medium">USD</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#070B14] rounded-xl p-4 border border-white/5">
              <p className="text-gray-500 text-sm mb-1">Available</p>
              <p className="text-xl font-bold font-mono">${available}</p>
            </div>
            <div className="bg-[#070B14] rounded-xl p-4 border border-white/5">
              <p className="text-gray-500 text-sm mb-1">Locked in Match</p>
              <p className="text-xl font-bold font-mono">${locked}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1624] rounded-2xl border border-white/5 p-6"
        >
          <div className="flex items-center gap-2 text-gray-400 mb-6 font-medium uppercase tracking-wider text-sm">
            <TrendingUp className="w-4 h-4 text-[#22C55E]" /> Performance
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Target className="w-5 h-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Win Rate</p>
                  <p className="font-bold">{winRate}%</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Matches</p>
                <p className="font-bold">{stats?.totalMatches || 0}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Winnings</p>
                  <p className="font-bold text-[#22C55E]">+{parseFloat(totalWinnings).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm pt-2 border-t border-white/5">
              <span className="text-gray-400">Record:</span>
              <span className="text-[#22C55E] font-bold">{wins}W</span>
              <span className="text-gray-600">-</span>
              <span className="text-[#EF4444] font-bold">{losses}L</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Available Games */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Available Games</h2>
          <Link to="/games" className="text-sm text-[#00D4FF] hover:text-white transition-colors">View All</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['eFootball', 'Jawaker'].map((game, i) => (
            <Link key={i} to="/games" className="bg-[#0F1624] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#070B14] overflow-hidden relative">
                  {i === 0 ? (
                    <img src="https://images.unsplash.com/photo-1511882150382-421056c89033?w=200&q=80" alt="eFootball" className="object-cover w-full h-full" />
                  ) : (
                    <img src="https://images.unsplash.com/photo-1611032549110-3ef0ff328b97?w=200&q=80" alt="Jawaker" className="object-cover w-full h-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold">{game}</h3>
                  <p className="text-xs text-gray-500">{i === 0 ? '124 Playing' : '86 Playing'}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#6C5CE7] group-hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Matches</h2>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-sm text-gray-400">
                  <th className="p-4 font-medium uppercase tracking-wider">Game</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Stake</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Prize</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Opponent</th>
                  <th className="p-4 font-medium uppercase tracking-wider">Result</th>
                  <th className="p-4 font-medium uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading matches...
                    </td>
                  </tr>
                ) : matches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No matches found. Start a challenge!
                    </td>
                  </tr>
                ) : matches.slice(0, 10).map((match, i) => (
                  <tr 
                    key={match.id} 
                    onClick={() => navigate(`/match/${match.id}`)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-medium">{match.game || 'Unknown Game'}</td>
                    <td className="p-4 font-mono">${Number(match.stake).toFixed(2)}</td>
                    <td className="p-4 font-mono text-green-400">{match.prize ? `$${Number(match.prize).toFixed(2)}` : '-'}</td>
                    <td className="p-4 text-gray-300">{match.opponentUsername || 'Unknown'}</td>
                    <td className="p-4">
                      {getStatusDisplay(match)}
                    </td>
                    <td className="p-4 text-right text-sm text-gray-500">{formatDate(match.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
