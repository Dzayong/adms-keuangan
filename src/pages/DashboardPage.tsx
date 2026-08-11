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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const res = await apiFetch('/transactions/dashboard');
    if (res.success && res.data) {
      setStats(res.data.stats);
      setChartData(res.data.chartData || []);
      setRecentTx(res.data.recentTransactions || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analytics Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring & QRIS payment processing metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-yellow-600' : ''}`} />
          </button>
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg text-xs shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Payment</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Volume
          </p>
          <h2 className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(stats?.total_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-emerald-600 font-bold">
            {stats?.total_count || 0} Total Transactions Created
          </div>
        </div>

        {/* Card 2: Successful */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Successful (PAID)
          </p>
          <h2 className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(stats?.paid_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-emerald-600 font-bold">
            {stats?.paid_count || 0} Settled Invoices
          </div>
        </div>

        {/* Card 3: Pending with Yellow Left Border */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-l-4 border-l-yellow-500 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Pending Payment
          </p>
          <h2 className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(stats?.pending_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-yellow-600 font-bold underline cursor-pointer" onClick={onNavigateToTransactions}>
            {stats?.pending_count || 0} Awaiting Verification
          </div>
        </div>

        {/* Card 4: Failed / Expired */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Failed / Expired
          </p>
          <h2 className="text-2xl font-black text-slate-800 font-mono">
            {formatRupiah(stats?.failed_amount || 0)}
          </h2>
          <div className="mt-2 text-[10px] text-slate-500 font-medium">
            {stats?.failed_count || 0} Transactions Expired or Cancelled
          </div>
        </div>
      </div>

      {/* Main Grid Section: Left Table + Chart / Right Mock QR Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Data Grid Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
                <p className="text-[11px] text-slate-400">Live feed of payments processed through system.</p>
              </div>
              <button
                onClick={onNavigateToTransactions}
                className="text-[11px] text-yellow-600 font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

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
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                        No recent transactions found.
                      </td>
                    </tr>
                  ) : (
                    recentTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 font-bold">
                          {tx.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-800">
                          <div className="font-semibold">{tx.customer_name}</div>
                          <div className="text-[10px] text-slate-400">{tx.customer_phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 font-mono">
                          {formatRupiah(tx.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onNavigateToDetail(tx.id)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline"
                          >
                            Details
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Settled Volume (7 Days)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">CURRENCY: IDR</span>
            </div>

            {chartData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No chart history available.</div>
            ) : (
              <div className="flex items-end gap-3 h-36 pt-4 pb-2 border-b border-slate-100">
                {chartData.map((pt, idx) => {
                  const maxVal = Math.max(...chartData.map((d) => d.paid_amount), 1);
                  const heightPct = Math.max(10, Math.round((pt.paid_amount / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                      <div className="text-[9px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 text-white px-1.5 py-0.5 rounded">
                        {formatRupiah(pt.paid_amount)}
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-slate-800 group-hover:bg-yellow-500 rounded-t transition-colors shadow-xs"
                      />
                      <span className="text-[10px] font-mono text-slate-400">
                        {pt.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide) - Dark Mock QR Generator & Activity Log */}
        <div className="space-y-6">
          {/* Dark Mock QR Generator Panel */}
          <div className="bg-slate-900 rounded-xl p-6 text-center border border-slate-800 shadow-xl">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4 text-yellow-500" />
              <span>Mock QRIS Engine</span>
            </h4>

            <div className="bg-white p-3 rounded-lg mx-auto w-40 h-40 flex items-center justify-center relative shadow-md">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-yellow-500 rounded-lg pointer-events-none" />
              <div className="grid grid-cols-4 grid-rows-4 gap-1">
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
                <div className="w-6 h-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-900"></div>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-yellow-500 text-[10px] font-mono font-bold uppercase tracking-tight">
                PROVIDER: MOCK QRIS SANDBOX
              </p>
              <p className="text-slate-400 text-[10px]">Instant QR generation & mock payment simulator.</p>
            </div>

            <button
              onClick={onNavigateToCreate}
              className="mt-4 w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Generate Dynamic QR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Activity Logs Block */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Recent Activity Logs</span>
            </h4>

            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-1 h-8 bg-emerald-500 rounded-full shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-800">System Ready & Synchronized</span>
                  <span className="text-[10px] text-slate-500 font-mono">Mock Provider - Active</span>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-800">Internal Auth Verified</span>
                  <span className="text-[10px] text-slate-500 font-mono">JWT Bearer Token Issued</span>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <div className="w-1 h-8 bg-yellow-500 rounded-full shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-800">Webhook Receiver Online</span>
                  <span className="text-[10px] text-slate-500 font-mono">/api/webhooks/mock - Listening</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

