import { useState, useEffect } from 'react';
import { Trophy, Medal, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function Leaderboard() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [sortBy, setSortBy] = useState<'earnings' | 'wins' | 'matches' | 'win_rate'>('earnings');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/statistics/leaderboard?period=${period}&sortBy=${sortBy}&page=1&limit=20`);
        const data = await res.json();
        if (data.success) {
          setLeaders(data.data.data || []);
        } else {
          if (data.error?.code === 'DATABASE_NOT_CONFIGURED') {
            setError('Database not configured');
          } else {
            setError(data.error?.message || 'Failed to fetch leaderboard');
          }
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-[#6C5CE7]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#6C5CE7]/20">
          <Trophy className="w-8 h-8 text-[#6C5CE7]" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Leaderboard</h1>
        
        {/* Period Filter */}
        <div className="inline-flex bg-[#0F1624] p-1 rounded-xl border border-white/5 mb-4 flex-wrap justify-center">
          {['daily', 'weekly', 'monthly', 'all_time'].map((t) => (
            <button
              key={t}
              onClick={() => setPeriod(t as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                period === t ? 'bg-[#6C5CE7] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="w-full h-2"></div>
        
        {/* Sort Filter */}
        <div className="inline-flex bg-[#0F1624] p-1 rounded-xl border border-white/5 flex-wrap justify-center text-xs">
          {['earnings', 'wins', 'matches', 'win_rate'].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s as any)}
              className={`px-4 py-1.5 rounded-lg font-bold capitalize transition-all ${
                sortBy === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sort by {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-[#6C5CE7] to-transparent opacity-50"></div>
        
        {error ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
             <AlertCircle className="w-12 h-12 mb-4 text-[#EF4444]/50" />
             <p className="text-lg font-bold text-white mb-2">{error}</p>
             <p className="text-sm">Cannot display leaderboard statistics.</p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF] mb-4" />
             <p className="text-gray-400 font-bold">Aggregating statistics...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="font-bold">No leaderboard data yet for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#070B14]/50 text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                  <th className="p-6 font-semibold w-24 text-center">Rank</th>
                  <th className="p-6 font-semibold">Player</th>
                  <th className="p-6 font-semibold text-center hidden md:table-cell">Matches</th>
                  <th className="p-6 font-semibold text-center hidden md:table-cell">Wins</th>
                  <th className="p-6 font-semibold text-center hidden sm:table-cell">Win Rate</th>
                  <th className="p-6 font-semibold text-right text-[#22C55E]">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((leader, i) => {
                  const rank = i + 1;
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={leader.userId} 
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex justify-center">
                          {rank === 1 ? (
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                              <Trophy className="w-5 h-5" />
                            </div>
                          ) : rank === 2 ? (
                            <div className="w-10 h-10 rounded-full bg-gray-300/20 text-gray-300 flex items-center justify-center border border-gray-300/30">
                              <Medal className="w-5 h-5" />
                            </div>
                          ) : rank === 3 ? (
                            <div className="w-10 h-10 rounded-full bg-amber-600/20 text-amber-500 flex items-center justify-center border border-amber-600/30">
                              <Medal className="w-5 h-5" />
                            </div>
                          ) : (
                            <span className="font-mono text-xl font-bold text-gray-500">{rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                            rank === 1 ? 'bg-gradient-to-tr from-yellow-600 to-yellow-400 border-yellow-200 text-black' : 
                            'bg-[#070B14] border-white/10 text-white'
                          }`}>
                            {leader.avatar || leader.username.charAt(0).toUpperCase()}
                          </div>
                          <span className={`font-bold text-lg ${rank === 1 ? 'text-yellow-500' : 'text-white'}`}>{leader.username}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center font-mono font-bold text-gray-300 hidden md:table-cell">{leader.totalMatches}</td>
                      <td className="p-6 text-center font-mono font-bold text-gray-300 hidden md:table-cell">{leader.wins}</td>
                      <td className="p-6 text-center font-mono font-bold text-gray-400 hidden sm:table-cell">
                        {leader.winRate.toFixed(1)}%
                      </td>
                      <td className="p-6 text-right font-mono font-black text-[#22C55E] text-lg">
                        ${parseFloat(leader.earnings).toFixed(2)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
