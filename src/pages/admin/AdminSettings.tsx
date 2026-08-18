import { useState, useEffect } from 'react';
import { Loader2, Plus, Settings, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminSettings() {
    const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newStake, setNewStake] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{success: boolean, message: string} | null>(null);
  
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [savingTelegram, setSavingTelegram] = useState(false);

  useEffect(() => {
    fetchGames();
    fetchTelegramSettings();
  }, []);

  const fetchTelegramSettings = async () => {
    try {
      const res = await fetch('/api/admin/telegram-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setBotToken(data.data.botToken || '');
        setChatId(data.data.chatId || '');
      }
    } catch(err) {
      console.error(err);
    }
  };

  const saveTelegramSettings = async () => {
    setSavingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/admin/telegram-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId })
      });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus({ success: true, message: 'Settings saved successfully!' });
      } else {
        setTelegramStatus({ success: false, message: data.error?.message || 'Failed to save' });
      }
    } catch(err: any) {
      setTelegramStatus({ success: false, message: err.message || 'Network error' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const testTelegram = async () => {
    setTelegramLoading(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/admin/test-telegram', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTelegramStatus({ success: true, message: 'Notification sent successfully!' });
      } else {
        setTelegramStatus({ success: false, message: data.error?.message || 'Failed to send notification' });
      }
    } catch (err: any) {
      setTelegramStatus({ success: false, message: err.message || 'Network error' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
      }
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const addStake = async () => {
    if (!newStake || !selectedGame) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/stakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ gameId: selectedGame, amount: newStake })
      });
      if (res.ok) {
        setNewStake('');
        fetchGames();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStakeStatus = async (stakeId: string, currentStatus: string) => {
    if (!window.confirm('Are you sure you want to toggle this stake?')) return;
    try {
      await fetch(`/api/admin/stakes/${stakeId}/toggle`, {
        method: 'POST',
        
      });
      fetchGames();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col pt-24 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-4" />
      </div>
    );
  }

  return (
    <div className="flex-1 pt-24 px-4 pb-12 max-w-7xl mx-auto w-full">
      <AdminNavigation />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-[#6C5CE7]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">Betting Settings</h1>
          <p className="text-gray-400 mt-1">Manage allowed stakes and betting configurations</p>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Integrations</h2>
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-[#131A2A] rounded-lg border border-white/5">
            <div className="mb-4">
              <p className="font-bold text-white mb-1">Telegram Notifications</p>
              <p className="text-sm text-gray-400">Configure your Telegram bot token and chat ID to receive notifications.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Bot Token</label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCDEF..."
                  className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-2 focus:border-[#6C5CE7] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Chat ID</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="-100123456789"
                  className="w-full bg-[#0F1624] border border-white/10 rounded-lg px-4 py-2 focus:border-[#6C5CE7] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveTelegramSettings}
                disabled={savingTelegram}
                className="px-6 py-2 bg-[#6C5CE7] hover:bg-[#5a4cd1] disabled:opacity-50 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {savingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Settings
              </button>
              <button
                onClick={testTelegram}
                disabled={telegramLoading || !botToken || !chatId}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold transition-colors flex items-center gap-2"
              >
                {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Test Bot
              </button>
            </div>
          </div>

          {telegramStatus && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${telegramStatus.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {telegramStatus.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
              <p>{telegramStatus.message}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Stake</h2>
        <div className="flex flex-wrap gap-4">
          <select 
            value={selectedGame} 
            onChange={e => setSelectedGame(e.target.value)}
            className="bg-[#131A2A] border border-white/10 rounded-lg px-4 py-2 focus:border-[#6C5CE7] outline-none"
          >
            <option value="">Select Game</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input 
            type="number" 
            placeholder="Amount (USD)" 
            value={newStake}
            onChange={e => setNewStake(e.target.value)}
            className="bg-[#131A2A] border border-white/10 rounded-lg px-4 py-2 focus:border-[#6C5CE7] outline-none"
          />
          <button 
            onClick={addStake}
            disabled={actionLoading || !selectedGame || !newStake}
            className="px-6 py-2 bg-[#6C5CE7] hover:bg-[#5a4cd1] disabled:opacity-50 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Stake
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {games.map(game => (
          <div key={game.id} className="bg-[#0F1624] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {game.name} <span className="text-sm font-normal text-gray-400 bg-white/5 px-2 py-1 rounded">Stakes</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {game.stakes.sort((a: any, b: any) => Number(a.amount) - Number(b.amount)).map((stake: any) => (
                <div key={stake.id} className="bg-[#131A2A] border border-white/5 p-4 rounded-xl flex flex-col items-center gap-3">
                  <div className="text-2xl font-bold text-[#00D4FF]">${Number(stake.amount).toFixed(2)}</div>
                  <button 
                    onClick={() => toggleStakeStatus(stake.id, stake.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase w-full flex justify-center items-center gap-1 transition-colors ${
                      stake.status === 'ACTIVE' 
                        ? 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {stake.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {stake.status}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
