import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { DashboardStats, Transaction, ChartDataPoint } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  PlusCircle,
  Eye,
  RefreshCw,
  ArrowUpRight,
  Activity,
  QrCode,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onNavigateToCreate: () => void;
  onNavigateToDetail: (id: number) => void;
  onNavigateToTransactions: () => void;
}

export const DashboardPage: React.FC<Props> = ({
  onNavigateToCreate,
  onNavigateToDetail,
  onNavigateToTransactions,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    let query = '';
    if (filterType === 'MONTH' && selectedMonth) {
      query = `?month=${selectedMonth}`;
    } else if (filterType === 'YEAR' && selectedYear) {
      query = `?year=${selectedYear}`;
    }
    const res = await apiFetch(`/transactions/dashboard${query}`);
    if (res.success && res.data) {
      setStats(res.data.stats);
      setChartData(res.data.chartData || []);
      setRecentTx(res.data.recentTransactions || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterType, selectedMonth, selectedYear]);

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

  const formatCompactRupiah = (amount: number) => {
    if (!amount) return 'Rp 0';
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1).replace('.0', '')}M`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}k`;
    return `Rp ${amount}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Ringkasan Pembayaran</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pantau uang masuk dan status pembayaran QRIS hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          >
            <option value="ALL">Semua Waktu</option>
            <option value="MONTH">Per Bulan</option>
            <option value="YEAR">Per Tahun</option>
          </select>
          
          {filterType === 'MONTH' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          )}

          {filterType === 'YEAR' && (
            <input
              type="number"
              min="2000"
              max="2100"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-24"
              placeholder="Tahun"
            />
          )}
          
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-700' : ''}`} />
          </button>
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Payment</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Semua Transaksi (Dibuat)
          </p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
            {formatRupiah(stats?.total_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">
            {stats?.total_count || 0} Total Transaksi Tercatat
          </div>
        </div>

        {/* Card 2: Successful */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-1">
            Berhasil (Uang Masuk)
          </p>
          <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 font-mono">
            {formatRupiah(stats?.paid_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-500 font-bold">
            {stats?.paid_count || 0} Transaksi Lunas
          </div>
        </div>

        {/* Card 3: Pending with Yellow Left Border */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <p className="text-[11px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-1">
            Menunggu Pembayaran
          </p>
          <h2 className="text-2xl font-black text-yellow-900 dark:text-yellow-400 font-mono">
            {formatRupiah(stats?.pending_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-yellow-700 dark:text-yellow-500 font-bold underline cursor-pointer" onClick={onNavigateToTransactions}>
            {stats?.pending_count || 0} Belum Dibayar
          </div>
        </div>

        {/* Card 4: Failed / Expired */}
        <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-500 uppercase tracking-wider mb-1">
            Gagal / Kedaluwarsa
          </p>
          <h2 className="text-2xl font-black text-rose-900 dark:text-rose-400 font-mono">
            {formatRupiah(stats?.failed_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-rose-700 dark:text-rose-500 font-medium">
            {stats?.failed_count || 0} Transaksi Batal/Kedaluwarsa
          </div>
        </div>
      </div>

      {/* Main Grid Section: Left Table + Chart / Right Mock QR Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Data Grid Table */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Transaksi Terbaru</h3>
                <p className="text-[11px] text-slate-400">Daftar pembayaran yang baru saja masuk.</p>
              </div>
              <button
                onClick={onNavigateToTransactions}
                className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

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
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                        Belum ada transaksi terbaru.
                      </td>
                    </tr>
                  ) : (
                    recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
                          {tx.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
                          <div className="font-semibold">{tx.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{tx.customer_phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onNavigateToDetail(tx.id)}
                            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 underline"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Chart */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Pendapatan 7 Hari Terakhir
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CURRENCY: IDR</span>
            </div>

            {chartData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-slate-200" />
                </div>
                Belum ada data grafik pendapatan.
              </div>
            ) : (
              <div className="relative h-48 mt-6">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-t border-slate-300 w-full"></div>
                  <div className="border-t border-slate-300 w-full"></div>
                  <div className="border-t border-slate-300 w-full"></div>
                  <div className="border-t border-slate-300 w-full"></div>
                </div>
                
                <div className="relative flex items-end justify-between gap-1 sm:gap-2 h-full pb-6 pt-4 px-1">
                  {chartData.map((pt, idx) => {
                    const maxVal = Math.max(...chartData.map((d) => d.paid_amount), 1);
                    const heightPct = Math.max(8, Math.round((pt.paid_amount / maxVal) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                        {/* Compact label above bar */}
                        <div className="absolute -top-5 text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                          {formatCompactRupiah(pt.paid_amount)}
                        </div>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute -top-9 text-[9px] font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 whitespace-nowrap translate-y-1 group-hover:translate-y-0 pointer-events-none">
                          {formatRupiah(pt.paid_amount)}
                        </div>
                        
                        {/* Bar */}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-300 group-hover:from-indigo-500 group-hover:to-indigo-300 shadow-sm"
                        />
                        
                        {/* Date Label */}
                        <span className="absolute -bottom-5 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {pt.date.split('-').slice(1).join('/')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide) - Dark Mock QR Generator & Activity Log */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Aksi Cepat</span>
            </h4>

            <div className="space-y-3">
              <button
                onClick={onNavigateToCreate}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-between px-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Buat Tagihan (QRIS)</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={onNavigateToTransactions}
                className="w-full py-3 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-between px-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Lihat Semua Transaksi</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-40" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

