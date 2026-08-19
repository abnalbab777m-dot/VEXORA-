import React, { useState } from 'react';
import { User, Settings, Shield, Edit2, LogOut, Loader2, Check, Lock, Trophy, Target, TrendingUp, DollarSign, Gamepad2, Image as ImageIcon, Medal } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const { user, logout, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [efootballUsername, setEfootballUsername] = useState(user?.efootballUsername || user?.gameUsername || '');
  const [jawakerUsername, setJawakerUsername] = useState(user?.jawakerUsername || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setAvatar(user.avatar || '');
      setEfootballUsername(user.efootballUsername || user.gameUsername || '');
      setJawakerUsername(user.jawakerUsername || '');
    }
  }, [user]);

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [stats, setStats] = useState({ matches: 0, wins: 0, losses: 0, winRate: 0, winnings: '0.00', rank: 0 });

  React.useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/statistics/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setStats({
              matches: data.data.totalMatches,
              wins: data.data.wins,
              losses: data.data.losses,
              winRate: Math.round(data.data.winRate),
              winnings: parseFloat(data.data.earnings).toFixed(2),
              rank: data.data.rank
            });
          }
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    };
    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (
      username === user?.username && 
      avatar === (user?.avatar || '') &&
      efootballUsername === (user?.efootballUsername || user?.gameUsername || '') &&
      jawakerUsername === (user?.jawakerUsername || '')
    ) {
      setIsEditing(false);
      return;
    }

    if (!efootballUsername.trim()) {
      setError('eFootball username cannot be empty');
      return;
    }

    if (!jawakerUsername.trim()) {
      setError('Jawaker username cannot be empty');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          avatar: avatar || undefined,
          efootballUsername: efootballUsername.trim(),
          jawakerUsername: jawakerUsername.trim(),
          gameUsername: efootballUsername.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      login(data.data);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError("New passwords don't match");
      setChangingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/users/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to change password');
      }

      setPasswordSuccess(true);
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        // Force logout as session was invalidated
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1624] border border-white/10 p-8 rounded-2xl w-full max-w-md relative"
          >
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            {passwordError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">{passwordError}</div>}
            {passwordSuccess && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg text-sm">Password changed successfully. Redirecting to login...</div>}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                <input 
                  type="password" required
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                <input 
                  type="password" required minLength={8}
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                <input 
                  type="password" required minLength={8}
                  value={passwordData.confirmNewPassword}
                  onChange={e => setPasswordData({...passwordData, confirmNewPassword: e.target.value})}
                  className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-[#6C5CE7]"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={changingPassword || passwordSuccess} className="flex-1 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5a4cd1] rounded-lg font-medium transition-colors flex justify-center items-center">
                  {changingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="bg-[#0F1624] border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#6C5CE7] to-[#00D4FF] p-1">
              <div className="w-full h-full rounded-full bg-[#070B14] border-4 border-black flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col justify-center md:justify-start gap-4 mb-1">
              {isEditing ? (
                <div className="flex flex-col gap-3 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Platform Username</label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="bg-[#070B14] border border-[#6C5CE7] rounded-lg px-3 py-1.5 text-base font-bold w-full focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Avatar Image URL</label>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <input 
                        type="url" 
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="bg-[#070B14] border border-white/20 rounded-lg px-3 py-1.5 text-sm font-medium w-full focus:outline-none focus:border-[#00D4FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#00D4FF] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5" /> eFootball ID *
                      </label>
                      <input 
                        type="text" 
                        value={efootballUsername}
                        onChange={(e) => setEfootballUsername(e.target.value)}
                        placeholder="eFootball In-Game ID"
                        required
                        className="bg-[#070B14] border border-[#00D4FF]/50 rounded-lg px-3 py-1.5 text-sm font-bold w-full focus:outline-none focus:border-[#00D4FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5" /> Jawaker ID *
                      </label>
                      <input 
                        type="text" 
                        value={jawakerUsername}
                        onChange={(e) => setJawakerUsername(e.target.value)}
                        placeholder="Jawaker In-Game ID"
                        required
                        className="bg-[#070B14] border border-purple-500/50 rounded-lg px-3 py-1.5 text-sm font-bold w-full focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#6C5CE7] text-white flex items-center gap-2 hover:bg-[#5a4cd1] text-sm font-bold transition-colors">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                    </button>
                    <button onClick={() => { 
                      setIsEditing(false); 
                      setUsername(user.username); 
                      setAvatar(user.avatar || '');
                      setEfootballUsername(user.efootballUsername || user.gameUsername || '');
                      setJawakerUsername(user.jawakerUsername || '');
                    }} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-sm font-bold transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-black">{user.username}</h1>
                    <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/5">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-400 mb-3 font-mono text-sm">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 text-xs font-bold uppercase tracking-wider">
                      {user.role} TIER
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-[#00D4FF] border border-blue-500/20 text-xs font-bold font-mono">
                      ⚽ {user.efootballUsername || user.gameUsername || 'eFootball: Not set'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
                      🃏 {user.jawakerUsername || 'Jawaker: Not set'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-400 text-sm mt-2">Profile updated successfully</p>}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[#6C5CE7]" /> Career Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#0F1624] border border-[#6C5CE7]/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(108,92,231,0.1)]">
          <Medal className="w-6 h-6 text-[#6C5CE7] mb-2" />
          <span className="text-2xl font-black">#{stats.rank > 0 ? stats.rank : '-'}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Global Rank</span>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Gamepad2 className="w-6 h-6 text-gray-500 mb-2" />
          <span className="text-2xl font-black">{stats.matches}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Total Matches</span>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Trophy className="w-6 h-6 text-green-400 mb-2" />
          <span className="text-2xl font-black">{stats.wins}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Wins</span>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Target className="w-6 h-6 text-red-400 mb-2" />
          <span className="text-2xl font-black">{stats.losses}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Losses</span>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-6 h-6 text-[#00D4FF] mb-2" />
          <span className="text-2xl font-black">{stats.winRate}%</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Win Rate</span>
        </div>
        <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
          <span className="text-2xl font-black">${stats.winnings}</span>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Winnings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#00D4FF]" /> Account Info</h3>
            <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 font-medium">Status</span>
                <span className="font-bold text-green-400">{user.status}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 font-medium">Email</span>
                <span className="font-bold">{user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-gray-400 font-medium">Role</span>
                <span className="font-bold">{user.role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400 font-medium">ID</span>
                <span className="font-bold text-sm text-gray-500">{user.id.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-[#6C5CE7]" /> Linked Game Accounts</h3>
            <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="p-3 bg-[#070B14] border border-blue-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase font-bold text-[#00D4FF] tracking-wider">eFootball Mobile / Console</span>
                  <span className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                </div>
                <p className="font-mono font-bold text-white text-base truncate">
                  {user.efootballUsername || user.gameUsername || 'Not connected'}
                </p>
              </div>

              <div className="p-3 bg-[#070B14] border border-purple-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">Jawaker ID</span>
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <p className="font-mono font-bold text-white text-base truncate">
                  {user.jawakerUsername || 'Not connected'}
                </p>
              </div>

              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Game Identities
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400" /> Settings</h3>
            <div className="bg-[#0F1624] border border-white/5 rounded-2xl p-2">
              <button onClick={() => setIsChangingPassword(true)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors">
                <span className="font-medium flex items-center gap-3"><Lock className="w-4 h-4" /> Change Password</span>
              </button>
              <div className="h-[1px] bg-white/5 my-1 mx-4"></div>
              <button onClick={logout} className="w-full flex items-center gap-3 p-4 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition-colors font-bold">
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

