import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Upload, AlertCircle, Clock, RefreshCw, QrCode } from 'lucide-react';

interface PublicPaymentData {
  invoiceNumber: string;
  customerName: string;
  amount: number;
  description: string;
  status: string;
  expiredAt: string;
  paymentMethod: string;
  providerCode: string;
  qrContent: string | null;
  hasProof: boolean;
  paymentId: number;
}

export function PublicPaymentPage() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const [data, setData] = useState<PublicPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/public/pay/${invoiceNumber}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.hasProof) setUploadDone(true);
      } else {
        setError(json.message || 'Tagihan tidak ditemukan.');
      }
    } catch {
      setError('Gagal memuat data tagihan.');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [invoiceNumber]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError('');

    const form = new FormData();
    form.append('proof', file);

    try {
      const res = await fetch(`/api/public/pay/${invoiceNumber}/proof`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        setUploadDone(true);
        fetchData();
      } else {
        setUploadError(json.message || 'Gagal mengunggah bukti.');
      }
    } catch {
      setUploadError('Terjadi kesalahan jaringan.');
    }
    setIsUploading(false);
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
      .format(amount).replace('IDR', 'Rp').trim();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Tagihan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const isExpired = data.status === 'EXPIRED' || data.status === 'CANCELLED';
  const isPaid = data.status === 'PAID';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wide uppercase">Pembayaran QRIS</span>
          </div>
          <div className="text-2xl font-black">{formatRupiah(data.amount)}</div>
          <div className="text-indigo-200 text-xs mt-0.5">{data.invoiceNumber}</div>
        </div>

        <div className="p-6 space-y-5">
          {/* Info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Atas Nama</span>
              <span className="font-bold text-slate-800">{data.customerName}</span>
            </div>
            {data.description && (
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan</span>
                <span className="text-slate-700 text-right max-w-[60%]">{data.description}</span>
              </div>
            )}
          </div>

          {/* QR Code tampilkan jika internal_qris */}
          {data.providerCode === 'internal_qris' && data.qrContent && !isPaid && !isExpired && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scan QR untuk Membayar</p>
              <div className="border-4 border-indigo-600 rounded-xl p-2">
                <img src={data.qrContent} alt="QRIS" className="w-52 h-52 object-contain" />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Buka aplikasi m-banking atau e-wallet, pilih Scan QR / QRIS
              </p>
            </div>
          )}

          {/* Status */}
          {isPaid && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <div className="font-bold text-green-800">Pembayaran Lunas</div>
                <div className="text-xs text-green-600">Terima kasih, transaksi Anda sudah dikonfirmasi.</div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="flex items-center gap-3 p-4 bg-slate-100 border border-slate-200 rounded-xl">
              <Clock className="w-8 h-8 text-slate-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-700">Tagihan Kedaluwarsa</div>
                <div className="text-xs text-slate-500">Tagihan ini sudah tidak aktif. Hubungi kasir/admin.</div>
              </div>
            </div>
          )}

          {/* Upload bukti bayar */}
          {!isPaid && !isExpired && (
            <div className="space-y-3">
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-700 mb-1">Sudah Bayar? Upload Bukti Transfer</p>
                <p className="text-xs text-slate-400 mb-3">
                  Upload screenshot bukti pembayaran agar admin dapat memverifikasi lebih cepat.
                </p>

                {uploadDone ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    Bukti bayar berhasil dikirim. Menunggu konfirmasi admin.
                  </div>
                ) : (
                  <>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors"
                    >
                      {preview ? (
                        <img src={preview} alt="preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <p className="text-xs text-slate-500">Klik untuk pilih foto bukti bayar</p>
                          <p className="text-[10px] text-slate-400">JPG, PNG, WEBP — maks 5MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploadError && (
                      <p className="text-xs text-red-600 font-medium">{uploadError}</p>
                    )}

                    {file && (
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        {isUploading ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Mengunggah...</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Kirim Bukti Bayar</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 text-center text-[10px] text-slate-400">
          Powered by ADMS QRIS Internal System
        </div>
      </div>
    </div>
  );
}
