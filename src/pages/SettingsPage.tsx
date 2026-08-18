import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';
import {
  Settings as SettingsIcon,
  Building,
  CreditCard,
  ShieldAlert,
  Save,
  CheckCircle2,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [companyName, setCompanyName] = useState('PT ADMS Solusi Digital');
  const [companyEmail, setCompanyEmail] = useState('contact@admsqris.local');
  const [companyPhone, setCompanyPhone] = useState('021-555-0199');
  const [currency, setCurrency] = useState('IDR');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [mockExpiry, setMockExpiry] = useState('15');

  // DANA Credentials
  const [danaClientId, setDanaClientId] = useState('');
  const [danaClientSecret, setDanaClientSecret] = useState('');
  const [danaEnv, setDanaEnv] = useState('sandbox');

  // Provider Flags
  const [mockActive, setMockActive] = useState(true);
  const [danaActive, setDanaActive] = useState(false);

  // Internal Merchant Config
  const [internalMerchantName, setInternalMerchantName] = useState('');
  const [internalMerchantNmid, setInternalMerchantNmid] = useState('');
  const [internalMerchantActive, setInternalMerchantActive] = useState(false);
  const [internalMerchantImagePath, setInternalMerchantImagePath] = useState('');
  const [internalMerchantImageBase64, setInternalMerchantImageBase64] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    const res = await apiFetch('/settings');
    if (res.success && res.data) {
      const s = res.data.settings || {};
      setCompanyName(s.company_name || 'PT ADMS Solusi Digital');
      setCompanyEmail(s.company_email || 'contact@admsqris.local');
      setCompanyPhone(s.company_phone || '021-555-0199');
      setCurrency(s.currency || 'IDR');
      setTimezone(s.timezone || 'Asia/Jakarta');
      setMockExpiry(s.mock_expiry_minutes || '15');

      setDanaClientId(s.dana_client_id || '');
      setDanaClientSecret(s.dana_client_secret || '');
      setDanaEnv(s.dana_environment || 'sandbox');

      const providers = res.data.providers || [];
      const mockP = providers.find((p: any) => p.code === 'mock');
      const danaP = providers.find((p: any) => p.code === 'dana');

      if (mockP) setMockActive(Boolean(mockP.is_active));
      if (danaP) setDanaActive(Boolean(danaP.is_active));
    }

    const resInternal = await apiFetch('/v1/internal-merchants');
    if (resInternal.success && resInternal.data) {
      setInternalMerchantName(resInternal.data.name || '');
      setInternalMerchantNmid(resInternal.data.nmid || '');
      setInternalMerchantActive(Boolean(resInternal.data.is_active));
      setInternalMerchantImagePath(resInternal.data.qris_image_path || '');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Akses ditolak. Operator tidak diizinkan merubah pengaturan.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    setError('');

    const res = await apiFetch('/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: {
          company_name: companyName,
          company_email: companyEmail,
          company_phone: companyPhone,
          currency,
          timezone,
          mock_expiry_minutes: mockExpiry,
          dana_client_id: danaClientId,
          dana_client_secret: danaClientSecret,
          dana_environment: danaEnv,
        },
        providerStatus: {
          mock: mockActive,
          dana: danaActive,
        },
      }),
    });

    const resInternal = await apiFetch('/v1/internal-merchants', {
      method: 'PUT',
      body: JSON.stringify({
        name: internalMerchantName,
        nmid: internalMerchantNmid,
        isActive: internalMerchantActive,
        qrisImageBase64: internalMerchantImageBase64
      })
    });

    setIsSaving(false);

    if (res.success && resInternal.success) {
      setMessage('Pengaturan berhasil diperbarui!');
      setInternalMerchantImageBase64(''); // Clear base64 buffer after save
      fetchSettings();
    } else {
      const errorMsg = (!res.success ? res.message : null) 
                    || (!resInternal.success ? resInternal.message : null) 
                    || 'Gagal menyimpan pengaturan.';
      setError(errorMsg);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Format file tidak didukung. Harap unggah PNG, JPEG, atau WebP.');
        return;
      }

      if (file.size > 1024 * 1024) {
        setError('Ukuran file maksimal 1MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setInternalMerchantImageBase64(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat pengaturan sistem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Pengaturan Sistem & Gateway Pembayaran</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola profil perusahaan, pengaturan batas waktu QRIS, serta kunci rahasia integrasi DANA.
          </p>
        </div>

        {!isAdmin && (
          <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-indigo-900 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-700" />
            <span>Mode Operator (Hanya-Baca)</span>
          </div>
        )}
      </Card>

      {message && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company Info Section */}
        <Card className="p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3>Profil Perusahaan</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Perusahaan / Entitas</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Kontak</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nomor Telepon Kantor</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mata Uang & Zona Waktu</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled
                  value={currency}
                  className="w-1/3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 text-center"
                />
                <input
                  type="text"
                  disabled
                  value={timezone}
                  className="w-2/3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Providers Configuration */}
        <Card className="p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h3>Konfigurasi Provider Pembayaran</h3>
          </div>

          {/* Mock QRIS Provider Settings */}
          <div className={`p-5 rounded-xl border ${mockActive ? 'bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-900/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'} space-y-4 transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Simulator QRIS Mock (Uji Coba Internal)</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sistem buatan untuk mensimulasikan proses pembayaran QRIS tanpa uang sungguhan. Sangat cocok untuk *testing*.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={mockActive}
                  onChange={(e) => setMockActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-950 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Batas Kedaluwarsa QRIS (Menit)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={mockExpiry}
                  onChange={(e) => setMockExpiry(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Mode Lingkungan Server</label>
                <input
                  type="text"
                  disabled
                  value="SANDBOX SIMULATOR"
                  className="w-full bg-indigo-100/70 dark:bg-indigo-900/30 border border-yellow-300 dark:border-yellow-600/50 text-yellow-900 dark:text-yellow-500 rounded-lg px-3 py-2 text-sm font-mono font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* DANA QRIS Skeleton Settings */}
          <div className={`p-5 rounded-xl border ${danaActive ? 'bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-900/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'} space-y-4 transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Integrasi DANA Bisnis (Resmi)</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Jalur koneksi ke server DANA. Masukkan Client ID & Secret yang Anda dapatkan dari Dasbor DANA Bisnis Anda.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={danaActive}
                  onChange={(e) => setDanaActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-950 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">DANA Client ID</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={danaClientId}
                  onChange={(e) => setDanaClientId(e.target.value)}
                  placeholder="Belum dikonfigurasi"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 disabled:opacity-60 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">DANA Client Secret (Rahasia)</label>
                <input
                  type="password"
                  disabled={!isAdmin}
                  value={danaClientSecret}
                  onChange={(e) => setDanaClientSecret(e.target.value)}
                  placeholder="Belum dikonfigurasi"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 dark:text-slate-200 disabled:opacity-60 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Lingkungan API (API Environment)</label>
                <select
                  disabled={!isAdmin}
                  value={danaEnv}
                  onChange={(e) => setDanaEnv(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                >
                  <option value="sandbox">SANDBOX (UJI COBA)</option>
                  <option value="production">PRODUCTION (ASLI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat Webhook (Otomatis)</label>
                <input
                  type="text"
                  disabled
                  value="/api/webhooks/dana"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">Didaftarkan di dasbor DANA</p>
              </div>
            </div>
          </div>

          </div>

          {/* Internal QRIS Settings */}
          <div className={`p-5 rounded-xl border ${internalMerchantActive ? 'bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-900/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'} space-y-4 transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">QRIS Statis Kantor (Manual)</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Jika Anda memiliki gambar fisik QRIS dari Bank, unggah di sini agar tampil di sistem Kasir saat metode QRIS Internal dipilih.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={internalMerchantActive}
                  onChange={(e) => setInternalMerchantActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-950 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Toko (Merchant)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={internalMerchantName}
                  onChange={(e) => setInternalMerchantName(e.target.value)}
                  placeholder="Misal: Toko Berkah"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nomor NMID (National Merchant ID)</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={internalMerchantNmid}
                  onChange={(e) => setInternalMerchantNmid(e.target.value)}
                  placeholder="ID102xxxxxxx"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Gambar QRIS (Max 1MB, format PNG/JPG)</label>
                
                <div className="flex items-start gap-4">
                  {(internalMerchantImagePath || internalMerchantImageBase64) ? (
                    <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2">
                      <img 
                        src={internalMerchantImageBase64 || internalMerchantImagePath} 
                        alt="QRIS Preview" 
                        className={`w-28 h-28 object-contain rounded-md ${internalMerchantImageBase64 ? 'border border-yellow-400' : ''}`} 
                      />
                      {internalMerchantImageBase64 && (
                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow">
                          Pratinjau
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="w-28 h-28 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs text-center p-2">
                      Belum ada QRIS
                    </div>
                  )}
                  
                  <div className="flex-1 mt-2">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      disabled={!isAdmin}
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-slate-500 dark:text-slate-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-bold
                        file:bg-indigo-50 dark:file:bg-indigo-950/30 file:text-indigo-700 dark:file:text-indigo-400
                        hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">File akan langsung diubah bentuk formatnya sebelum disimpan ke server.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {isAdmin && (
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              isLoading={isSaving}
              size="lg"
            >
              <Save className="w-4 h-4 mr-2" />
              <span>Simpan Pengaturan</span>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
