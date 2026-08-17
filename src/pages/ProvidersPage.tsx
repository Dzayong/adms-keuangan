import React, { useEffect, useState } from 'react';
import { ServerCrash, Power, PowerOff } from 'lucide-react';
import { apiFetch } from '../services/api.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';

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
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat data provider...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
            <ServerCrash className="w-6 h-6 text-indigo-600" />
            Penyedia Layanan QRIS
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aktifkan atau matikan koneksi ke penyedia pembayaran (Payment Gateway). Hanya provider yang aktif yang dapat menerima transaksi.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200 dark:border-rose-900/50">
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
          <div key={p.id} className="h-full">
            <Card className="p-6 shadow-xs flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{p.name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">ID: {p.code}</p>
                  </div>
                  <Badge variant={p.environment === 'SANDBOX' ? 'warning' : 'primary'}>
                    {p.environment === 'SANDBOX' ? 'Uji Coba' : 'Produksi'}
                  </Badge>
                </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{description}</p>
                            <div className="flex items-center gap-2 mb-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Status Integrasi:</span>
                  {p.is_active ? (
                    <Badge variant="success" className="gap-1.5">
                      <Power className="w-3.5 h-3.5" /> AKTIF
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="gap-1.5">
                      <PowerOff className="w-3.5 h-3.5" /> NONAKTIF
                    </Badge>
                  )}
                </div>
            </div>
              <Button
                onClick={() => handleToggleStatus(p.id, p.is_active)}
                variant={p.is_active ? 'outline' : 'success'}
                className="w-full"
              >
                {p.is_active ? 'Matikan Integrasi' : 'Aktifkan Integrasi'}
              </Button>
            </Card>
          </div>
        )})}
        {providers.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            Belum ada provider yang terdaftar.
          </div>
        )}
      </div>
    </div>
  );
};
