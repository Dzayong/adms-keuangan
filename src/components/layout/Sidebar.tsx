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
  Key,
  Code2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';

interface Props {
  userRole?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  requireAdmin?: boolean;
}

export const Sidebar: React.FC<Props> = ({ userRole }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isMerchant = userRole === 'MERCHANT';
  const isIT = userRole === 'IT';
  const isRestricted = isMerchant || isIT;

  const allNavItems: NavItem[] = isRestricted
    ? [
        { id: 'transactions', label: isIT ? 'Semua Transaksi' : 'Transaksi Saya', icon: Receipt },
        { id: 'developer', label: 'Developer API', icon: Code2 },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'create_payment', label: 'Manual Payment', icon: PlusCircle },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users, requireAdmin: true },
        { id: 'providers', label: 'Providers', icon: ServerCrash, requireAdmin: true },
        { id: 'settings', label: 'Settings', icon: Settings, requireAdmin: true },
        { id: 'api_keys', label: 'Client Apps', icon: Key, requireAdmin: true },
        { id: 'developer', label: 'Developer API', icon: Code2 },
      ];

  const navItems = isRestricted
    ? allNavItems
    : allNavItems.filter(item => !item.requireAdmin || userRole === 'ADMIN');

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hidden md:flex h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
        <h2 className="text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-widest text-center">
          Internal Management
        </h2>
      </div>

      <nav className="flex-1 py-4">
        <div className="px-6 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          MENU SYSTEM
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Handle both exact match and sub-paths (e.g. /transactions/123)
            const isActive = location.pathname === `/${item.id}` || 
                             (item.id === 'transactions' && location.pathname.startsWith('/transactions'));
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors text-left ${
                  isActive
                    ? 'text-indigo-700 dark:text-white bg-indigo-50 dark:bg-slate-800/60 border-r-4 border-indigo-600 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive ? 'bg-indigo-600 shadow-xs shadow-indigo-300 dark:shadow-yellow-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>


      </nav>

      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600 shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-yellow-400">
              {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          )}
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs text-slate-800 dark:text-white font-bold truncate">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email || 'admin@admsqris.local'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

