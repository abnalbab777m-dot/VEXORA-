import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?search=${search}&status=${status}&role=${role}&page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, status, role, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Users Management</h1>
          <p className="text-gray-400">Manage platform users, roles, and status.</p>
        </div>
      </div>

      <div className="bg-[#0F1624] p-4 rounded-2xl border border-white/5 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by username, email, or ID..."
            className="w-full bg-[#070B14] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] flex-1 md:w-40 appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="FROZEN">Frozen</option>
            <option value="BANNED">Banned</option>
          </select>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="bg-[#070B14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6C5CE7] flex-1 md:w-32 appearance-none"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold hidden md:table-cell">Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold hidden sm:table-cell">Joined</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mx-auto mb-4" />
                    <p>Loading users...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#EF4444]">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>{error}</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No users found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#070B14] border border-white/10 flex items-center justify-center font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.username}</div>
                          <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'text-[#6C5CE7]' : 'text-gray-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        user.status === 'ACTIVE' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                        user.status === 'SUSPENDED' ? 'bg-yellow-500/10 text-yellow-500' :
                        user.status === 'BANNED' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 hidden sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="inline-flex px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page <span className="font-bold text-white">{page}</span> of <span className="font-bold text-white">{pagination.totalPages}</span>
              {' '} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
