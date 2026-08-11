import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { LogOut, Plus, Shield, ShieldAlert, QrCode, Activity } from 'lucide-react';

interface Props {
  onOpenCreateModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenCreateModal }) => {
  const { user, logout } = useAuth();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center font-black text-slate-900 shadow-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-800 flex items-center gap-2">
              ADMS <span className="text-yellow-600 font-black">QRIS</span>
            </h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">SYSTEM LIVE</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Buat Pembayaran</span>
            <span className="sm:hidden">Buat</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 my-auto hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-yellow-400 font-bold text-xs shadow-xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800">{user?.name}</div>
            <div className="flex items-center gap-1">
              {user?.role === 'ADMIN' ? (
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> ADMINISTRATOR
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
                  <ShieldAlert className="w-3 h-3" /> OPERATOR
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Keluar System"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

