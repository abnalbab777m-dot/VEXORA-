import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminNavigation } from '../../components/AdminNavigation';
import { Loader2, Plus, Edit2, Trash2, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export function AdminPaymentMethods() {
    const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'BANK', details: '{}', isActive: true, isDepositEnabled: true, isWithdrawalEnabled: true, displayOrder: 0
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment-methods?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setMethods(data.data);
      } else setError(data.error?.message);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/admin/payment-methods/${editingId}` : `/api/admin/payment-methods`;
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...formData,
        details: JSON.parse(formData.details)
      };
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchMethods();
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Invalid JSON in details or network error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <AdminNavigation />
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Payment Methods</h1>
          <p className="text-gray-400 mt-1">Manage available deposit methods for users.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', type: 'BANK', details: '{\n  "accountHolder": "",\n  "iban": ""\n}', isActive: true, isDepositEnabled: true, isWithdrawalEnabled: true, displayOrder: 0 }); setIsModalOpen(true); }}
          className="bg-[#6C5CE7] hover:bg-[#5a4cd1] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Method
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#6C5CE7]" /></div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map(method => (
            <div key={method.id} className="bg-[#0F1624] border border-white/5 rounded-2xl p-6 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => {
                  setEditingId(method.id);
                  setFormData({
                    name: method.name,
                    type: method.type,
                    details: JSON.stringify(method.details, null, 2),
                    isActive: method.isActive,
                    isDepositEnabled: method.isDepositEnabled,
                    isWithdrawalEnabled: method.isWithdrawalEnabled,
                    displayOrder: method.displayOrder
                  });
                  setIsModalOpen(true);
                }} className="text-gray-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
              </div>
              <h3 className="font-bold text-lg mb-1">{method.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{method.type}</p>
              
              <div className="bg-[#070B14] p-3 rounded-lg text-xs font-mono text-gray-400 mb-4 overflow-x-auto">
                <pre>{JSON.stringify(method.details, null, 2)}</pre>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded text-xs font-bold ${method.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {method.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className="text-gray-500">Order: {method.displayOrder}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {method.isDepositEnabled && <span className="bg-[#6C5CE7]/20 text-[#6C5CE7] px-2 py-1 rounded text-xs font-bold">DEPOSIT</span>}
                {method.isWithdrawalEnabled && <span className="bg-[#00D4FF]/20 text-[#00D4FF] px-2 py-1 rounded text-xs font-bold">WITHDRAWAL</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0F1624] border border-white/10 p-8 rounded-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2">
                  <option value="BANK">BANK</option>
                  <option value="CRYPTO">CRYPTO</option>
                  <option value="E_WALLET">E_WALLET</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Details (JSON)</label>
                <textarea value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} className="w-full bg-[#070B14] border border-white/10 rounded-lg px-4 py-2 font-mono text-sm h-32" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="accent-[#6C5CE7]" />
                    Is Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    Order: <input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} className="w-16 bg-[#070B14] border border-white/10 rounded px-2 py-1" />
                  </label>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={formData.isDepositEnabled} onChange={e => setFormData({...formData, isDepositEnabled: e.target.checked})} className="accent-[#6C5CE7]" />
                    Allow Deposits
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={formData.isWithdrawalEnabled} onChange={e => setFormData({...formData, isWithdrawalEnabled: e.target.checked})} className="accent-[#00D4FF]" />
                    Allow Withdrawals
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-[#6C5CE7] hover:bg-[#5a4cd1] rounded-lg font-bold">Save</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
