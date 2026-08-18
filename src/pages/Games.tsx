import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Swords, Loader2, Users, X, CheckCircle2 } from 'lucide-react';

export function Games() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedStake, setSelectedStake] = useState<Record<string, number>>({});

  const [inviteModalData, setInviteModalData] = useState<{ gameId: string, stakeId: string } | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [inviteStatus, setInviteStatus] = useState<{ friendId: string, status: 'sending' | 'sent' | 'error' } | null>(null);

  const openInviteModal = async (gameId: string, stakeId: string) => {
    setInviteModalData({ gameId, stakeId });
    try {
      const res = await fetch('/api/friends');
      const data = await res.json();
      if (res.ok) setFriends(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (friendId: string) => {
    if (!inviteModalData) return;
    setInviteStatus({ friendId, status: 'sending' });
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: friendId,
          gameId: inviteModalData.gameId,
          stakeId: inviteModalData.stakeId
        })
      });
      if (!res.ok) throw new Error('Failed to invite');
      setInviteStatus({ friendId, status: 'sent' });
      setTimeout(() => setInviteStatus(null), 3000);
    } catch (err) {
      setInviteStatus({ friendId, status: 'error' });
      setTimeout(() => setInviteStatus(null), 3000);
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/games');
        const data = await res.json();
        
        if (!res.ok || !data.success) {
           throw new Error(data.error?.message || 'Failed to load games');
        }
        
        setGames(data.data);
        
        // Default selected stakes
        const defaults: Record<string, number> = {};
        data.data.forEach((g: any) => {
           if (g.stakes && g.stakes.length > 0) {
              defaults[g.slug] = Number(g.stakes[0].amount);
           }
        });
        setSelectedStake(defaults);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7]" />
      </div>
    );
  }

  if (error) {
    const isDemo = error.includes('Demo Mode') || error.includes('Database not configured');
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 w-full text-center">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Select Game</h1>
        <div className={`p-8 border rounded-2xl max-w-2xl mx-auto ${isDemo ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" : "bg-red-500/10 border-red-500/50 text-red-500"}`}>
          <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">{isDemo ? 'Demo Mode Active' : 'Error Loading Games'}</h2>
          <p>{isDemo ? 'Games are currently unavailable because the database is not configured. Please set up the database to enable matchmaking.' : error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tight">Select Game</h1>
        <p className="text-gray-400 text-lg">Choose a game, select your stake, and prepare for battle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {games.length === 0 ? (
           <div className="col-span-1 lg:col-span-2 p-8 text-center text-gray-500 border border-white/5 rounded-2xl bg-[#0F1624]">
             No games available at the moment.
           </div>
        ) : games.map((game, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={game.id} 
            className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="h-48 relative bg-[#070B14]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1624] to-transparent z-10"></div>
              {game.imageUrl ? (
                <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Swords className="w-12 h-12" />
                </div>
              )}
              
              <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${game.status === 'ACTIVE' ? 'bg-[#22C55E] animate-pulse' : 'bg-gray-500'}`}></span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">{game.status}</span>
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex-1 flex flex-col relative z-20 -mt-10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-3xl font-bold">{game.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{game.description}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-sm text-gray-400 mb-3 font-medium uppercase tracking-wider">Select Stake (USD)</p>
                <div className="flex flex-wrap gap-2">
                  {game.stakes && game.stakes.length > 0 ? game.stakes.map((stakeObj: any) => {
                    const stake = Number(stakeObj.amount);
                    return (
                    <button
                      key={stakeObj.id}
                      onClick={() => setSelectedStake({ ...selectedStake, [game.slug]: stake })}
                      className={`px-4 py-2 rounded-lg font-mono font-bold transition-all ${
                        selectedStake[game.slug] === stake 
                          ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.4)]' 
                          : 'bg-[#070B14] border border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      ${stake.toFixed(2)}
                    </button>
                  )}) : (
                    <p className="text-sm text-gray-500">No stakes available.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-6 border-t border-white/5">
                {game.isMatchmakingEnabled && game.status === 'ACTIVE' ? (
                  <div className="flex gap-4">
                    <Link 
                      to={`/matchmaking?gameId=${game.id}&stakeId=${game.stakes?.find((s:any) => Number(s.amount) === selectedStake[game.slug])?.id}`}
                      className="flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                      <Swords className="w-5 h-5" /> Find Match
                    </Link>
                    <button 
                      onClick={() => openInviteModal(game.id, game.stakes?.find((s:any) => Number(s.amount) === selectedStake[game.slug])?.id)}
                      className="flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/30 transition-colors"
                    >
                      <Users className="w-5 h-5" /> Challenge Friend
                    </button>
                  </div>
                ) : (
                   <div className="w-full py-4 rounded-xl font-bold text-center bg-[#070B14] border border-white/5 text-gray-500">
                     Matchmaking Disabled
                   </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Invite Modal */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0F1624] border border-white/10 p-6 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-[#6C5CE7]" /> Challenge a Friend</h2>
              <button onClick={() => setInviteModalData(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              {friends.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No friends available to challenge.</p>
              ) : (
                friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-[#0A0F1C] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#131A2A] flex items-center justify-center font-bold">
                        {friend.username[0].toUpperCase()}
                      </div>
                      <span className="font-bold">{friend.username}</span>
                    </div>
                    <button 
                      onClick={() => handleInvite(friend.id)}
                      disabled={inviteStatus?.friendId === friend.id && inviteStatus.status !== 'error'}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        inviteStatus?.friendId === friend.id 
                          ? (inviteStatus.status === 'sending' ? 'bg-gray-500/20 text-gray-400' : 
                             inviteStatus.status === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                          : 'bg-[#6C5CE7] hover:bg-[#5a4cd1] text-white'
                      }`}
                    >
                      {inviteStatus?.friendId === friend.id ? (
                        inviteStatus.status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                        inviteStatus.status === 'sent' ? <CheckCircle2 className="w-4 h-4 mx-auto" /> : 'Failed'
                      ) : 'Invite'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
