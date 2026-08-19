import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ShieldAlert, RefreshCw, Sparkles, CheckCircle2, UserCheck, AlertOctagon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchHostCountdownProps {
  matchId: string;
  isHost: boolean;
  hostUsername: string;
  opponentUsername: string;
  hostInGameUsername?: string;
  gameName: string;
  hostTimerExpiresAt: string | null;
  hostAttempts: number;
  onRoomCodeSubmit: (roomCode: string) => Promise<boolean>;
  onHostSwitched?: () => void;
  submittingCode?: boolean;
}

export const MatchHostCountdown: React.FC<MatchHostCountdownProps> = ({
  matchId,
  isHost,
  hostUsername,
  opponentUsername,
  hostInGameUsername,
  gameName,
  hostTimerExpiresAt,
  hostAttempts,
  onRoomCodeSubmit,
  onHostSwitched,
  submittingCode = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!hostTimerExpiresAt) return 180;
    const expires = new Date(hostTimerExpiresAt).getTime();
    const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
    return diff;
  });

  const [inputCode, setInputCode] = useState('');
  const [switchingHost, setSwitchingHost] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);

  // Total countdown is 3 minutes (180s)
  const TOTAL_DURATION = 180;

  // Update timer interval
  useEffect(() => {
    if (!hostTimerExpiresAt) return;

    const tick = () => {
      const expires = new Date(hostTimerExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hostTimerExpiresAt]);

  // Handle Switch Host Trigger
  const triggerSwitchHost = useCallback(async () => {
    if (switchingHost) return;
    setSwitchingHost(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/matches/${matchId}/switch-host`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to transfer host privileges');
      }

      if (onHostSwitched) {
        onHostSwitched();
      }
    } catch (err: any) {
      console.warn('Switch host response:', err.message);
      // Even if server already switched via cron/poll, call onHostSwitched
      if (onHostSwitched) {
        onHostSwitched();
      }
    } finally {
      setSwitchingHost(false);
    }
  }, [matchId, switchingHost, onHostSwitched]);

  // Auto trigger when countdown expires
  useEffect(() => {
    if (secondsLeft === 0 && !hasAutoTriggered && hostTimerExpiresAt) {
      setHasAutoTriggered(true);
      triggerSwitchHost();
    }
  }, [secondsLeft, hasAutoTriggered, hostTimerExpiresAt, triggerSwitchHost]);

  // Reset auto triggered flag if hostTimerExpiresAt changes
  useEffect(() => {
    setHasAutoTriggered(false);
  }, [hostTimerExpiresAt, hostAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setErrorMsg(null);
    const success = await onRoomCodeSubmit(inputCode.trim().toUpperCase());
    if (success) {
      setInputCode('');
    }
  };

  // Time format MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Percentage for circular progress
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / TOTAL_DURATION) * 100));
  const strokeDashoffset = 283 - (283 * progressPercent) / 100; // 2 * PI * 45 ≈ 283

  // Color scheme based on urgency
  const isUrgent = secondsLeft <= 30;
  const isWarning = secondsLeft > 30 && secondsLeft <= 60;
  const isExpired = secondsLeft === 0;

  const colorClass = isExpired
    ? 'text-red-500 stroke-red-500'
    : isUrgent
    ? 'text-rose-400 stroke-rose-400'
    : isWarning
    ? 'text-amber-400 stroke-amber-400'
    : 'text-[#00D4FF] stroke-[#00D4FF]';

  const badgeBg = isExpired
    ? 'bg-red-500/20 border-red-500/40 text-red-400'
    : isUrgent
    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
    : isWarning
    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
    : 'bg-[#6C5CE7]/20 border-[#6C5CE7]/40 text-[#00D4FF]';

  return (
    <div className="bg-[#090E17] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
      {/* Background ambient glow */}
      <div 
        className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isUrgent ? 'bg-rose-600/25' : isWarning ? 'bg-amber-600/20' : 'bg-[#6C5CE7]/20'
        }`} 
      />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left / Circular Timer Section */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-white/10"
                strokeWidth="7"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${colorClass} transition-all duration-1000 ease-linear`}
                strokeWidth="7"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Centered Digital Countdown */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`font-mono text-xl font-black tracking-tight ${colorClass}`}>
                {formattedTime}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                {isExpired ? 'Expired' : 'Limit 3m'}
              </span>
            </div>
          </div>

          {/* Status Label & Attempt Details */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeBg} flex items-center gap-1.5`}>
                <Clock className="w-3.5 h-3.5" />
                {isHost ? 'You are Host' : `Host: ${hostUsername}`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-semibold border border-white/5">
                Attempt {hostAttempts} of 2
              </span>
            </div>

            <h4 className="text-base font-bold text-white flex items-center gap-2">
              {isHost ? (
                <>Provide Room Code <Sparkles className="w-4 h-4 text-amber-400" /></>
              ) : (
                <>Waiting for {hostUsername} to create room</>
              )}
            </h4>
            
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {isHost
                ? `Create a custom match in ${gameName} and share the room code below before the 3-minute timer expires.`
                : `Opponent has 3 minutes to provide the room code. If time runs out, host privileges will transfer to you.`}
            </p>
          </div>
        </div>

        {/* Right / Host Action Form or Waiting/Trigger Status */}
        <div className="w-full md:w-auto md:min-w-[280px]">
          {isHost ? (
            <form onSubmit={handleSubmit} className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                Enter Room ID / Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 784-902"
                  disabled={submittingCode}
                  maxLength={16}
                  className="w-full bg-[#0F1624] border border-white/15 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-widest uppercase text-sm placeholder-gray-600 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={submittingCode || !inputCode.trim()}
                  className="px-4 bg-gradient-to-r from-[#6C5CE7] to-[#00D4FF] hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all shadow-[0_0_15px_rgba(108,92,231,0.3)] shrink-0"
                >
                  {submittingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#0F1624] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">In-Game Identity:</span>
                <span className="font-mono font-bold text-[#00D4FF]">
                  {hostInGameUsername || hostUsername}
                </span>
              </div>

              {/* Host expired switch trigger */}
              {isExpired ? (
                <button
                  type="button"
                  onClick={triggerSwitchHost}
                  disabled={switchingHost}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-bounce"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${switchingHost ? 'animate-spin' : ''}`} />
                  {switchingHost ? 'Switching Host...' : 'Timer Expired — Switch Host Now'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping" />
                  <span>Lobby room pending creation</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Expiry Warning or Error */}
      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-amber-400"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              The 3-minute limit has expired. Host privileges are transferring to ensure fair and active play.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
