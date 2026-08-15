import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-rose-600" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-2">Akses Ditolak</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
        Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini memerlukan hak akses tingkat Administrator.
      </p>
    </div>
  );
};
