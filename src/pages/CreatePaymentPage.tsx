import React, { useState } from 'react';
import { apiFetch } from '../services/api.js';
import { QrCode, User, Phone, DollarSign, FileText, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  onPaymentCreated: (paymentId: number) => void;
  onCancel: () => void;
}

export const CreatePaymentPage: React.FC<Props> = ({ onPaymentCreated, onCancel }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [providerCode, setProviderCode] = useState('mock');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

    if (!customerName.trim()) {
      setError('Nama Customer wajib diisi.');
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Nominal pembayaran harus berupa angka valid lebih dari Rp 0.');
      return;
    }

    setIsSubmitting(true);

    const res = await apiFetch('/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        amount: numericAmount,
        description: description.trim(),
        providerCode,
      }),
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      onPaymentCreated(res.data.transactionId);
    } else {
      setError(res.message || 'Gagal membuat pembayaran QRIS.');
    }
  };

  const formatDisplayAmount = (raw: string) => {
    const num = parseFloat(raw.replace(/[^0-9]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(num)
      .replace('IDR', 'Rp')
      .trim();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Buat Pembayaran Manual (POS)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan halaman ini untuk membuat kode QRIS bagi pelanggan yang datang langsung (offline).
            </p>
          </div>
        </div>

        <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-start gap-2 shadow-xs">
          <div className="mt-0.5 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold shrink-0 text-[10px]">i</div>
          <div>
            <strong className="font-bold">Perhatian:</strong> Tagihan dari layanan Hosting/Aplikasi Web akan terbuat secara otomatis oleh sistem, Anda tidak perlu membuatnya di halaman ini.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nama Pelanggan / Divisi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                placeholder="Contoh: Budi Santoso atau Divisi Keuangan"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nomor Telepon (Opsional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Penyedia QRIS (Provider) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition-all appearance-none"
              >
                <option value="mock">Mock QRIS (Sandbox)</option>
                <option value="internal_qris">Internal Office QRIS (Static)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-800">
                Rp
              </span>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                required
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-base font-bold font-mono text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
            {amount && (
              <p className="text-[11px] font-mono font-bold text-emerald-600 mt-1 pl-1">
                Terbaca: {formatDisplayAmount(amount)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Deskripsi / Catatan Transaksi (Opsional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Keterangan tambahan untuk referensi internal..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors border border-slate-200"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Membuat QR...</span>
              ) : (
                <>
                  <span>Buat Kode QRIS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
