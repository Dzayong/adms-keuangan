import React, { useEffect, useState } from 'react';
import { ServerCrash, Power, PowerOff } from 'lucide-react';
import { apiFetch } from '../services/api.js';

interface Provider {
  id: number;
  name: string;
  code: string;
  environment: string;
  is_active: number;
}

export const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await apiFetch('/providers');
      if (!res.success) throw new Error(res.message || 'Failed to fetch providers');
      setProviders(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleToggleStatus = async (providerId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    if (!window.confirm(newStatus ? 'Aktifkan provider ini?' : 'Nonaktifkan provider ini?')) return;

    try {
      const res = await apiFetch(`/providers/${providerId}/active`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: newStatus })
      });
      if (!res.success) throw new Error(res.message || 'Gagal mengubah status provider');
      fetchProviders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat data provider...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ServerCrash className="w-6 h-6 text-indigo-600" />
            Penyedia Layanan QRIS
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Aktifkan atau matikan koneksi ke penyedia pembayaran (Payment Gateway). Hanya provider yang aktif yang dapat menerima transaksi.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          let description = "";
          if (p.code === 'mock') description = "Digunakan untuk pengujian sistem (Simulator). Tidak melibatkan uang sungguhan.";
          else if (p.code === 'dana') description = "Integrasi resmi DANA Bisnis. Memerlukan Client ID & Secret yang valid di menu Pengaturan.";
          else if (p.code === 'internal_qris') description = "Pembuatan QRIS statis internal tanpa melalui gateway eksternal.";
          else description = "Integrasi penyedia layanan QRIS eksternal.";

          return (
          <div key={p.id} className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {p.code}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                  p.environment === 'SANDBOX' 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  {p.environment === 'SANDBOX' ? 'Uji Coba' : 'Produksi'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">{description}</p>
              
              <div className="flex items-center gap-2 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm text-slate-600 font-medium">Status Integrasi:</span>
                {p.is_active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100/50 border border-emerald-200 px-2.5 py-1 rounded-md">
                    <Power className="w-3.5 h-3.5" /> AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                    <PowerOff className="w-3.5 h-3.5" /> NONAKTIF
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggleStatus(p.id, p.is_active)}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                p.is_active 
                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {p.is_active ? 'Matikan Integrasi' : 'Aktifkan Integrasi'}
            </button>
          </div>
        )})}
        {providers.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            Belum ada provider yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
};
