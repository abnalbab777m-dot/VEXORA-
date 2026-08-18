import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Wallet, Swords, Shield, Activity, Loader2, AlertCircle, ArrowLeft, Ban, PlaySquare, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchUserDetail = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch user');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        setData((prev: any) => ({
          ...prev,
          user: { ...prev.user, status: newStatus }
        }));
      } else {
        alert(result.error?.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mb-4" />
        <p>Loading user details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-6 text-center text-[#EF4444]">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'User not found'}</p>
          <Link to="/admin/users" className="inline-block mt-4 text-white font-bold underline">Back to Users</Link>
        </div>
      </div>
    );
  }

  const { user, wallet, stats } = data;
  const isSelf = currentUser?.userId === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-semibold text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 flex items-center justify-center text-2xl font-black text-[#6C5CE7]">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user.username}</h1>
            <p className="text-gray-400 font-mono text-sm">{user.email}</p>
            <p className="text-gray-500 text-xs mt-1 font-mono">ID: {user.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase ${
            user.role === 'ADMIN' ? 'bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30' : 'bg-gray-800 text-gray-400'
          }`}>
            {user.role}
          </span>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black uppercase ${
            user.status === 'ACTIVE' ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' :
            user.status === 'SUSPENDED' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
            user.status === 'BANNED' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' :
            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
          }`}>
            {user.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Wallet Info */}
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 md:col-span-1">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-[#22C55E]" /> Financials</h2>
          {wallet ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Available Balance</p>
                <p className="text-2xl font-mono font-bold text-white">${parseFloat(wallet.availableBalance).toFixed(2)}</p>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Locked</p>
                  <p className="text-sm font-mono text-yellow-500">${parseFloat(wallet.lockedBalance).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Balance</p>
                  <p className="text-sm font-mono text-gray-300">${parseFloat(wallet.balance).toFixed(2)}</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 mt-4">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Manage Balance</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="balanceAmount"
                    placeholder="Amount"
                    className="flex-1 bg-[#070B14] border border-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                  />
                  <input
                    type="text"
                    id="balanceReason"
                    placeholder="Reason"
                    className="flex-1 bg-[#070B14] border border-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={async () => {
                      const amount = parseFloat((document.getElementById('balanceAmount') as HTMLInputElement).value);
                      const reason = (document.getElementById('balanceReason') as HTMLInputElement).value;
                      if (!amount || amount <= 0 || !reason) return alert('Valid amount and reason required');
                      try {
                        const res = await fetch(`/api/admin/users/${user.id}/balance`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', },
                          body: JSON.stringify({ type: 'CREDIT', amount, reason })
                        });
                        if (res.ok) fetchUserDetail();
                        else alert('Failed to add balance');
                      } catch (err) { alert('Error'); }
                    }}
                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 py-1.5 rounded text-sm font-bold transition-colors"
                  >
                    Add
                  </button>
                  <button 
                    onClick={async () => {
                      const amount = parseFloat((document.getElementById('balanceAmount') as HTMLInputElement).value);
                      const reason = (document.getElementById('balanceReason') as HTMLInputElement).value;
                      if (!amount || amount <= 0 || !reason) return alert('Valid amount and reason required');
                      try {
                        const res = await fetch(`/api/admin/users/${user.id}/balance`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', },
                          body: JSON.stringify({ type: 'DEBIT', amount, reason })
                        });
                        if (res.ok) fetchUserDetail();
                        else alert('Failed to deduct balance');
                      } catch (err) { alert('Error'); }
                    }}
                    className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-1.5 rounded text-sm font-bold transition-colors"
                  >
                    Deduct
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No wallet found</p>
          )}
        </div>

        {/* Stats Info */}
        <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 md:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Swords className="w-5 h-5 text-[#00D4FF]" /> Match Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#070B14] p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Matches</p>
              <p className="text-2xl font-mono font-bold text-white">{stats.totalMatches}</p>
            </div>
            <div className="bg-[#070B14] p-4 rounded-xl border border-white/5">
              <p className="text-xs text-[#22C55E] uppercase font-semibold mb-1">Wins</p>
              <p className="text-2xl font-mono font-bold text-[#22C55E]">{stats.wins}</p>
            </div>
            <div className="bg-[#070B14] p-4 rounded-xl border border-white/5">
              <p className="text-xs text-[#EF4444] uppercase font-semibold mb-1">Losses</p>
              <p className="text-2xl font-mono font-bold text-[#EF4444]">{stats.losses}</p>
            </div>
            <div className="bg-[#070B14] p-4 rounded-xl border border-white/5">
              <p className="text-xs text-[#00D4FF] uppercase font-semibold mb-1">Win Rate</p>
              <p className="text-2xl font-mono font-bold text-[#00D4FF]">
                {stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-[#0F1624] p-6 rounded-2xl border border-white/5 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-gray-400" /> Administrative Actions</h2>
        
        {isSelf ? (
          <div className="bg-yellow-500/10 text-yellow-500 p-4 rounded-xl border border-yellow-500/20 text-sm">
            You cannot perform administrative actions on your own account.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {user.status !== 'ACTIVE' && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                disabled={statusLoading}
                className="px-6 py-2.5 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Mark Active
              </button>
            )}
            
            {user.status !== 'SUSPENDED' && (
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                disabled={statusLoading}
                className="px-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
            )}
            
            {user.status !== 'FROZEN' && (
              <button
                onClick={() => handleStatusChange('FROZEN')}
                disabled={statusLoading}
                className="px-6 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" /> Freeze Wallet
              </button>
            )}
            
            {user.status !== 'BANNED' && (
              <button
                onClick={() => handleStatusChange('BANNED')}
                disabled={statusLoading}
                className="px-6 py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20 font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" /> Ban Permanently
              </button>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
