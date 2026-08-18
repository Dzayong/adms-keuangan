import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { DashboardStats, Transaction, ChartDataPoint } from '../types/index.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  ShieldCheck,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

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
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 shadow-xs">
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
          
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="icon"
            title="Refresh Data"
            isLoading={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

        </div>
      </Card>

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Volume */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Wallet className="w-24 h-24 text-slate-500" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full uppercase tracking-widest">Semua Waktu</span>
          </div>
          <p className="relative z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Total Transaksi
          </p>
          <h2 className="relative z-10 text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
            {formatRupiah(stats?.total_amount || 0)}
          </h2>
          <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats?.total_count || 0} Invoice Dibuat</span>
          </div>
        </div>

        {/* Card 2: Successful */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl border border-emerald-600 shadow-lg shadow-emerald-500/20 text-white group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <CheckCircle2 className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/30 flex items-center justify-center backdrop-blur-sm border border-emerald-400/30">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-400/20 border border-emerald-400/30 rounded-full uppercase tracking-widest">Lunas</span>
          </div>
          <p className="relative z-10 text-[11px] font-bold text-emerald-100 uppercase tracking-wider mb-1">
            Berhasil (Uang Masuk)
          </p>
          <h2 className="relative z-10 text-2xl font-black font-mono tracking-tight">
            {formatRupiah(stats?.paid_amount || 0)}
          </h2>
          <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs text-emerald-50 font-medium bg-emerald-900/30 w-fit px-2 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats?.paid_count || 0} Pembayaran Berhasil</span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl border border-amber-600 shadow-lg shadow-amber-500/20 text-white group cursor-pointer" onClick={onNavigateToTransactions}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Clock className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/30 flex items-center justify-center backdrop-blur-sm border border-amber-400/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full uppercase tracking-widest">Pending</span>
          </div>
          <p className="relative z-10 text-[11px] font-bold text-amber-100 uppercase tracking-wider mb-1">
            Menunggu Pembayaran
          </p>
          <h2 className="relative z-10 text-2xl font-black font-mono tracking-tight">
            {formatRupiah(stats?.pending_amount || 0)}
          </h2>
          <div className="relative z-10 mt-3 flex items-center justify-between gap-1.5 text-xs text-amber-50 font-medium bg-orange-900/30 w-fit px-2 py-1 rounded-md">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>{stats?.pending_count || 0} Belum Dibayar</span>
            </div>
          </div>
        </div>

        {/* Card 4: Failed */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-2xl border border-rose-600 shadow-lg shadow-rose-500/20 text-white group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <XCircle className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-400/30 flex items-center justify-center backdrop-blur-sm border border-rose-400/30">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-rose-400/20 border border-rose-400/30 rounded-full uppercase tracking-widest">Gagal</span>
          </div>
          <p className="relative z-10 text-[11px] font-bold text-rose-100 uppercase tracking-wider mb-1">
            Gagal / Kedaluwarsa
          </p>
          <h2 className="relative z-10 text-2xl font-black font-mono tracking-tight">
            {formatRupiah(stats?.failed_amount || 0)}
          </h2>
          <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs text-rose-50 font-medium bg-red-900/30 w-fit px-2 py-1 rounded-md">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats?.failed_count || 0} Transaksi Batal</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section: Left Table + Chart / Right Mock QR Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Data Grid Table */}
          <Card className="flex flex-col shadow-xs overflow-hidden">
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

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap">
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
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-right min-w-[120px]">
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
                      <tr key={tx.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors">
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
          </Card>

          {/* Daily Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-base">
                    Grafik Pendapatan
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Statistik pembayaran berhasil 7 hari terakhir
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Currency: <span className="text-indigo-600 dark:text-indigo-400">IDR</span></span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Belum Ada Data Grafik</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Lakukan transaksi untuk melihat pergerakan uang masuk.</p>
              </div>
            ) : (
              <div className="relative h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                      dy={15}
                    />
                    <YAxis
                      tickFormatter={(val) => `${val / 1000}k`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                      dx={-10}
                      width={50}
                    />
                    <Tooltip
                      cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '3 3' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-xl min-w-[160px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">{label}</p>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-semibold text-slate-500">Pendapatan Masuk</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                  {formatRupiah(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="paid_amount" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fill="url(#colorAmount)" 
                      activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3, shadowColor: '#4f46e5', shadowBlur: 10 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide) - Dark Mock QR Generator & Activity Log */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="p-6 shadow-sm">
            <h4 className="text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              <span>Aksi Cepat</span>
            </h4>

            <div className="space-y-3">
              <Button
                onClick={onNavigateToCreate}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Buat Tagihan (QRIS)</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </Button>

              <Button
                onClick={onNavigateToTransactions}
                variant="outline"
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Lihat Semua Transaksi</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-40" />
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

