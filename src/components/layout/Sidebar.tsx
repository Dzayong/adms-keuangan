import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  BarChart3,
  Settings,
  QrCode,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: string;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'create_payment', label: 'Create Payment', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 hidden md:flex min-h-[calc(100vh-4rem)] select-none">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-white font-black tracking-tight text-lg">ADMS QRIS</span>
        </div>
        <p className="text-slate-400 text-[10px] mt-1 font-semibold uppercase tracking-widest">
          INTERNAL MANAGEMENT
        </p>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-6 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          MENU SYSTEM
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors text-left ${
                  isActive
                    ? 'text-white bg-slate-800/60 border-r-4 border-yellow-500 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-yellow-500 shadow-xs shadow-yellow-500' : 'bg-slate-600'
                  }`}
                />
                <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-4 mt-6 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>SANDBOX MOCK ACTIVE</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Sistem terintegrasi dengan Mock QRIS engine & simulator callback webhook.
          </p>
        </div>
      </nav>

      <div className="p-4 bg-slate-900 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-yellow-400">
            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs text-white font-bold truncate">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'admin@admsqris.local'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

