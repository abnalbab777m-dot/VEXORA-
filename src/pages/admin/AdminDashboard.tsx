import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Swords, Activity, DollarSign, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error?.message || 'Failed to load stats');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-4" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-6 text-center text-[#EF4444] max-w-lg mx-auto mt-10">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Platform overview and statistics.</p>
        </div>
      </div>

      {stats && (
        <div className="space-y-8">
          {/* Users */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#6C5CE7]" /> Users Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Users</p>
                <p className="text-4xl font-black font-mono">{stats.users.total}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-[#22C55E]/20 relative overflow-hidden">
                <p className="text-[#22C55E] text-sm font-medium uppercase tracking-wider mb-2">Active</p>
                <p className="text-4xl font-black font-mono text-[#22C55E]">{stats.users.active}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-[#EF4444]/20 relative overflow-hidden">
                <p className="text-[#EF4444] text-sm font-medium uppercase tracking-wider mb-2">Suspended / Banned</p>
                <p className="text-4xl font-black font-mono text-[#EF4444]">{stats.users.suspended + stats.users.banned}</p>
              </div>
            </div>
          </div>

          {/* Matches */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Swords className="w-5 h-5 text-[#00D4FF]" /> Matches Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Matches</p>
                <p className="text-4xl font-black font-mono">{stats.matches.total}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-[#00D4FF]/20 relative overflow-hidden">
                <p className="text-[#00D4FF] text-sm font-medium uppercase tracking-wider mb-2">Active</p>
                <p className="text-4xl font-black font-mono text-[#00D4FF]">{stats.matches.active}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Completed</p>
                <p className="text-4xl font-black font-mono text-gray-300">{stats.matches.completed}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-yellow-500/20 relative overflow-hidden">
                <p className="text-yellow-500 text-sm font-medium uppercase tracking-wider mb-2">Disputes</p>
                <p className="text-4xl font-black font-mono text-yellow-500">{stats.matches.disputed}</p>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#22C55E]" /> Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Deposits</p>
                <p className="text-4xl font-black font-mono text-white">${parseFloat(stats.financials.totalDeposits).toFixed(2)}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Withdrawals</p>
                <p className="text-4xl font-black font-mono text-white">${parseFloat(stats.financials.totalWithdrawals).toFixed(2)}</p>
              </div>
              <div className="bg-[#0F1624] p-6 rounded-2xl border border-[#6C5CE7]/30 shadow-[0_0_20px_rgba(108,92,231,0.1)] relative overflow-hidden">
                <p className="text-[#6C5CE7] text-sm font-medium uppercase tracking-wider mb-2">Platform Commission (15%)</p>
                <p className="text-4xl font-black font-mono text-[#6C5CE7]">${parseFloat(stats.financials.platformCommission).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
