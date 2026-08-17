import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { Transaction, Pagination } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ban,
  X,
  CheckCircle2,
  ShieldCheck,
  Share2,
  ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface Props {
  onNavigateToDetail: (id: number) => void;
}

export const TransactionsPage: React.FC<Props> = ({ onNavigateToDetail }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(pagination.limit),
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const res = await apiFetch(`/transactions?${queryParams.toString()}`);
    if (res.success && res.data) {
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  const openTxDetail = async (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
    const res = await apiFetch(`/transactions/${tx.id}`);
    if (res.success && res.data) {
      setLogs(res.data.logs || []);
    }
  };

  const handleCancelTx = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) return;
    const res = await apiFetch(`/transactions/${id}/cancel`, { method: 'POST' });
    if (res.success) {
      fetchTransactions(pagination.page);
      setIsDetailOpen(false);
    } else {
      alert(res.message || 'Gagal membatalkan transaksi.');
    }
  };

  const handleQuickVerify = async (tx: Transaction) => {
    if (!confirm(`Pastikan pembayaran sudah masuk di aplikasi DANA/bank sebelum konfirmasi.\n\nVerifikasi pembayaran dari ${tx.customer_name} sebesar ${formatRupiah(tx.amount)}?`)) return;
    const paymentId = tx.payment_id;
    if (!paymentId) return alert('Tidak ada data pembayaran.');
    const res = await apiFetch(`/payments/${paymentId}/verify`, { method: 'POST' });
    if (res.success) {
      fetchTransactions(pagination.page);
    } else {
      alert(res.message || 'Gagal memverifikasi pembayaran.');
    }
  };

  const copyPaymentLink = (invoiceNumber: string) => {
    const link = `${window.location.origin}/pay/${invoiceNumber}`;
    navigator.clipboard.writeText(link);
    alert(`Link pembayaran disalin:\n${link}`);
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Daftar Transaksi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Riwayat tagihan dan pembayaran QRIS dari semua aplikasi.
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(pagination.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-700' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID Tagihan atau Nama Pelanggan..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white dark:bg-slate-950 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">PENDING (Menunggu)</option>
              <option value="PAID">PAID (Lunas)</option>
              <option value="FAILED">FAILED (Gagal)</option>
              <option value="EXPIRED">EXPIRED (Kedaluwarsa)</option>
              <option value="CANCELLED">CANCELLED (Batal)</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-600"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Cari Data
            </button>

            {(search || statusFilter || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900/50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  ID Tagihan
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Pelanggan
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Nominal
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Metode
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                    {isLoading ? 'Mengambil data transaksi...' : 'Tidak ada transaksi yang cocok.'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">{tx.invoice_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
                      <div className="font-semibold">{tx.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{tx.customer_phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-800">
                        {tx.payment_method || 'QRIS'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">{tx.created_at}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Quick verify button for PENDING internal_qris */}
                        {tx.status === 'PENDING' && tx.provider_code === 'internal_qris' &&
                          (user?.role === 'ADMIN' || user?.role === 'OPERATOR') && (
                          <button
                            onClick={() => handleQuickVerify(tx)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                            title="Verifikasi pembayaran"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verifikasi</span>
                          </button>
                        )}
                        {/* Proof indicator */}
                        {tx.proof_image_path && tx.status === 'PENDING' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            Bukti
                          </span>
                        )}
                        <button
                          onClick={() => onNavigateToDetail(tx.id)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        {/* Share payment link */}
                        {tx.status === 'PENDING' && tx.provider_code === 'internal_qris' && (
                          <button
                            onClick={() => copyPaymentLink(tx.invoice_number)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold transition-colors border border-slate-200 dark:border-slate-800"
                            title="Salin link pembayaran untuk customer"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => openTxDetail(tx)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-semibold transition-colors border border-slate-200 dark:border-slate-800"
                        >
                          Log
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{transactions.length}</span> dari{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">{pagination.totalItems}</span> transaksi
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
              className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTransactions(pagination.page + 1)}
              className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Transaksi ${selectedTx?.invoice_number}`}
        maxWidth="lg"
      >
        {selectedTx && (
          <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Pelanggan</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">{selectedTx.customer_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{selectedTx.customer_phone || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Nominal</div>
                <div className="font-extrabold text-amber-600 text-base">
                  {formatRupiah(selectedTx.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Status</div>
                <div className="mt-1">
                  <StatusBadge status={selectedTx.status} />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Dibuat Oleh</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedTx.creator_name || 'System'}</div>
              </div>
            </div>

            {selectedTx.description && (
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Deskripsi</div>
                <p className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  {selectedTx.description}
                </p>
              </div>
            )}

            {/* Bukti Bayar */}
            {selectedTx.proof_image_path && (
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  Bukti Pembayaran (diunggah customer)
                </div>
                <a href={selectedTx.proof_image_path} target="_blank" rel="noreferrer">
                  <img
                    src={selectedTx.proof_image_path}
                    alt="Bukti bayar"
                    className="max-h-48 w-full object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </a>
                <p className="text-[10px] text-slate-400 mt-1">Klik gambar untuk membuka full size</p>
              </div>
            )}

            {/* Audit Logs */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                Log Sistem & Pengiriman Webhook
              </h4>
              {logs.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 italic">Belum ada riwayat log callback.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px] text-amber-400 mb-1">
                        <span>{log.event_type}</span>
                        <span>{log.created_at}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{log.payload}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex-wrap">
              {selectedTx.status === 'PENDING' && selectedTx.provider_code === 'internal_qris' &&
                (user?.role === 'ADMIN' || user?.role === 'OPERATOR') && (
                <button
                  onClick={() => { handleQuickVerify(selectedTx); setIsDetailOpen(false); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi Lunas</span>
                </button>
              )}
              {selectedTx.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelTx(selectedTx.id)}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Batalkan</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  onNavigateToDetail(selectedTx.id);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Tampilkan Tampilan QR Code
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
