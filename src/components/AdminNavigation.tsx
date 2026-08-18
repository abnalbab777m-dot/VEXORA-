import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Swords, DollarSign, Gamepad2, FileText, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AdminNavigation() {
  const location = useLocation();
  const { logout } = useAuth();

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/matches', label: 'Matches', icon: Swords },
    { to: '/admin/transactions', label: 'Ledger', icon: DollarSign },
    { to: '/admin/games', label: 'Games', icon: Gamepad2 },
    { to: '/admin/settings', label: 'Settings', icon: DollarSign },
    { to: '/admin/payment-methods', label: 'Payment Methods', icon: DollarSign },
    { to: '/admin/disputes', label: 'Disputes', icon: ShieldAlert },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-[#0F1624] p-2 rounded-2xl border border-white/5">
      {links.map(link => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to || (link.to !== '/admin' && location.pathname.startsWith(link.to));
        
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors ${
              isActive 
                ? 'bg-[#6C5CE7] text-white shadow-[0_0_15px_rgba(108,92,231,0.4)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
      <button
        onClick={() => logout()}
        className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
