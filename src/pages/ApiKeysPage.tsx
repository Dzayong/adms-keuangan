import React, { useState, useEffect, useMemo } from 'react';
import { Key, Plus, Trash2, Copy, AlertTriangle, CheckCircle, Clock, Search, Filter, Ban, Download } from 'lucide-react';
import { apiFetch } from '../services/api';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/common/Modal.js';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    fetchWebhookConfig();
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      const res = await apiFetch('/users/me');
      if (res.success && res.data) {
        setWebhookUrl(res.data.webhook_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch user data for webhook', error);
    }
  };

  const handleSaveWebhook = async () => {
    setIsSavingWebhook(true);
    try {
      const res = await apiFetch('/users/me/webhook', {
        method: 'PUT',
        body: JSON.stringify({ webhook_url: webhookUrl })
      });
      if (res.success) {
        alert('URL Webhook berhasil disimpan!');
      } else {
        alert(res.message || 'Gagal menyimpan URL Webhook');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan URL Webhook');
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return alert('Silakan masukkan URL Webhook terlebih dahulu.');
    setIsTestingWebhook(true);
    try {
      const res = await apiFetch('/users/me/test-webhook', {
        method: 'POST',
        body: JSON.stringify({ webhook_url: webhookUrl })
      });
      if (res.success) {
        alert('Ping tes webhook berhasil dikirim! Silakan periksa server Anda.');
      } else {
        alert(res.message || 'Gagal mengirim tes webhook');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mencoba mengirim tes webhook');
    } finally {
      setIsTestingWebhook(false);
    }
  };

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

  const closeSuccessModal = () => {
    setCreatedKey(null);
    setIsCreateModalOpen(false);
  };

  const downloadEnvFile = () => {
    if (!createdKey) return;
    const content = [
      `# ADMS QRIS — API Credentials`,
      `# Generated: ${new Date().toLocaleString('id-ID')}`,
      `# App: ${newAppName || 'Aplikasi Baru'}`,
      ``,
      `ADMS_URL=${window.location.origin}`,
      `ADMS_API_KEY=${createdKey}`,
      `ADMS_WEBHOOK_SECRET=`,
      ``,
      `# Cara penggunaan:`,
      `# Header wajib: x-api-key: <ADMS_API_KEY>`,
      `# Header wajib: X-Idempotency-Key: <unique-string-per-request>`,
      ``,
      `# Portal monitoring (baca saja):`,
      `# URL   : ${window.location.origin}`,
      `# Email : it@adms.gateway`,
      `# Pass  : adms123!`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = '.env.adms';
    a.click();
    URL.revokeObjectURL(url);
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
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Daftarkan Aplikasi Baru
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Konfigurasi Webhook Global</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          URL ini akan dipanggil setiap kali ada transaksi yang statusnya berubah menjadi <strong>PAID</strong>, jika parameter <code>callback_url</code> tidak dikirim saat pembuatan transaksi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">URL Webhook</label>
            <input
              type="url"
              placeholder="https://api.domain-anda.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-600 font-medium bg-white dark:bg-slate-950"
            />
          </div>
          <Button onClick={handleSaveWebhook} disabled={isSavingWebhook} className="whitespace-nowrap">
            {isSavingWebhook ? 'Menyimpan...' : 'Simpan URL'}
          </Button>
          <Button onClick={handleTestWebhook} disabled={isTestingWebhook || !webhookUrl} variant="outline" className="whitespace-nowrap">
            {isTestingWebhook ? 'Mengirim...' : 'Tes Webhook'}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden w-full shadow-xs">
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
                      <Badge variant={key.status === 'ACTIVE' ? 'success' : 'danger'} className="gap-1.5">
                        {key.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                        {key.status === 'ACTIVE' ? 'AKTIF' : 'DICABUT'}
                      </Badge>
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
                        <Button
                          onClick={() => handleRevoke(key.id)}
                          variant="danger"
                          size="sm"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1.5" />
                          Cabut Akses
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDelete(key.id)}
                          variant="outline"
                          size="sm"
                          className="hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Hapus Permanen
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen && !createdKey}
        onClose={() => setIsCreateModalOpen(false)}
        title="Daftarkan Aplikasi Baru"
        maxWidth="md"
      >
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
              className="w-full border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-600 font-semibold bg-white dark:bg-slate-900"
              placeholder="Misal: Web Hosting Utama"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
            >
              Buat Kunci API
            </Button>
          </div>
        </form>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={createdKey !== null}
        onClose={closeSuccessModal}
        title="Kunci API Berhasil Dibuat!"
        maxWidth="lg"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Silakan salin Kunci API rahasia berikut. <strong className="text-rose-500">Kunci ini hanya ditampilkan sekali.</strong> Simpan di tempat yang aman (misalnya di <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.env</code> pada web hosting Anda).
        </p>
        
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4 mb-4">
          <code className="text-sm font-mono text-slate-800 dark:text-slate-200 break-all select-all font-bold">{createdKey}</code>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            title="Salin Kunci"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          </Button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-6">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Untuk akses portal monitoring:</p>
          <p>Email: <code className="font-mono text-indigo-600 dark:text-indigo-400">it@adms.gateway</code></p>
          <p>Password: <code className="font-mono text-indigo-600 dark:text-indigo-400">adms123!</code></p>
          <p className="text-[11px] text-slate-400 mt-1">Login ke ADMS dengan akun IT untuk melihat semua transaksi & dokumentasi API.</p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            Jika Anda kehilangan kunci ini, Anda tidak dapat melihatnya lagi. Anda harus mencabut (revoke) akses aplikasi ini dan membuat ulang kunci yang baru.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={downloadEnvFile}
            variant="outline"
            className="flex-1 py-3 text-sm gap-2"
          >
            <Download className="w-4 h-4" />
            Download .env
          </Button>
          <Button
            onClick={closeSuccessModal}
            className="flex-1 py-3 text-sm"
          >
            Saya sudah menyimpannya
          </Button>
        </div>
      </Modal>
    </div>
  );
};
