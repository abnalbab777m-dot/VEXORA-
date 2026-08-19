import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, AlertTriangle, MessageSquare, Copy, Check, Clock, Loader2, X, FileCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Match() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [matchData, setMatchData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [winnerId, setWinnerId] = useState('');
  const [score, setScore] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Host State
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [submittingRoomCode, setSubmittingRoomCode] = useState(false);
  const [roomCodeError, setRoomCodeError] = useState('');
  const [hostTimeLeft, setHostTimeLeft] = useState(0);

  useEffect(() => {
    if (matchData?.hostTimerExpiresAt && !matchData?.roomCode && matchData?.status === 'PENDING') {
      const interval = setInterval(() => {
        const expires = new Date(matchData.hostTimerExpiresAt).getTime();
        const now = new Date().getTime();
        setHostTimeLeft(Math.max(0, Math.floor((expires - now) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchData?.hostTimerExpiresAt, matchData?.roomCode, matchData?.status]);

  const submitRoomCode = async () => {
    if (!inputRoomCode.trim()) return;
    setSubmittingRoomCode(true);
    setRoomCodeError('');
    try {
      const res = await fetch(`/api/matches/${id}/room-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: inputRoomCode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRoomCodeError(data.error?.message || 'Failed to submit room code');
      } else {
        setInputRoomCode('');
      }
    } catch (err) {
      setRoomCodeError('Network error');
    } finally {
      setSubmittingRoomCode(false);
    }
  };

  useEffect(() => {
    if (!user || !id) return;

    let pollInterval: ReturnType<typeof setInterval>;
    
    const fetchMatch = async () => {
      try {
        const [matchRes, resultRes] = await Promise.all([
          fetch(`/api/matches/${id}`, { headers: {  } }),
          fetch(`/api/matches/${id}/result`, { headers: {  } })
        ]);

        const data = await matchRes.json();
        
        if (matchRes.ok && data.success) {
          setMatchData(data.data);
          
          if (resultRes.ok) {
            const rData = await resultRes.json();
            if (rData.success) {
              setResultData(rData.data);
            }
          }

          const status = data.data.status;
          if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'DISPUTED') {
            clearInterval(pollInterval);
          }
        } else {
          setErrorMsg(data.error?.message || 'Failed to load match');
          clearInterval(pollInterval);
        }
      } catch (err) {
        setErrorMsg('Network error while loading match');
        clearInterval(pollInterval);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
    pollInterval = setInterval(fetchMatch, 5000); // Poll every 5s

    return () => clearInterval(pollInterval);
  }, [id]);

  useEffect(() => {
    if (matchData?.startedAt) {
      const interval = setInterval(() => {
        const start = new Date(matchData.startedAt).getTime();
        const now = new Date().getTime();
        setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchData?.startedAt]);

  const copyCode = () => {
    if (!matchData?.roomCode) return;
    navigator.clipboard.writeText(matchData.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitResult = async () => {
    setFormError('');
    if (!winnerId) return setFormError('Please select a winner');
    if (!score) return setFormError('Please enter the score');
    if (evidenceUrl && !evidenceUrl.startsWith('http')) return setFormError('Evidence URL must start with http/https');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, score, evidenceUrl })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Failed to submit result');
      } else {
        setResultData(data.data);
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmResult = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/matches/${id}/confirm`, {
        method: 'POST',
        headers: {  }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Failed to confirm result');
      } else {
        setResultData(data.data);
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const settleMatch = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/matches/${id}/settle`, {
        method: 'POST',
        headers: {  }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Failed to settle match');
      } else {
        // Will refresh state via polling or we could manually refresh
        setMatchData({ ...matchData, status: 'COMPLETED', winnerId: data.data.winnerId });
        setResultData({ ...resultData, status: 'COMPLETED' });
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const disputeResult = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`/api/matches/${id}/dispute`, {
        method: 'POST',
        headers: {  }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error?.message || 'Failed to dispute result');
      } else {
        setResultData(data.data);
      }
    } catch (err) {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#6C5CE7]" />
      </div>
    );
  }

  if (errorMsg) {
    const isDemo = errorMsg.includes('Demo Mode') || errorMsg.includes('Database not configured');
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-[#0F1624] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDemo ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : 'bg-red-500/20 text-red-500 border-red-500/50'}`}>
             <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{isDemo ? 'Match Unavailable' : 'Match Error'}</h2>
          <p className={`${isDemo ? 'text-yellow-500' : 'text-red-400'} mb-6`}>{isDemo ? 'Matches cannot be loaded in Demo Mode.' : errorMsg}</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!matchData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'text-yellow-500 bg-yellow-500/10';
      case 'COMPLETED': return 'text-green-500 bg-green-500/10';
      case 'CANCELLED': return 'text-red-500 bg-red-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Waiting for match to start';
      case 'READY': return 'Match Ready';
      case 'LIVE': return 'Match in Progress';
      case 'RESULT_SUBMITTED': return 'Result Submitted';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'COMPLETED': return 'Match Completed';
      case 'CANCELLED': return 'Match Cancelled';
      case 'DISPUTED': return 'Under Dispute';
      default: return status;
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderResultArea = () => {
    if (matchData?.status === 'COMPLETED') {
      const winnerName = matchData.winnerId === matchData.currentUser ? matchData.currentUserUsername : matchData.opponentUsername;
      const totalStake = parseFloat(matchData.stakeAmount) * 2;
      const commission = totalStake * 0.15;
      const prize = totalStake - commission;

      return (
        <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 text-[#6C5CE7] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Match Completed</h3>
          
          <div className="bg-[#0F1624] rounded-xl p-4 my-6 text-left border border-white/10 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-gray-400">Winner</span>
              <span className="font-bold text-lg text-white">{winnerName}</span>
            </div>
            {resultData?.score && (
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-gray-400">Final Score</span>
                <span className="font-bold font-mono text-white">{resultData.score}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-gray-400">Total Pool</span>
              <span className="font-bold text-white">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-gray-400">VEXORA Fee (15%)</span>
              <span className="font-bold text-[#EF4444]">-${commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400">Winner Prize</span>
              <span className="font-bold text-[#22C55E] text-xl">${prize.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (resultData?.status === 'BOTH_CONFIRMED' || matchData.status === 'UNDER_REVIEW') {
      const winnerName = resultData.winnerId === matchData.currentUser ? matchData.currentUserUsername : matchData.opponentUsername;
      const totalStake = parseFloat(matchData.stakeAmount) * 2;
      const commission = totalStake * 0.15;
      const prize = totalStake - commission;

      return (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-6 text-center">
          <FileCheck className="w-10 h-10 text-[#22C55E] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#22C55E] mb-2">Result Confirmed</h3>
          
          <div className="bg-[#0F1624] rounded-lg p-4 my-4 text-left border border-[#22C55E]/20 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Winner</span>
              <span className="font-bold text-white">{winnerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Total Pool</span>
              <span className="font-bold text-white">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">VEXORA Fee</span>
              <span className="font-bold text-white">-${commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <span className="text-gray-400 text-sm">Winner Prize</span>
              <span className="font-bold text-[#22C55E]">${prize.toFixed(2)}</span>
            </div>
          </div>

          {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
          
          <button 
            onClick={settleMatch}
            disabled={submitting}
            className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Match'}
          </button>
        </div>
      );
    }

    if (resultData?.status === 'DISPUTED' || matchData.status === 'DISPUTED') {
      return (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-[#EF4444] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#EF4444] mb-2">Match Disputed</h3>
          <p className="text-[#EF4444]/80 text-sm">
            This match is currently under administrative review. Please hold on while we investigate.
          </p>
        </div>
      );
    }

    if (resultData && (resultData.status === 'PLAYER_1_SUBMITTED' || resultData.status === 'PLAYER_2_SUBMITTED')) {
      const isMySubmission = resultData.submittedBy === matchData.currentUser;
      
      if (isMySubmission) {
        return (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Result Submitted</h3>
            <p className="text-gray-400 text-sm mb-4">
              Waiting for {matchData.opponentUsername} to confirm the result.
            </p>
            <div className="bg-[#0F1624] rounded-lg p-3 inline-block border border-white/5">
              <span className="text-gray-500 text-sm">Reported Score: </span>
              <span className="font-bold font-mono text-white ml-1">{resultData.score}</span>
            </div>
          </div>
        );
      } else {
        // Opponent submitted, I need to confirm or dispute
        const winnerName = resultData.winnerId === matchData.currentUser ? matchData.currentUserUsername : matchData.opponentUsername;
        return (
          <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/30 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-[#6C5CE7] mb-2">Opponent Submitted Result</h3>
            <div className="bg-[#0F1624] rounded-lg p-4 my-4 text-left border border-white/10 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Winner claimed:</span>
                <span className="font-bold text-white">{winnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Score reported:</span>
                <span className="font-bold font-mono text-white">{resultData.score}</span>
              </div>
              {resultData.evidenceUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Evidence:</span>
                  <a href={resultData.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm underline truncate max-w-[150px]">View Proof</a>
                </div>
              )}
            </div>
            
            {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={confirmResult}
                disabled={submitting}
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-5 h-5" /> Confirm
              </button>
              <button 
                onClick={disputeResult}
                disabled={submitting}
                className="bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/30 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ThumbsDown className="w-5 h-5" /> Dispute
              </button>
            </div>
          </div>
        );
      }
    }

    // No result submitted yet. Show submission form.
    return (
      <div className="space-y-4">
        {formError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
            {formError}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setWinnerId(matchData.currentUser)}
            className={`border rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors ${winnerId === matchData.currentUser ? 'bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
          >
            <Trophy className={`w-6 h-6 ${winnerId === matchData.currentUser ? 'text-[#22C55E]' : 'opacity-50'}`} />
            <span className="font-bold text-sm">I Won</span>
          </button>
          
          <button 
            onClick={() => setWinnerId(matchData.opponent)}
            className={`border rounded-xl py-4 flex flex-col items-center justify-center gap-2 transition-colors ${winnerId === matchData.opponent ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
          >
            <AlertTriangle className={`w-6 h-6 ${winnerId === matchData.opponent ? 'text-red-500' : 'opacity-50'}`} />
            <span className="font-bold text-sm">Opponent Won</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Final Score (e.g., 3-1)</label>
            <input 
              type="text" 
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="0-0"
              className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7]"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Evidence URL (Optional)</label>
            <input 
              type="text" 
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://imgur.com/..."
              className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>
        </div>

        <button 
          onClick={submitResult}
          disabled={submitting || !winnerId || !score}
          className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-[#6C5CE7] hover:bg-[#5b4dcc] text-white transition-colors shadow-[0_0_20px_rgba(108,92,231,0.4)] disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Result'}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col">
      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden flex-1 flex flex-col">
        {/* Match Header */}
        <div className="bg-gradient-to-r from-[#070B14] via-[#0F1624] to-[#070B14] p-6 md:p-10 border-b border-white/5">
          <div className="flex items-center justify-between text-xs md:text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">
            <span className="truncate max-w-[120px] md:max-w-none">ID: {matchData.matchId.split('-')[0]}</span>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${getStatusColor(matchData.status)}`}>
              <Clock className="w-3.5 h-3.5"/> {getStatusText(matchData.status)}
              {matchData.status === 'LIVE' && matchData.startedAt && ` (${formatTime(elapsed)})`}
            </span>
            <span>{matchData.game}</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Player 1 (Current User) */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#00D4FF] p-1 mb-4 shadow-[0_0_20px_rgba(108,92,231,0.3)]">
                <div className="w-full h-full rounded-full bg-[#0F1624] flex items-center justify-center border-4 border-black text-xl font-black">
                  YOU
                </div>
              </div>
              <h3 className="text-xl font-bold">{matchData.currentUserUsername}</h3>
            </div>

            {/* VS & Stakes */}
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-600 mb-6">VS</span>
              <div className="bg-[#070B14] border border-white/10 rounded-xl p-4 text-center min-w-[140px]">
                <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-semibold">Prize Pool</p>
                <p className="text-3xl font-mono font-black text-[#22C55E]">${Number(matchData.prize).toFixed(2)}</p>
              </div>
            </div>

            {/* Player 2 (Opponent) */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-800 p-1 mb-4">
                <div className="w-full h-full rounded-full bg-[#070B14] flex items-center justify-center border-4 border-black text-xl font-black text-gray-400">
                  {matchData.opponentUsername.substring(0,2).toUpperCase()}
                </div>
              </div>
              <h3 className="text-xl font-bold">{matchData.opponentUsername}</h3>
            </div>
          </div>
        </div>

        {/* Match Action Area */}
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-4">Game Details</h3>
            
            <div className="bg-[#070B14] border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 mb-2 font-medium">In-Game Room Code</p>
              
              {matchData.roomCode ? (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#0F1624] border border-white/10 rounded-lg flex items-center justify-center font-mono text-2xl font-bold tracking-[0.2em] py-3">
                      {matchData.roomCode}
                    </div>
                    <button 
                      onClick={copyCode}
                      className="w-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-colors"
                    >
                      {copied ? <Check className="w-6 h-6 text-[#22C55E]" /> : <Copy className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                    Enter this code in {matchData.game} to join the lobby. The game must be played with standard settings.
                  </p>
                </>
              ) : matchData.hostUserId === matchData.currentUser ? (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg text-sm">
                    <p className="font-bold mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> You are the Host ({formatTime(hostTimeLeft)} left)</p>
                    <p>Create a room in {matchData.game} and share the code below. If you fail to do so, host privileges will transfer to the opponent.</p>
                  </div>
                  {roomCodeError && <p className="text-red-500 text-sm">{roomCodeError}</p>}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputRoomCode}
                      onChange={e => setInputRoomCode(e.target.value.toUpperCase())}
                      placeholder="ENTER ROOM CODE"
                      className="flex-1 bg-[#0F1624] border border-white/10 rounded-lg px-4 py-3 text-white font-mono font-bold tracking-widest focus:outline-none focus:border-[#6C5CE7]"
                      maxLength={12}
                    />
                    <button 
                      onClick={submitRoomCode}
                      disabled={submittingRoomCode || !inputRoomCode.trim()}
                      className="px-6 bg-[#6C5CE7] hover:bg-[#5b4dcc] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submittingRoomCode ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7]" />
                  <div>
                    <p className="font-bold text-white mb-1">Waiting for Host</p>
                    <p className="text-sm text-gray-400">The opponent is creating the room ({formatTime(hostTimeLeft)} left)</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button disabled className="flex-1 border border-white/5 bg-white/5 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 cursor-not-allowed">
                <MessageSquare className="w-4 h-4" /> Chat (Soon)
              </button>
              <button disabled className="flex-1 border border-[#EF4444]/10 bg-[#EF4444]/5 text-[#EF4444]/50 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium cursor-not-allowed">
                <AlertTriangle className="w-4 h-4" /> Support (Soon)
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-white/10 pb-4">Match Result</h3>
            {renderResultArea()}
          </div>
        </div>
      </div>
    </div>
  );
}
