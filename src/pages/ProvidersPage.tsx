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
            <ServerCrash className="w-6 h-6 text-yellow-500" />
            Payment Providers
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola integrasi payment gateway dan provider QRIS.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{p.code}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded border ${
                  p.environment === 'SANDBOX' 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  {p.environment}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-slate-600 font-medium">Status Koneksi:</span>
                {p.is_active ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <Power className="w-3.5 h-3.5" /> LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                    <PowerOff className="w-3.5 h-3.5" /> OFFLINE
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleToggleStatus(p.id, p.is_active)}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                p.is_active 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {p.is_active ? 'Matikan Integrasi' : 'Aktifkan Integrasi'}
            </button>
          </div>
        ))}
        {providers.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            Belum ada provider yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
};
