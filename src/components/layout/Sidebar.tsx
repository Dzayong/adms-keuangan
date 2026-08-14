import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  BarChart3,
  Settings,
  QrCode,
  Info,
  Users,
  ServerCrash,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  requireAdmin?: boolean;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab, userRole }) => {
  const { user } = useAuth();

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'create_payment', label: 'Manual Payment', icon: PlusCircle },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users, requireAdmin: true },
    { id: 'providers', label: 'Providers', icon: ServerCrash, requireAdmin: true },
    { id: 'settings', label: 'Settings', icon: Settings, requireAdmin: true },
    { id: 'api_keys', label: 'Client Apps', icon: Key, requireAdmin: true },
  ];

  const navItems = allNavItems.filter(item => !item.requireAdmin || userRole === 'ADMIN');

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-300 hidden md:flex min-h-[calc(100vh-4rem)] select-none">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ADMS Logo" className="h-10 w-auto object-contain bg-white rounded p-1" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1A2C59] via-[#1A2C59] to-amber-500 font-black tracking-tight text-2xl ml-1 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">QRIS</span>
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
                    ? 'text-white bg-slate-800/60 border-r-4 border-indigo-600 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-indigo-600 shadow-xs shadow-yellow-500' : 'bg-slate-600'
                  }`}
                />
                <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>


      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-600 shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-yellow-400">
              {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          )}
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs text-white font-bold truncate">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'admin@admsqris.local'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

