import React, { useState, useEffect, useMemo } from 'react';
import { Key, Plus, Trash2, Copy, AlertTriangle, CheckCircle, Clock, Search, Filter, Ban } from 'lucide-react';
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
  const [createdPortal, setCreatedPortal] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

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
        setCreatedPortal(res.data.portal || null);
        setNewAppName('');
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key', error);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mencabut (Revoke) akses Aplikasi ini? Setelah dicabut, aplikasi tidak akan bisa terhubung lagi.')) return;
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

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus permanen data Aplikasi ini dari sistem?')) return;
    try {
      const res = await apiFetch(`/api-keys/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key', error);
    }
  };

  const filteredKeys = useMemo(() => {
    return apiKeys.filter(key => {
      const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || key.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apiKeys, searchTerm, statusFilter]);

  const copyToClipboard = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPortalCreds = () => {
    if (createdPortal) {
      navigator.clipboard.writeText(`Email: ${createdPortal.email}\nPassword: ${createdPortal.password}`);
      setCopiedPortal(true);
      setTimeout(() => setCopiedPortal(false), 2000);
    }
  };

  const closeSuccessModal = () => {
    setCreatedKey(null);
    setCreatedPortal(null);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Key className="w-7 h-7 text-indigo-600" />
            Aplikasi Klien (Client Apps)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftarkan dan kelola akses aplikasi dari luar (seperti Aplikasi Hosting/Web Utama) yang terhubung ke ADMS QRIS.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-xs"
        >
          <Plus className="w-5 h-5" />
          Daftarkan Aplikasi Baru
        </button>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama aplikasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="REVOKED">Sudah Dicabut</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Nama Aplikasi</th>
                <th className="px-6 py-4">Kunci API (Disensor)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tanggal Dibuat</th>
                <th className="px-6 py-4">Terakhir Digunakan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Memuat data aplikasi klien...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center flex flex-col items-center justify-center">
                    <Key className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada aplikasi yang ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className={`transition-colors ${key.status === 'REVOKED' ? 'bg-slate-50 dark:bg-slate-900/50 grayscale-[20%]' : 'hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900/80'}`}>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-[13px]">{key.key_hint || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wide border ${
                          key.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-200 dark:border-rose-900/50'
                        }`}>
                        {key.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {key.status === 'ACTIVE' ? 'AKTIF' : 'DICABUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[13px]">
                      {new Date(key.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[13px]">
                      {key.last_used_at ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(key.last_used_at).toLocaleString('id-ID')}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Belum pernah</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="inline-flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold text-xs bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Cabut Akses
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Permanen
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
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-400"
            >
              <Trash2 className="w-5 h-5 hidden" />
              Tutup
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Daftarkan Aplikasi Baru</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Berikan nama untuk aplikasi web yang akan diintegrasikan dengan ADMS QRIS.
            </p>
            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Nama Aplikasi</label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-600 font-semibold"
                  placeholder="Misal: Web Hosting Utama"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Buat Kunci API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {createdKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-emerald-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">Aplikasi Berhasil Didaftarkan!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Simpan semua informasi di bawah ini. <strong className="text-rose-500">Hanya ditampilkan sekali.</strong>
              </p>
            </div>

            {/* API Key */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">API Key (untuk integrasi sistem)</p>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all font-bold">{createdKey}</code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex-shrink-0"
                  title="Salin API Key"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Portal Credentials */}
            {createdPortal && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Akun Portal (untuk login ke ADMS)</p>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Email:</span>{' '}
                        <code className="font-mono text-indigo-700 dark:text-indigo-300">{createdPortal.email}</code>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Password:</span>{' '}
                        <code className="font-mono text-indigo-700 dark:text-indigo-300">{createdPortal.password}</code>
                      </div>
                    </div>
                    <button
                      onClick={copyPortalCreds}
                      className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors flex-shrink-0"
                      title="Salin kredensial portal"
                    >
                      {copiedPortal ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">
                    Berikan kredensial ini ke tim IT sistem terkait untuk akses portal pencatatan transaksi mereka.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                API Key dan password portal tidak dapat dilihat kembali setelah modal ini ditutup. Jika hilang, hapus aplikasi ini dan buat ulang.
              </p>
            </div>

            <button
              onClick={closeSuccessModal}
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-md"
            >
              Sudah disimpan, tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
