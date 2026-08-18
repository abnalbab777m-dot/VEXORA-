import { Outlet, Link, useLocation } from 'react-router-dom';
import { Gamepad2, LayoutDashboard, Wallet, User, Trophy, LogOut, DatabaseBackup, Info, Menu, X, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.database === 'not_configured') {
          setIsDemoMode(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (res.ok) {
          const count = (data.data || []).filter((n: any) => !n.read).length;
          setUnreadCount(count);
        }
      } catch (err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {isDemoMode && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-500 text-xs font-bold uppercase tracking-widest py-2 px-4 flex items-center justify-center gap-2 text-center z-[100] relative">
          <DatabaseBackup className="w-4 h-4" /> 
          Demo Mode: Database not configured. Running in Preview.
        </div>
      )}
      <header className="sticky top-0 z-50 bg-[#0F1624]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6C5CE7] to-[#00D4FF] flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.3)] group-hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] transition-all">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider text-white">VEXORA</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/games" className="text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.games') || 'Games'}</Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.leaderboard') || 'Leaderboard'}</Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.dashboard') || 'Dashboard'}</Link>
                <Link to="/wallet" className="text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.wallet') || 'Wallet'}</Link>
                <Link to="/friends" className="text-gray-300 hover:text-white transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.friends') || 'Friends'}</Link>
                <Link to="/notifications" className="text-gray-300 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-[#EF4444] hover:text-red-400 transition-colors text-sm uppercase tracking-widest font-semibold">{t('nav.admin') || 'Admin Panel'}</Link>
                )}
              </>
            )}
          </nav>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 hover:text-white p-2">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {!user ? (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white font-medium px-4 py-2">{t('nav.login') || 'Login'}</Link>
                <Link to="/register" className="bg-[#6C5CE7] hover:bg-[#5a4cd1] text-white px-6 py-2.5 rounded-lg font-semibold shadow-[0_0_15px_rgba(108,92,231,0.4)] transition-all">
                  {t('nav.register') || 'Sign Up'}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-[#070B14] border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#00D4FF]" />
                  <span className="font-mono text-sm font-semibold text-white">$0.00</span>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-full bg-[#6C5CE7]/20 border border-[#6C5CE7]/50 flex items-center justify-center hover:bg-[#6C5CE7]/30 transition-colors" title={user.username}>
                  <User className="w-5 h-5 text-[#6C5CE7]" />
                </Link>
                <button onClick={logout} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-red-400 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0F1624] border-b border-white/5 absolute top-20 left-0 w-full z-40">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/games" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2">{t('nav.games') || 'Games'}</Link>
            <Link onClick={() => setIsMobileMenuOpen(false)} to="/leaderboard" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2">{t('nav.leaderboard') || 'Leaderboard'}</Link>
            {user && (
              <>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/dashboard" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2">{t('nav.dashboard') || 'Dashboard'}</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/wallet" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2">{t('nav.wallet') || 'Wallet'}</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/friends" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2">{t('nav.friends') || 'Friends'}</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/notifications" className="text-gray-300 hover:text-white text-sm uppercase tracking-widest font-semibold py-2 flex items-center gap-2">
                  {t('nav.notifications') || 'Notifications'}
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="text-[#EF4444] hover:text-red-400 text-sm uppercase tracking-widest font-semibold py-2">{t('nav.admin') || 'Admin Panel'}</Link>
                )}
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-left text-red-400 hover:text-red-300 text-sm uppercase tracking-widest font-semibold py-2 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> {t('nav.logout') || 'Logout'}
                </button>
              </>
            )}
            {!user && (
               <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                 <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="text-gray-300 text-center py-2">{t('nav.login') || 'Login'}</Link>
                 <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="bg-[#6C5CE7] text-white text-center py-2 rounded-lg">{t('nav.register') || 'Sign Up'}</Link>
               </div>
            )}
            <div className="pt-4 border-t border-white/10 flex justify-center">
               <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}

      
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      <footer className="bg-[#0F1624] border-t border-white/5 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#6C5CE7]" />
            <span className="text-xl font-bold tracking-wider">VEXORA</span>
          </div>
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Vexora Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</Link>
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</Link>
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
