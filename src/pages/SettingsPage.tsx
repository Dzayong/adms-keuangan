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
      setError(res.message || resInternal.message || 'Gagal menyimpan pengaturan.');
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
        <p className="text-sm font-semibold text-slate-500">Memuat pengaturan sistem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">System & Payment Gateway Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization identity, QR expiration timeouts, and sandbox/production provider parameters.
          </p>
        </div>

        {!isAdmin && (
          <div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-yellow-600" />
            <span>Operator Mode (Read-Only)</span>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company Info Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <Building className="w-4 h-4 text-yellow-500" />
            <h3>Organization Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company / Entity Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-yellow-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contact Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-yellow-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Corporate Phone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-yellow-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Currency & Timezone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled
                  value={currency}
                  className="w-1/3 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-600 text-center"
                />
                <input
                  type="text"
                  disabled
                  value={timezone}
                  className="w-2/3 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Providers Configuration */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
            <CreditCard className="w-4 h-4 text-yellow-500" />
            <h3>Payment Gateway Providers</h3>
          </div>

          {/* Mock QRIS Provider Settings */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900">Mock QRIS Sandbox Engine (Development / Internal)</span>
                <p className="text-[11px] text-slate-500">
                  Used for generating mock QR pay payloads and testing automated status transitions.
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
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">QR Expiration Time (Minutes)</label>
                <input
                  type="number"
                  disabled={!isAdmin}
                  value={mockExpiry}
                  onChange={(e) => setMockExpiry(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Environment Mode</label>
                <input
                  type="text"
                  disabled
                  value="SANDBOX SIMULATOR"
                  className="w-full bg-yellow-100/70 border border-yellow-300 text-yellow-900 rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* DANA QRIS Skeleton Settings */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900">DANA QRIS Production Connector (PJP)</span>
                <p className="text-[11px] text-slate-500">
                  Official Merchant API connector ready for production keys.
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
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">DANA Client ID</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={danaClientId}
                  onChange={(e) => setDanaClientId(e.target.value)}
                  placeholder="Not configured"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">DANA Client Secret</label>
                <input
                  type="password"
                  disabled={!isAdmin}
                  value={danaClientSecret}
                  onChange={(e) => setDanaClientSecret(e.target.value)}
                  placeholder="Not configured"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">API Environment</label>
                <select
                  disabled={!isAdmin}
                  value={danaEnv}
                  onChange={(e) => setDanaEnv(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  <option value="sandbox">SANDBOX</option>
                  <option value="production">PRODUCTION</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Webhook Callback Path</label>
                <input
                  type="text"
                  disabled
                  value="/api/webhooks/dana"
                  className="w-full bg-slate-200/80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Internal QRIS Settings */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900">Internal Office QRIS (Static Configuration)</span>
                <p className="text-[11px] text-slate-500">
                  Used by internal applications to display the static office QR.
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
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Merchant Name</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={internalMerchantName}
                  onChange={(e) => setInternalMerchantName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">NMID</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={internalMerchantNmid}
                  onChange={(e) => setInternalMerchantNmid(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">QRIS Image (PNG/JPEG/WebP, Max 1MB)</label>
                {internalMerchantImagePath && !internalMerchantImageBase64 && (
                  <div className="mb-2">
                    <img src={internalMerchantImagePath} alt="QRIS" className="w-24 h-24 object-contain rounded border border-slate-200" />
                  </div>
                )}
                {internalMerchantImageBase64 && (
                  <div className="mb-2">
                    <img src={internalMerchantImageBase64} alt="QRIS Preview" className="w-24 h-24 object-contain rounded border border-yellow-400" />
                    <span className="text-[10px] text-yellow-600 font-bold ml-2">Preview (Unsaved)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  disabled={!isAdmin}
                  onChange={handleImageUpload}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
