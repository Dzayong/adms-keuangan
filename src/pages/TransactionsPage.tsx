import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { Transaction, Pagination } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ban,
  Calendar,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onNavigateToDetail: (id: number) => void;
}

export const TransactionsPage: React.FC<Props> = ({ onNavigateToDetail }) => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Transactions Data Grid</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history & state management for QRIS invoices.
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(pagination.page)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-yellow-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice # or Customer Name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-yellow-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID (Settled)</option>
              <option value="FAILED">FAILED</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-yellow-500"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-yellow-500"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg text-xs transition-colors"
            >
              Filter
            </button>

            {(search || statusFilter || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-rose-200"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Invoice
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Customer
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Amount
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Method
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Date
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs italic">
                    {isLoading ? 'Fetching transaction records...' : 'No transactions matching filter criteria.'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 font-bold">{tx.invoice_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-800">
                      <div className="font-semibold">{tx.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{tx.customer_phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 font-mono">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 font-mono border border-slate-200">
                        {tx.payment_method || 'QRIS'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{tx.created_at}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToDetail(tx.id)}
                          className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>QR Screen</span>
                        </button>
                        <button
                          onClick={() => openTxDetail(tx)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors border border-slate-200"
                        >
                          Logs
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-700">{transactions.length}</span> dari{' '}
            <span className="font-bold text-slate-700">{pagination.totalItems}</span> transaksi
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTransactions(pagination.page + 1)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors"
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
          <div className="space-y-6 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase">Customer</div>
                <div className="font-bold text-slate-900">{selectedTx.customer_name}</div>
                <div className="text-xs text-slate-500">{selectedTx.customer_phone || '-'}</div>
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
                <div className="font-semibold text-slate-800">{selectedTx.creator_name || 'System'}</div>
              </div>
            </div>

            {selectedTx.description && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi</div>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  {selectedTx.description}
                </p>
              </div>
            )}

            {/* Audit Logs */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2">
                Riwayat Event & Payment Log
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

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              {selectedTx.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelTx(selectedTx.id)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Batalkan Transaksi</span>
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
