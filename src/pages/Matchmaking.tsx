import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, Swords, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Matchmaking() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('gameId');
  const stakeId = searchParams.get('stakeId');
  const inviteId = searchParams.get('inviteId');
  
  const [timer, setTimer] = useState(0);
  const [status, setStatus] = useState<'INITIALIZING' | 'WAITING' | 'MATCHED' | 'ERROR' | 'INVITE_PENDING'>('INITIALIZING');
  const [matchData, setMatchData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const joinAttempted = useRef(false);

  useEffect(() => {
    if (inviteId) {
      setStatus('INVITE_PENDING');
    }
  }, [inviteId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'WAITING') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (!user || status === 'INVITE_PENDING') return;
    
    // Polling logic
    let pollInterval: ReturnType<typeof setInterval>;
    
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/matchmaking/status', {
          headers: {  }
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          const st = data.data.status;
          
          if (st === 'MATCHED') {
            setStatus('MATCHED');
            setMatchData(data.data);
            clearInterval(pollInterval);
          } else if (st === 'WAITING') {
            setStatus('WAITING');
          } else if (st === 'NOT_IN_QUEUE' && !joinAttempted.current) {
            // Join queue
            joinAttempted.current = true;
            if (!gameId || !stakeId) {
              setErrorMsg('Invalid matchmaking parameters');
              setStatus('ERROR');
              return;
            }
            const joinRes = await fetch('/api/matchmaking/join', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                 
              },
              body: JSON.stringify({ gameId, stakeId })
            });
            const joinData = await joinRes.json();
            if (!joinRes.ok || !joinData.success) {
               setErrorMsg(joinData.error?.message || 'Failed to join matchmaking');
               setStatus('ERROR');
            }
          }
        } else {
           setErrorMsg(data.error?.message || 'Error checking status');
           setStatus('ERROR');
        }
      } catch (err: any) {
        setErrorMsg('Network error');
        setStatus('ERROR');
      }
    };

    checkStatus(); // immediate check
    pollInterval = setInterval(checkStatus, 3000); // poll every 3s
    
    return () => clearInterval(pollInterval);
  }, [gameId, stakeId]);

  const handleCancel = async () => {
    try {
      const res = await fetch('/api/matchmaking/cancel', {
        method: 'DELETE',
        headers: {  }
      });
      if (res.ok) {
        navigate('/games');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInviteResponse = async (accept: boolean) => {
    try {
      setStatus('INITIALIZING');
      const res = await fetch(`/api/invitations/${inviteId}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
           
        },
        body: JSON.stringify({ accept })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (accept) {
          navigate(`/match/${data.data.matchId}`);
        } else {
          navigate('/games');
        }
      } else {
        setErrorMsg(data.error?.message || 'Failed to respond to invite');
        setStatus('ERROR');
      }
    } catch (err) {
      setErrorMsg('Network error');
      setStatus('ERROR');
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0F1624] border border-white/10 rounded-3xl p-8 md:p-12 max-w-md w-full text-center relative overflow-hidden"
      >
        {status === 'WAITING' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <div className="w-64 h-64 border border-[#6C5CE7] rounded-full absolute animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="w-48 h-48 border border-[#00D4FF] rounded-full absolute animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
          </div>
        )}
        
        <div className="relative z-10">
          {status === 'INITIALIZING' && (
             <div className="flex flex-col items-center">
               <Loader2 className="w-10 h-10 text-[#6C5CE7] animate-spin mb-4" />
               <p className="text-gray-400">Initializing Matchmaking...</p>
             </div>
          )}

          {status === 'INVITE_PENDING' && (
             <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-gradient-to-tr from-[#6C5CE7] to-[#00D4FF] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(108,92,231,0.5)]">
                 <Swords className="w-10 h-10 text-white" />
               </div>
               <h2 className="text-3xl font-black mb-2 uppercase tracking-wider">Game Invitation</h2>
               <p className="text-gray-400 mb-8 text-lg">You have been challenged to a match.</p>
               
               <div className="flex gap-4 w-full">
                 <button onClick={() => handleInviteResponse(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">
                   Decline
                 </button>
                 <button onClick={() => handleInviteResponse(true)} className="flex-1 py-3 bg-[#6C5CE7] hover:bg-[#5a4cd1] text-white rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(108,92,231,0.4)]">
                   Accept
                 </button>
               </div>
             </div>
          )}

          {status === 'ERROR' && (
             <div className="flex flex-col items-center">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border ${errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-red-500/20 text-red-500 border-red-500/50'}`}>
                 <X className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold mb-2">Matchmaking {errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'Unavailable' : 'Failed'}</h2>
               <p className={`${errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'text-yellow-500' : 'text-red-400'} mb-6`}>{errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured') ? 'Matchmaking is disabled in Demo Mode as it requires a database.' : errorMsg}</p>
               <button onClick={() => navigate('/games')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                 Go Back
               </button>
             </div>
          )}

          {status === 'WAITING' && (
            <>
              <div className="w-24 h-24 rounded-full bg-[#070B14] border border-white/10 mx-auto flex items-center justify-center mb-8 relative">
                <Loader2 className="w-10 h-10 text-[#6C5CE7] animate-spin absolute" />
                <Swords className="w-6 h-6 text-gray-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Searching for Opponent</h2>
              <p className="text-gray-400 mb-8 capitalize">Searching within stake range</p>
              
              <div className="font-mono text-4xl font-black text-[#00D4FF] mb-10 tracking-widest">
                {formatTime(timer)}
              </div>
              
              <button 
                onClick={handleCancel}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" /> Cancel Search
              </button>
            </>
          )}

          {status === 'MATCHED' && matchData && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-24 h-24 rounded-full bg-[#22C55E]/20 border border-[#22C55E] mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
              </div>
              
              <h2 className="text-3xl font-black text-[#22C55E] mb-2 uppercase tracking-wide">Opponent Found!</h2>
              
              <div className="bg-black/30 p-4 rounded-xl my-6 border border-white/5">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Game</p>
                <p className="font-bold mb-4">{matchData.game}</p>
              </div>

              <button 
                onClick={() => navigate(`/match/${matchData.matchId}`)}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#6C5CE7] hover:bg-[#5b4dcc] text-white transition-colors shadow-[0_0_20px_rgba(108,92,231,0.4)] hover:shadow-[0_0_30px_rgba(108,92,231,0.6)]"
              >
                Enter Match Room
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
