import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Activity,
  CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

// --- Dummy Data ---
const dummySalesData = [
  { name: 'Senin', sales: 120 },
  { name: 'Selasa', sales: 150 },
  { name: 'Rabu', sales: 180 },
  { name: 'Kamis', sales: 140 },
  { name: 'Jumat', sales: 210 },
  { name: 'Sabtu', sales: 280 },
  { name: 'Minggu', sales: 240 },
];

export const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Dummy State for missing API data
  const [dummyStats] = useState({
    totalCustomers: 1245,
    productsSold: 3450
  });

  const fetchReport = async () => {
    setIsLoading(true);
    const query = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(status && { status }),
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
    const val = e.target.value; 
    setSelectedMonth(val);
    if (val) {
      const [year, month] = val.split('-');
      const firstDay = new Date(Number(year), Number(month) - 1, 1);
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

  // Process data for Trend Line Chart
  const processTrendData = () => {
    const dataMap: Record<string, { date: string; amount: number; count: number; paidAmount: number }> = {};
    const sortedItems = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedItems.forEach(item => {
      const dateStr = item.created_at.split(' ')[0]; 
      if (!dataMap[dateStr]) {
        dataMap[dateStr] = { date: dateStr, amount: 0, count: 0, paidAmount: 0 };
      }
      
      dataMap[dateStr].amount += item.amount;
      dataMap[dateStr].count += 1;
      
      if (item.status === 'PAID') {
        dataMap[dateStr].paidAmount += item.amount;
      }
    });
    
    return Object.values(dataMap);
  };

  // Process data for Status Pie Chart
  const processStatusData = () => {
    return [
      { name: 'Lunas', value: summary.paid_count || 0, color: '#10b981' }, 
      { name: 'Menunggu', value: summary.pending_count || 0, color: '#f59e0b' }, 
      { name: 'Gagal', value: summary.failed_count || 0, color: '#ef4444' }, 
    ].filter(item => item.value > 0);
  };

  const trendData = processTrendData();
  const statusData = processStatusData();

  // Pagination logic
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 pb-16 animate-fade-in w-full max-w-[1400px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Laporan & Statistik</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ringkasan pendapatan, performa penjualan, dan analitik transaksi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadCsv}
            variant="outline"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Options (shadcn styling) */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Kustom:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedMonth('');
              }}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
            />
            <span className="text-sm text-slate-400 font-medium">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth('');
              }}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300"
          >
            <option value="">Semua Status</option>
            <option value="PAID">PAID (Lunas)</option>
            <option value="PENDING">PENDING (Menunggu)</option>
            <option value="FAILED">FAILED (Gagal)</option>
            <option value="EXPIRED">EXPIRED (Kedaluwarsa)</option>
          </select>
        </div>

          <div className="flex gap-2">
            <Button onClick={fetchReport} isLoading={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Terapkan Filter
            </Button>
          </div>
      </Card>

      {/* 4 Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Pendapatan */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">Total Pendapatan</h3>
            <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatRupiah(summary.paid_amount || 0)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              +20.1% dari bulan lalu
            </p>
          </div>
        </Card>

        {/* Total Transaksi */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">Total Transaksi</h3>
            <CreditCard className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">+{summary.total_transactions || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              +{summary.paid_count || 0} berhasil dibayar
            </p>
          </div>
        </Card>

        {/* Produk Terjual (Dummy) */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">Produk Terjual</h3>
            <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">+{dummyStats.productsSold}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              +19% dari bulan lalu
            </p>
          </div>
        </Card>

        {/* Total Customers (Dummy) */}
        <Card className="p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">Total Customer</h3>
            <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">+{dummyStats.totalCustomers}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              +201 customer baru
            </p>
          </div>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Line Chart: Tren Transaksi */}
        <Card className="col-span-1 lg:col-span-4 flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Tren Transaksi</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan nominal tagihan dan uang masuk harian.
            </p>
          </div>
          <div className="p-6 pt-0 flex-1">
            {!isLoading && items.length > 0 ? (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => formatRupiah(value as number)}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area 
                      type="monotone" 
                      name="Pendapatan Lunas" 
                      dataKey="paidAmount" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPaid)" 
                    />
                    <Line 
                      type="monotone" 
                      name="Total Tagihan Dibuat" 
                      dataKey="amount" 
                      stroke="#64748b" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-sm text-slate-500">
                {isLoading ? 'Memuat grafik...' : 'Data tidak tersedia'}
              </div>
            )}
          </div>
        </Card>

        {/* Pie Chart: Status Pembayaran */}
        <Card className="col-span-1 lg:col-span-3 flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Status Pembayaran</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Distribusi status transaksi pada periode ini.
            </p>
          </div>
          <div className="p-6 pt-0 flex-1 flex flex-col items-center justify-center">
            {!isLoading && statusData.length > 0 ? (
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: '600', fontSize: '13px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      formatter={(value, entry: any) => <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold">{summary.total_transactions}</span>
                  <span className="text-xs text-slate-500">Total</span>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
                {isLoading ? 'Memuat grafik...' : 'Data tidak tersedia'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Secondary Charts Section (Bar Chart - Dummy Sales Data) */}
      <Card className="flex flex-col">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Penjualan Produk (Minggu Ini)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Performa penjualan harian (Data Simulasi).
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummySalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" name="Produk Terjual" fill="#0f172a" className="dark:fill-slate-100" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Recent Transactions Table */}
      <Card>
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Data Transaksi Terbaru</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daftar lengkap tagihan dan statusnya.
          </p>
        </div>
        <div className="p-6 pt-0 overflow-x-auto w-full">
          <table className="w-full caption-bottom text-sm whitespace-nowrap">
            <thead className="[&_tr]:border-b border-slate-200 dark:border-slate-800">
              <tr className="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100 dark:hover:bg-slate-800/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">ID Tagihan</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Pelanggan</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Nominal</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-slate-500 dark:text-slate-400">Tgl Dibuat</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 align-middle text-center text-slate-500 h-24">
                    {isLoading ? 'Memuat data...' : 'Tidak ada data ditemukan.'}
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100 dark:hover:bg-slate-800/50">
                    <td className="p-4 align-middle font-mono text-xs">{item.invoice_number}</td>
                    <td className="p-4 align-middle font-medium">{item.customer_name}</td>
                    <td className="p-4 align-middle font-mono font-medium">{formatRupiah(item.amount)}</td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-4 align-middle text-xs text-slate-500">{item.created_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 p-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Sebelumnya
            </Button>
            <div className="text-sm font-medium">
              Hal {currentPage} dari {totalPages}
            </div>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
