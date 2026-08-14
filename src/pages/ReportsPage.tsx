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
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      setCurrentPage(1); // Reset page on new fetch
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, status]);

  const handleDownloadCsv = async () => {
    const token = localStorage.getItem('adms_qris_token');
    const query = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(status && { status }),
    });

    try {
      const res = await fetch(`/api/reports/export/csv?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        alert('Gagal mengunduh laporan. Sesi mungkin telah berakhir.');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Transaksi_QRIS_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Terjadi kesalahan saat mengunduh CSV.');
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

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM
    setSelectedMonth(val);
    if (val) {
      const [year, month] = val.split('-');
      // first day of the month
      const firstDay = new Date(Number(year), Number(month) - 1, 1);
      // last day of the month
      const lastDay = new Date(Number(year), Number(month), 0);
      
      const formatYMD = (d: Date) => {
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
      };
      
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(lastDay));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Keuangan & Ekspor Data</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan uang masuk, dan unduh laporan transaksi (CSV).
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unduh Laporan (CSV)</span>
        </button>
      </div>

      {/* Summary Totals Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Tagihan Dibuat</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.total_amount || 0)}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            {summary.total_transactions || 0} Total Tagihan Dibuat
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uang Masuk (Lunas)</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.paid_amount || 0)}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {summary.paid_count || 0} Tagihan Lunas
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-yellow-500 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Menunggu Pembayaran</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.pending_amount || 0)}
          </div>
          <p className="text-[10px] text-indigo-700 font-bold mt-1">
            {summary.pending_count || 0} Tagihan Menunggu
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gagal / Kedaluwarsa</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(summary.failed_amount || 0)}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            {summary.failed_count || 0} Tagihan Kedaluwarsa/Batal
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Pilih Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer ml-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Atau Kustom:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedMonth(''); // clear month if custom date is used
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth('');
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
          >
            <option value="">Semua Status</option>
            <option value="PAID">PAID (Lunas)</option>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="FAILED">FAILED (Gagal)</option>
            <option value="EXPIRED">EXPIRED (Kedaluwarsa)</option>
          </select>
        </div>

        <button
          onClick={fetchReport}
          className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Terapkan Filter</span>
        </button>
      </div>

      {/* Report Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  ID Tagihan
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Pelanggan
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Nominal
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Status
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Tgl Dibuat
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Tgl Lunas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    {isLoading ? 'Memuat laporan...' : 'Tidak ada data transaksi yang cocok untuk periode ini.'}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Menampilkan <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, items.length)}</strong> dari <strong className="text-slate-800">{items.length}</strong> data
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <div className="flex items-center px-3 text-xs font-bold text-slate-800">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-bold rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
