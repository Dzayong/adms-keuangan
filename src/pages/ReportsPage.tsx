import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(status && { status }),
      ...(search && { search }),
    });

    const res = await apiFetch(`/reports?${query.toString()}`);
    if (res.success && res.data) {
      setSummary(res.data.summary || {});
      setItems(res.data.items || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, status]);

  const handleDownloadCsv = () => {
    const token = localStorage.getItem('adms_qris_token');
    const query = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(status && { status }),
    });

    // Trigger CSV download
    window.open(`/api/reports/export/csv?${query.toString()}`, '_blank');
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
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Financial Reports & Audit Exports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated settlement summary, conversion metrics, and CSV audit downloads.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Summary Totals Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Volume Created</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.total_amount || 0)}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            {summary.total_transactions || 0} Total Generated Invoices
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Settled Volume (PAID)</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.paid_amount || 0)}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {summary.paid_count || 0} Invoices Settled
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-yellow-500 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Volume</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.pending_amount || 0)}
          </div>
          <p className="text-[10px] text-yellow-600 font-bold mt-1">
            {summary.pending_count || 0} Invoices Awaiting Settlement
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Failed / Expired Volume</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.failed_amount || 0)}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            {summary.failed_count || 0} Invoices Expired or Cancelled
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Date Range:</span>
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-yellow-500"
          />

          <span className="text-xs text-slate-400">to</span>

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-yellow-500"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-yellow-500"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID (Settled)</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <button
          onClick={fetchReport}
          className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-yellow-500' : ''}`} />
          <span>Apply Filter</span>
        </button>
      </div>

      {/* Report Items Table */}
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
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Created Date
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Paid Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    {isLoading ? 'Generating audit log report...' : 'No transaction records matching filter criteria.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600">{item.invoice_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-800 font-semibold">{item.customer_name}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{item.created_at}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{item.paid_at || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
