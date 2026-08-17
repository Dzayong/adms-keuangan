import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { apiFetch } from '../services/api.js';
import { Transaction, PaymentLog } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  QrCode,
  Clock,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Play,
  ArrowLeft,
  Copy,
  Check,
  ShieldAlert,
  Send,
  Share2,
  ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface Props {
  transactionId: number;
  onBack: () => void;
}

export const PaymentDetailPage: React.FC<Props> = ({ transactionId, onBack }) => {
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchPaymentData = async () => {
    const res = await apiFetch(`/payments/${transactionId}`);
    if (res.success && res.data?.transaction) {
      const transaction: Transaction = res.data.transaction;
      setTx(transaction);
      setLogs(res.data.logs || []);

      // Calculate expiry countdown by appending Z because DB stores it in UTC
      if (transaction.expired_at) {
        const expiredTime = new Date(transaction.expired_at.replace(' ', 'T') + 'Z').getTime();
        const nowTime = new Date().getTime();
        const diffSeconds = Math.max(0, Math.floor((expiredTime - nowTime) / 1000));
        setTimeRemaining(diffSeconds);
      }
    }
    setIsLoading(false);
  };

  // Initial fetch and 3-second auto-polling loop while PENDING
  useEffect(() => {
    fetchPaymentData();

    const interval = setInterval(() => {
      if (tx?.status === 'PENDING') {
        fetchPaymentData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [transactionId, tx?.status]);

  // Countdown timer ticker
  useEffect(() => {
    if (timeRemaining <= 0 || tx?.status !== 'PENDING') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          fetchPaymentData();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, tx?.status]);

  // Render QR Code onto canvas
  useEffect(() => {
    const isStaticQris = tx?.provider_reference?.startsWith('INTERNAL-') || tx?.payment_method === 'STATIC_QRIS';
    if (!isStaticQris && tx?.qr_content && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, tx.qr_content, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch((err) => console.error('Error rendering QR:', err));
    }
  }, [tx]);

  // Handle Mock Simulation
  const handleSimulate = async (targetStatus: 'PAID' | 'FAILED' | 'EXPIRED') => {
    setIsSimulating(true);
    setSimMessage('');

    const res = await apiFetch(`/payments/${transactionId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus }),
    });

    setIsSimulating(false);

    if (res.success) {
      setSimMessage(res.message || `Simulasi ${targetStatus} berhasil!`);
      fetchPaymentData();
    } else {
      setSimMessage(res.message || 'Simulasi gagal.');
    }
  };

  // Handle Simulated Webhook Callback Request
  const handleSimulateWebhook = async () => {
    if (!tx?.provider_reference) return;
    setIsSimulating(true);

    const res = await apiFetch('/webhooks/mock', {
      method: 'POST',
      body: JSON.stringify({
        reference: tx.provider_reference,
        status: 'PAID',
        paid_at: new Date().toISOString(),
      }),
    });

    setIsSimulating(false);

    if (res.success) {
      setSimMessage('Simulasi Webhook berhasil diproses!');
      fetchPaymentData();
    } else {
      setSimMessage('Gagal mengirimkan simulated webhook.');
    }
  };

  // Handle Manual Verification
  const handleManualVerify = async () => {
    if (!window.confirm('Pastikan transaksi benar-benar terlihat pada sistem merchant/bank QRIS sebelum mengonfirmasi. Lanjutkan verifikasi pembayaran ini?')) {
      return;
    }

    setIsSimulating(true);
    setSimMessage('');

    const res = await apiFetch(`/payments/${transactionId}/verify`, {
      method: 'POST',
    });

    setIsSimulating(false);

    if (res.success) {
      setSimMessage('Pembayaran berhasil diverifikasi secara manual!');
      fetchPaymentData();
    } else {
      setSimMessage(res.message || 'Gagal memverifikasi pembayaran.');
    }
  };

  const copyQrText = () => {
    if (tx?.qr_content) {
      navigator.clipboard.writeText(tx.qr_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPaymentLink = () => {
    const link = `${window.location.origin}/pay/${tx?.invoice_number}`;
    navigator.clipboard.writeText(link);
    setSimMessage(`Link pembayaran disalin: ${link}`);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(amount || 0)
      .replace('IDR', 'Rp')
      .trim();
  };

  if (isLoading || !tx) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Memuat tampilan QR Pembayaran...</p>
      </div>
    );
  }

  // eslint-disable-next-line no-console
  console.log('[INTERNAL QR DEBUG]', {
    providerReference: tx.provider_reference,
    paymentMethod: tx.payment_method,
    qrContent: tx.qr_content,
    qrContentType: typeof tx.qr_content
  });

  const resolvedQrUrl = tx.qr_content?.startsWith('/')
    ? `http://localhost:3010${tx.qr_content}`
    : tx.qr_content;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to List</span>
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print QR Slip</span>
        </button>
      </div>

      {/* Main QR Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: QR Display & Countdown */}
        <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg relative">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            {tx.provider_code === 'internal_qris' ? 'QRIS KANTOR / PEMBAYARAN' : 'DYNAMIC QRIS PAYMENT CODE'}
          </div>

          <div className="p-2 bg-white border-4 border-indigo-600 rounded-lg shadow-xs my-2 flex justify-center w-[260px] max-w-full">
            {(tx.provider_reference?.startsWith('INTERNAL-') || tx.payment_method === 'STATIC_QRIS') ? (
              <img
                src={resolvedQrUrl}
                alt="QRIS Kantor"
                className="w-full h-auto object-contain rounded"
                style={{ display: 'block', visibility: 'visible', opacity: 1 }}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  console.log('[QR LOAD]', {
                    src: img.src,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    width: img.width,
                    height: img.height
                  });
                }}
                onError={(e) => {
                  console.error('[QR ERROR]', e.currentTarget.src);
                }}
              />
            ) : (
              <canvas ref={canvasRef} className="max-w-full rounded" />
            )}
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Supported by All e-Money & Mobile Banking Apps</div>
            <div className="text-[10px] text-slate-400 font-mono">
              DANA • OVO • GoPay • ShopeePay • BCA • Mandiri • BRI
            </div>
          </div>

          {/* Status Message / Countdown Banner */}
          <div className="w-full mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            {tx.status === 'PENDING' && (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-900 border border-indigo-200 dark:border-indigo-900/50 rounded-full text-xs font-bold font-mono animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-indigo-700" />
                  <span>AWAITING PAYMENT... ({formatCountdown(timeRemaining)})</span>
                </div>
                {tx.provider_code === 'internal_qris' ? (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 space-y-1 text-left bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-200 dark:border-indigo-900/50">
                    <p className="font-bold">⚠️ INI PEMBAYARAN NYATA</p>
                    <ul className="list-disc list-inside ml-1">
                      <li>Scan QRIS menggunakan aplikasi mobile banking atau e-wallet.</li>
                      <li>Masukkan nominal pembayaran sesuai invoice.</li>
                      <li>Pastikan nominal pembayaran sesuai dengan jumlah tagihan.</li>
                      <li>Setelah pembayaran berhasil, akan diverifikasi oleh operator.</li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Scan QR with any compliant banking or e-wallet application.
                  </p>
                )}
              </div>
            )}

            {tx.status === 'PAID' && (
              <div className="space-y-2">
                <div className="p-3 bg-green-100 dark:bg-emerald-950/30 border border-green-200 dark:border-emerald-900/50 text-green-800 dark:text-emerald-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-emerald-500" />
                  <span>PAYMENT SETTLED SUCCESSFULLY</span>
                </div>
                {tx.provider_code === 'internal_qris' && logs.some(l => l.event_type === 'MANUAL_STATIC_QRIS') && (
                  <div className="text-[10px] text-green-700 dark:text-emerald-400 font-mono flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Verified by: {
                      JSON.parse(logs.find(l => l.event_type === 'MANUAL_STATIC_QRIS')?.payload || '{}').verifierName || 'Admin'
                    }
                  </div>
                )}
              </div>
            )}

            {tx.status === 'EXPIRED' && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>INVOICE EXPIRED</span>
              </div>
            )}

            {tx.status === 'FAILED' && (
              <div className="p-3 bg-red-100 dark:bg-rose-950/30 border border-red-200 dark:border-rose-900/50 text-red-800 dark:text-rose-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <XCircle className="w-4 h-4 text-red-600 dark:text-rose-500" />
                <span>PAYMENT FAILED</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Invoice & Order Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CURRENT STATUS</span>
            <StatusBadge status={tx.status} size="md" />
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">INVOICE AMOUNT</span>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">
              {formatRupiah(tx.amount)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Invoice ID:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{tx.invoice_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{tx.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Phone:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.customer_phone || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-500 dark:text-slate-400">Ref Code:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{tx.provider_reference || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Created At:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.created_at}</span>
            </div>
          </div>

          {tx.description && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">DESCRIPTION</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 p-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-lg font-medium">
                {tx.description}
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={copyQrText}
              className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-800"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Copy QR Payload'}</span>
            </button>
            {tx.provider_code === 'internal_qris' && tx.status === 'PENDING' && (
              <button
                onClick={copyPaymentLink}
                className="py-2 px-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-900/50"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Link Bayar</span>
              </button>
            )}
          </div>

          {/* Bukti bayar dari customer */}
          {tx.proof_image_path && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                Bukti Bayar (dikirim customer)
              </div>
              <a href={tx.proof_image_path} target="_blank" rel="noreferrer">
                <img
                  src={tx.proof_image_path}
                  alt="Bukti pembayaran"
                  className="w-full max-h-48 object-contain rounded-lg border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:opacity-80 transition-opacity bg-slate-50 dark:bg-slate-900"
                />
              </a>
              <p className="text-[10px] text-blue-600 mt-1 font-medium">Klik untuk buka gambar penuh</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Mock Payment Simulator Panel - ADMIN ONLY */}
      {user?.role === 'ADMIN' && tx.provider_code !== 'internal_qris' && !(tx.provider_reference?.startsWith('INTERNAL-') || tx.payment_method === 'STATIC_QRIS') && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 fill-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mock Payment Sandbox Controls</h3>
                <p className="text-[11px] text-slate-400">
                  Simulate instant callbacks and state transitions without real funds.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-indigo-600/20 border border-indigo-600/40 text-yellow-400 font-mono font-bold text-[10px] uppercase rounded">
              SANDBOX ACTIVE
            </span>
          </div>

          {simMessage && (
            <div className="p-3 bg-slate-800 border border-indigo-600/50 rounded-lg text-xs text-yellow-300 font-mono font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>{simMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <button
              disabled={isSimulating || tx.status !== 'PENDING'}
              onClick={() => handleSimulate('PAID')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulate PAID</span>
            </button>

            <button
              disabled={isSimulating || tx.status !== 'PENDING'}
              onClick={() => handleSimulate('FAILED')}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Simulate FAILED</span>
            </button>

            <button
              disabled={isSimulating || tx.status !== 'PENDING'}
              onClick={() => handleSimulate('EXPIRED')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs rounded-lg transition-all border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate EXPIRED</span>
            </button>

            <button
              disabled={isSimulating || tx.status !== 'PENDING'}
              onClick={handleSimulateWebhook}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Webhook</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Verification Panel for Internal Static QRIS - ADMIN & OPERATOR */}
      {(user?.role === 'ADMIN' || user?.role === 'OPERATOR') && tx.provider_code === 'internal_qris' && tx.status === 'PENDING' && (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-blue-500 text-white font-bold flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Manual Verification</h3>
                <p className="text-[11px] text-slate-400">
                  Verifikasi pembayaran QRIS statis kantor secara manual berdasarkan mutasi rekening.
                </p>
              </div>
            </div>
          </div>

          {simMessage && (
            <div className="p-3 bg-slate-800 border border-blue-500/50 rounded-lg text-xs text-blue-300 font-mono font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{simMessage}</span>
            </div>
          )}

          <div className="pt-1 flex">
            <button
              disabled={isSimulating || tx.status !== 'PENDING'}
              onClick={handleManualVerify}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verifikasi Pembayaran (Telah Dibayar)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
