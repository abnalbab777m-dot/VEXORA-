import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AdminNavigation } from '../../components/AdminNavigation';

export function AdminAuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.items);
        setPagination(data.data.pagination);
      } else {
        setError(data.error?.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase mb-2">Audit Logs</h1>
          <p className="text-gray-400">System-wide administrative action tracking.</p>
        </div>
      </div>

      <div className="bg-[#0F1624] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Admin (Actor)</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold hidden md:table-cell">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7] mx-auto mb-4" />
                    <p>Loading audit logs...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#EF4444]">
                    <AlertCircle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>{error}</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-gray-400 font-mono text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Link to={`/admin/users/${log.userId}`} className="font-mono text-xs text-[#6C5CE7] hover:underline">
                        {log.userId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {log.details}
                    </td>
                    <td className="p-4 text-xs font-mono text-gray-500 hidden md:table-cell">
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && logs.length > 0 && (
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
