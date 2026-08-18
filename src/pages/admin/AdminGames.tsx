import { useState, useEffect } from 'react';
import { Gamepad2, Loader2, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminGames() {
    const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games`);
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch games');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const toggleStatus = async (gameId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to change this game's status?`)) return;
    setUpdating(gameId);
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, status: newStatus } : g));
      } else {
        alert(result.error?.message || 'Failed to update game status');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setUpdating(null);
    }
  };

  const toggleMatchmaking = async (gameId: string, currentMatchmaking: boolean) => {
    setUpdating(gameId);
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ isMatchmakingEnabled: !currentMatchmaking })
      });
      const result = await res.json();
      if (result.success) {
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, isMatchmakingEnabled: !currentMatchmaking } : g));
      } else {
        alert(result.error?.message || 'Failed to update matchmaking');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Games Management</h1>
          <p className="text-gray-400">Manage supported games and matchmaking status.</p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-8 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-500/90">
          Modifying game stakes is currently restricted in the UI to prevent affecting historical match integrity. Changing stakes requires database migrations.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-4" />
          <p>Loading games...</p>
        </div>
      ) : error ? (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-6 text-center text-[#EF4444]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error}</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center p-12 text-gray-500 border border-white/5 rounded-2xl bg-[#0F1624]">
          <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No games configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map(game => (
            <div key={game.id} className="bg-[#0F1624] p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#070B14] flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{game.name}</h3>
                    <p className="text-sm text-gray-400 font-mono mt-1">ID: {game.id}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-[#070B14] p-3 rounded-xl border border-white/5">
                  <span className="text-sm font-semibold">Game Status</span>
                  <button
                    onClick={() => toggleStatus(game.id, game.status)}
                    disabled={updating === game.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-50 ${
                      game.status === 'ACTIVE' 
                        ? 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 border border-[#22C55E]/20' 
                        : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20'
                    }`}
                  >
                    {updating === game.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     game.status === 'ACTIVE' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {game.status}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-[#070B14] p-3 rounded-xl border border-white/5">
                  <span className="text-sm font-semibold">Matchmaking</span>
                  <button
                    onClick={() => toggleMatchmaking(game.id, game.isMatchmakingEnabled)}
                    disabled={updating === game.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-50 ${
                      game.isMatchmakingEnabled 
                        ? 'bg-[#6C5CE7]/10 text-[#6C5CE7] hover:bg-[#6C5CE7]/20 border border-[#6C5CE7]/20' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {updating === game.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     game.isMatchmakingEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm text-gray-400 uppercase font-bold mb-3 tracking-wider">Available Stakes</h4>
                <div className="flex flex-wrap gap-2">
                  {game.stakes.map((stake: any) => (
                    <span key={stake.id} className="px-3 py-1.5 bg-[#070B14] border border-white/10 rounded-lg text-sm font-mono font-bold text-white">
                      ${parseFloat(stake.amount).toFixed(2)}
                    </span>
                  ))}
                  {game.stakes.length === 0 && (
                    <span className="text-sm text-gray-500 italic">No stakes configured</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
