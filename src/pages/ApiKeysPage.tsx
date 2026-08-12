import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../services/api';

interface ApiKey {
  id: number;
  name: string;
  key_hint: string;
  status: 'ACTIVE' | 'REVOKED';
  created_at: string;
  last_used_at: string | null;
}

export const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await apiFetch('/api-keys');
      if (res.success && res.data) {
        setApiKeys(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newAppName })
      });
      if (res.success && res.data) {
        setCreatedKey(res.data.key);
        setNewAppName('');
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key', error);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin melakukan revoke API Key ini? Aksi ini tidak dapat dibatalkan.')) return;
    try {
      const res = await apiFetch(`/api-keys/${id}/revoke`, {
        method: 'POST'
      });
      if (res.success) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to revoke API key', error);
    }
  };

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeSuccessModal = () => {
    setCreatedKey(null);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Key className="w-7 h-7 text-yellow-500" />
            API Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola API Key untuk aplikasi internal dan developer.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Buat API Key
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Aplikasi</th>
                <th className="px-6 py-4">API Key Preview</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Last Used</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada API Key.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{key.key_hint || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${key.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(key.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {key.last_used_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(key.last_used_at).toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum pernah</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && !createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleCreate}>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Buat API Key</h3>
                <p className="text-sm text-slate-500 mt-1">API Key digunakan untuk integrasi sistem internal.</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Aplikasi</label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="Contoh: Hosting Application"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg transition-colors"
                >
                  Buat API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-emerald-100">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-emerald-50 text-emerald-700">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">API Key Berhasil Dibuat</h3>
                <p className="text-sm text-emerald-600 mt-0.5">Silakan simpan API Key ini sekarang.</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="block mb-1">PERHATIAN!</strong>
                  API Key ini <strong>hanya akan ditampilkan sekali</strong>. Jika jendela ini ditutup, Anda tidak akan bisa melihatnya lagi dan harus membuat API Key baru.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 block p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-sm break-all select-all">
                    {createdKey}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 rounded-lg font-semibold transition-colors"
                  >
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={closeSuccessModal}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
              >
                Saya Sudah Menyimpan API Key Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
