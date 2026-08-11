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
} from 'lucide-react';

interface Props {
  transactionId: number;
  onBack: () => void;
}

export const PaymentDetailPage: React.FC<Props> = ({ transactionId, onBack }) => {
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

      // Calculate expiry countdown
      if (transaction.expired_at) {
        const expiredTime = new Date(transaction.expired_at.replace(' ', 'T')).getTime();
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
    if (tx?.qr_content && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, tx.qr_content, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch((err) => console.error('Error rendering QR:', err));
    }
  }, [tx?.qr_content]);

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

  const copyQrText = () => {
    if (tx?.qr_content) {
      navigator.clipboard.writeText(tx.qr_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
        <p className="text-sm font-semibold text-slate-500">Memuat tampilan QR Pembayaran...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-xs"
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: QR Display & Countdown */}
        <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-200 rounded-lg relative">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            DYNAMIC QRIS PAYMENT CODE
          </div>

          <div className="p-2 bg-white border-4 border-yellow-500 rounded-lg shadow-xs my-2">
            <canvas ref={canvasRef} className="max-w-full rounded" />
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-xs font-bold text-slate-700">Supported by All e-Money & Mobile Banking Apps</div>
            <div className="text-[10px] text-slate-400 font-mono">
              DANA • OVO • GoPay • ShopeePay • BCA • Mandiri • BRI
            </div>
          </div>

          {/* Status Message / Countdown Banner */}
          <div className="w-full mt-4 pt-3 border-t border-slate-200">
            {tx.status === 'PENDING' && (
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-bold font-mono animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-yellow-600" />
                  <span>AWAITING PAYMENT... ({formatCountdown(timeRemaining)})</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Scan QR with any compliant banking or e-wallet application.
                </p>
              </div>
            )}

            {tx.status === 'PAID' && (
              <div className="p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span>PAYMENT SETTLED SUCCESSFULLY</span>
              </div>
            )}

            {tx.status === 'EXPIRED' && (
              <div className="p-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>INVOICE EXPIRED</span>
              </div>
            )}

            {tx.status === 'FAILED' && (
              <div className="p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 font-mono">
                <XCircle className="w-4 h-4 text-red-600" />
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
            <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">
              {formatRupiah(tx.amount)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Invoice ID:</span>
              <span className="font-bold text-slate-900">{tx.invoice_number}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-800">{tx.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-700">{tx.customer_phone || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Ref Code:</span>
              <span className="font-bold text-slate-800">{tx.provider_reference || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created At:</span>
              <span className="font-semibold text-slate-700">{tx.created_at}</span>
            </div>
          </div>

          {tx.description && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">DESCRIPTION</span>
              <p className="text-xs text-slate-700 mt-1 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg font-medium">
                {tx.description}
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={copyQrText}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Payload Copied!' : 'Copy QR Raw Payload'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Mock Payment Simulator Panel */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-yellow-500 text-slate-900 font-bold flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 fill-slate-900" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mock Payment Sandbox Controls</h3>
              <p className="text-[11px] text-slate-400">
                Simulate instant callbacks and state transitions without real funds.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-mono font-bold text-[10px] uppercase rounded">
            SANDBOX ACTIVE
          </span>
        </div>

        {simMessage && (
          <div className="p-3 bg-slate-800 border border-yellow-500/50 rounded-lg text-xs text-yellow-300 font-mono font-semibold flex items-center gap-2">
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
            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 disabled:opacity-30 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Trigger Webhook</span>
          </button>
        </div>
      </div>
    </div>
  );
};
