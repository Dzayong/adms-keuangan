import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Upload, AlertCircle, Clock, RefreshCw, QrCode, FileText } from 'lucide-react';

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

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-slate-400 dark:text-slate-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat rincian tagihan...</p>
        </div>
      </div>
    );
  }

  // Error / Empty State
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-sm w-full max-w-sm flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-rose-100/50 dark:bg-rose-950/30 p-3 rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Tagihan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const isExpired = data.status === 'EXPIRED' || data.status === 'CANCELLED';
  const isPaid = data.status === 'PAID';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 py-10 font-sans">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-sm max-w-md w-full overflow-hidden">
        
        {/* Header (shadcn CardHeader style) */}
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-slate-900 dark:bg-slate-800 p-2 rounded-lg text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">Pembayaran QRIS</h3>
          </div>
          <p className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white mt-2">
            {formatRupiah(data.amount)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">{data.invoiceNumber}</p>
        </div>

        {/* Content (shadcn CardContent style) */}
        <div className="p-6 space-y-6">
          
          {/* Detail Pelanggan */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500 dark:text-slate-400">Atas Nama</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{data.customerName}</span>
            </div>
            {data.description && (
              <div className="flex justify-between items-start gap-4">
                <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">Keterangan</span>
                <span className="text-slate-700 dark:text-slate-300 text-right">{data.description}</span>
              </div>
            )}
          </div>

          {/* Area QR Code */}
          {data.providerCode === 'internal_qris' && data.qrContent && !isPaid && !isExpired && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Scan QR Untuk Membayar
              </p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                <img src={data.qrContent} alt="QRIS" className="w-48 h-48 object-contain mix-blend-multiply" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[250px]">
                Buka aplikasi m-banking atau e-wallet Anda, lalu scan QR code di atas.
              </p>
            </div>
          )}

          {/* Status Alert (shadcn Alert style) */}
          {isPaid && (
            <div className="relative w-full rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-emerald-900 dark:text-emerald-100 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-0.5" />
              <div className="flex flex-col">
                <h5 className="mb-1 font-medium leading-none tracking-tight">Pembayaran Lunas</h5>
                <div className="text-sm text-emerald-700 dark:text-emerald-400">
                  Terima kasih, transaksi Anda telah diverifikasi.
                </div>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="relative w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-slate-900 dark:text-slate-100 flex items-start gap-3">
              <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="flex flex-col">
                <h5 className="mb-1 font-medium leading-none tracking-tight">Tagihan Kedaluwarsa</h5>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Waktu pembayaran telah habis. Silakan hubungi admin.
                </div>
              </div>
            </div>
          )}

          {/* Form Upload Bukti */}
          {!isPaid && !isExpired && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100 mb-1">
                  Upload Bukti Transfer
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lampirkan screenshot bukti transfer agar admin dapat segera memproses.
                </p>
              </div>

              {uploadDone ? (
                <div className="relative w-full rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/30 p-4 text-blue-900 dark:text-blue-100 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                  <div className="flex flex-col">
                    <h5 className="mb-1 font-medium leading-none tracking-tight">Bukti Terkirim</h5>
                    <div className="text-sm text-blue-700 dark:text-blue-400">
                      Menunggu verifikasi admin.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-32 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer"
                  >
                    {preview ? (
                      <div className="h-full w-full p-2 flex items-center justify-center">
                        <img src={preview} alt="preview" className="max-h-full rounded-md object-contain shadow-sm bg-white dark:bg-slate-900" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2">
                        <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm font-medium">Klik untuk pilih gambar</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">JPG, PNG maks 5MB</span>
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
                    <p className="text-sm font-medium text-rose-500">{uploadError}</p>
                  )}

                  {file && (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="inline-flex w-full items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 shadow h-9 px-4 py-2"
                    >
                      {isUploading ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Mengunggah...</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Kirim Bukti</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <FileText className="w-3 h-3" />
            Powered by ADMS QRIS Internal System
          </p>
        </div>
      </div>
    </div>
  );
}
