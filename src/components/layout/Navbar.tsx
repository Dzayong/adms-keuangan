import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { LogOut, Shield, ShieldAlert, Clock, Moon, Sun, Menu } from 'lucide-react';

interface Props {
  onOpenCreateModal?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenCreateModal, onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const timeString = new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(`${timeString} WIB`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <img src="/logo.png?v=6" alt="ADMS Logo" className="h-8 sm:h-10 w-auto object-contain" />
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 transition-colors duration-200">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">SYSTEM LIVE</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shadow-inner transition-colors duration-200">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{currentTime}</span>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 my-auto hidden sm:block transition-colors duration-200" />

        <div className="flex items-center gap-2.5">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-600 shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-800 border border-slate-600 flex items-center justify-center text-yellow-400 font-bold text-xs shadow-xs">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name}</div>
            <div className="flex items-center gap-1">
              {user?.role === 'ADMIN' ? (
                <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> ADMINISTRATOR
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                  <ShieldAlert className="w-3 h-3" /> OPERATOR
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          title="Ganti Tema"
          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={logout}
          title="Keluar System"
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

