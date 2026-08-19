import { useState, useEffect } from 'react';
import { 
  Loader2, Plus, Settings, CheckCircle2, XCircle, 
  Send, Bot, MessageSquare, ShieldAlert, Users, 
  DollarSign, ArrowDownRight, Info, HelpCircle, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminSettings() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newStake, setNewStake] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Telegram States
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ success: boolean; message: string; botInfo?: any } | null>(null);
  
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [notifyDeposits, setNotifyDeposits] = useState(true);
  const [notifyWithdrawals, setNotifyWithdrawals] = useState(true);
  const [notifyDisputes, setNotifyDisputes] = useState(true);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

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
        setEnabled(data.data.enabled !== false);
        setNotifyUsers(data.data.notifyUsers !== false);
        setNotifyDeposits(data.data.notifyDeposits !== false);
        setNotifyWithdrawals(data.data.notifyWithdrawals !== false);
        setNotifyDisputes(data.data.notifyDisputes !== false);
        setBotInfo(data.data.botInfo || null);
      }
    } catch (err) {
      console.error('Failed to load telegram settings:', err);
    }
  };

  const saveTelegramSettings = async () => {
    setSavingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/admin/telegram-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          botToken, 
          chatId,
          enabled,
          notifyUsers,
          notifyDeposits,
          notifyWithdrawals,
          notifyDisputes
        })
      });
      const data = await res.json();
      if (data.success) {
        setBotInfo(data.data?.botInfo || null);
        setTelegramStatus({ 
          success: true, 
          message: 'تم حفظ وتفعيل إعدادات بوت التليغرام بنجاح!',
          botInfo: data.data?.botInfo
        });
      } else {
        setTelegramStatus({ success: false, message: data.error?.message || 'فشل حفظ الإعدادات' });
      }
    } catch (err: any) {
      setTelegramStatus({ success: false, message: err.message || 'خطأ في الاتصال بالخادم' });
    } finally {
      setSavingTelegram(false);
    }
  };

  const testTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTelegramStatus({
        success: false,
        message: 'يرجى كتابة رمز البوت (Bot Token) ومعرف المحادثة (Chat ID) أولاً لإجراء الاختبار.'
      });
      return;
    }

    setTelegramLoading(true);
    setTelegramStatus(null);
    try {
      const res = await fetch('/api/admin/test-telegram', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() })
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.botInfo) {
          setBotInfo(data.data.botInfo);
        }
        setTelegramStatus({ 
          success: true, 
          message: data.data?.message || 'تم إرسال إشعار الاختبار إلى محادثة تليغرام بنجاح! تفقد تطبيق تليغرام الآن 🚀',
          botInfo: data.data?.botInfo
        });
      } else {
        setTelegramStatus({ 
          success: false, 
          message: data.error?.message || 'فشل إرسال الإشعار. يرجى التحقق من صحة التوكن و Chat ID والضغط على /start للبوت.' 
        });
      }
    } catch (err: any) {
      setTelegramStatus({ success: false, message: err.message || 'خطأ في الاتصال بالخادم' });
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
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">إعدادات النظام والتحكم</h1>
          <p className="text-gray-400 mt-1">إدارة تكامل البوت والإشعارات الفورية وفئات الرهانات المتاحة</p>
        </div>
      </div>

      {/* TELEGRAM BOT CONFIGURATION CARD */}
      <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">نظام إشعارات بوت التليغرام</h2>
                {botInfo?.username ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    متصل: @{botInfo.username}
                  </span>
                ) : botToken && chatId ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    قيد التكوين
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-white/10">
                    غير مهيأ
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                استقبال تنبيهات فورية للمشرفين عند تسجيل لاعب، طلبات الإيداع والسحب، والنزاعات
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#229ED9] bg-[#229ED9]/10 hover:bg-[#229ED9]/20 px-3 py-1.5 rounded-lg border border-[#229ED9]/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {showGuide ? 'إخفاء دليل الإعداد' : 'كيفية الحصول على التوكن و Chat ID؟'}
          </button>
        </div>

        {/* STEP BY STEP GUIDE ACCORDION */}
        {showGuide && (
          <div className="mb-6 p-4 bg-[#131A2A] border border-[#229ED9]/30 rounded-xl text-sm text-gray-300 space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2 text-base">
              <Info className="w-4 h-4 text-[#229ED9]" />
              خطوات تفعيل بوت تليغرام في 3 دقائق:
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                افتح تطبيق تليغرام وابحث عن البوت الرسمي: <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#229ED9] underline font-bold">@BotFather</a>
              </li>
              <li>
                أرسل له الأمر <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">/newbot</code> ثم اختر اسماً ومعرفاً للبوت (ينتهي بـ <code className="text-amber-300">_bot</code>).
              </li>
              <li>
                سيعطيك BotFather رمز <b>HTTP API Token</b> (مثال: <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">7123456789:AAH...</code>) — انسخه وضعه في حقل <b>Bot Token</b> أدناه.
              </li>
              <li>
                <span className="text-amber-300 font-bold">خطوة هامة جداً:</span> افتح محادثة البوت الجديد الذي أنشأته على تليغرام واضغط على <b>Start</b> أو أرسل له <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">/start</code> (حتى يسمح تليغرام للبوت بمراسلتك).
              </li>
              <li>
                لمعرفة رقم الـ <b>Chat ID</b> الخاص بك: تحدث مع بوت <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-[#229ED9] underline font-bold">@userinfobot</a> وانسخ رقم الـ Id الخاص بك (أو إذا أردت مجموعة/قناة المشرفين، أضف البوت فيها وانسخ معرّف المجموعة مثل <code className="text-amber-300">-100123456789</code>).
              </li>
              <li>
                اضغط على زر <b>اختبار وإرسال إشعار تجريبي</b> للتأكد من وصول الرسالة فوراً!
              </li>
            </ol>
          </div>
        )}

        {/* INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              رمز البوت (Bot Token) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="7123456789:AAHk4..."
                className="w-full bg-[#131A2A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#229ED9] focus:ring-1 focus:ring-[#229ED9] outline-none transition-colors font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">رمز التوكن الذي تم الحصول عليه من @BotFather</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              معرّف المحادثة / القناة (Chat ID) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789 أو -100123456789"
                className="w-full bg-[#131A2A] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-[#229ED9] focus:ring-1 focus:ring-[#229ED9] outline-none transition-colors font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">معرف حسابك الشخصي أو معرف مجموعة المشرفين</p>
          </div>
        </div>

        {/* NOTIFICATION TOGGLE PREFERENCES */}
        <div className="p-4 bg-[#131A2A] rounded-xl border border-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#229ED9]" />
              أنواع الإشعارات المراد استلامها:
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-300">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#229ED9] focus:ring-0 bg-black/40 border-white/20"
              />
              تفعيل الإشعارات بالكامل
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer border border-white/5 transition-colors">
              <input
                type="checkbox"
                checked={notifyUsers}
                disabled={!enabled}
                onChange={(e) => setNotifyUsers(e.target.checked)}
                className="w-4 h-4 rounded text-[#229ED9] focus:ring-0 bg-black/40 border-white/20"
              />
              <span className="text-gray-200">👤 تسجيل مستخدم جديد</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer border border-white/5 transition-colors">
              <input
                type="checkbox"
                checked={notifyDeposits}
                disabled={!enabled}
                onChange={(e) => setNotifyDeposits(e.target.checked)}
                className="w-4 h-4 rounded text-[#229ED9] focus:ring-0 bg-black/40 border-white/20"
              />
              <span className="text-gray-200">💰 طلبات وتأكيد الإيداع</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer border border-white/5 transition-colors">
              <input
                type="checkbox"
                checked={notifyWithdrawals}
                disabled={!enabled}
                onChange={(e) => setNotifyWithdrawals(e.target.checked)}
                className="w-4 h-4 rounded text-[#229ED9] focus:ring-0 bg-black/40 border-white/20"
              />
              <span className="text-gray-200">💸 طلبات وتأكيد السحب</span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer border border-white/5 transition-colors">
              <input
                type="checkbox"
                checked={notifyDisputes}
                disabled={!enabled}
                onChange={(e) => setNotifyDisputes(e.target.checked)}
                className="w-4 h-4 rounded text-[#229ED9] focus:ring-0 bg-black/40 border-white/20"
              />
              <span className="text-gray-200">🚨 النزاعات والشكاوى</span>
            </label>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {telegramStatus && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm ${
            telegramStatus.success 
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-300 border border-red-500/20'
          }`}>
            {telegramStatus.success ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{telegramStatus.message}</p>
              {telegramStatus.botInfo && (
                <p className="text-xs text-emerald-400/80 mt-1">
                  البوت المتصل: {telegramStatus.botInfo.first_name} (@{telegramStatus.botInfo.username})
                </p>
              )}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={saveTelegramSettings}
            disabled={savingTelegram}
            className="px-6 py-2.5 bg-[#6C5CE7] hover:bg-[#5a4cd1] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#6C5CE7]/20"
          >
            {savingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ وتفعيل الإعدادات
          </button>

          <button
            onClick={testTelegram}
            disabled={telegramLoading}
            className="px-6 py-2.5 bg-[#229ED9] hover:bg-[#1e8bc0] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#229ED9]/20"
          >
            {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            اختبار وإرسال إشعار تجريبي
          </button>
        </div>
      </div>

      {/* STAKES MANAGEMENT */}
      <div className="bg-[#0F1624] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-white">إضافة فئة رهان جديدة (Add Stake)</h2>
        <div className="flex flex-wrap gap-4">
          <select 
            value={selectedGame} 
            onChange={e => setSelectedGame(e.target.value)}
            className="bg-[#131A2A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#6C5CE7] outline-none"
          >
            <option value="">اختر اللعبة</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input 
            type="number" 
            placeholder="المبلغ بالدولار (USD)" 
            value={newStake}
            onChange={e => setNewStake(e.target.value)}
            className="bg-[#131A2A] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#6C5CE7] outline-none"
          />
          <button 
            onClick={addStake}
            disabled={actionLoading || !selectedGame || !newStake}
            className="px-6 py-2.5 bg-[#6C5CE7] hover:bg-[#5a4cd1] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة فئة الرهان
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {games.map(game => (
          <div key={game.id} className="bg-[#0F1624] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              {game.name} <span className="text-sm font-normal text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">فئات الرهان</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {game.stakes?.sort((a: any, b: any) => Number(a.amount) - Number(b.amount)).map((stake: any) => (
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

