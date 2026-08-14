import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { QrCode, Lock, Mail, ShieldAlert, ArrowRight, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@admsqris.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || 'Login gagal.');
    }
  };

  const handleQuickFill = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      setEmail('admin@admsqris.local');
      setPassword('Admin123!');
    } else {
      setEmail('operator@admsqris.local');
      setPassword('Operator123!');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="ADMS Logo" className="h-20 w-auto object-contain bg-white rounded-lg p-2 shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="text-yellow-400">QRIS</span>
          </h1>
          <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
            INTERNAL OFFICE MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Development Seed Warning Badge */}
        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2.5 text-xs text-yellow-300 font-mono">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-bold">SANDBOX MODE:</span> Select default seed credentials below to enter system.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Access Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@admsqris.local"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg shadow-xs flex items-center justify-center gap-2 text-xs transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Buttons for Testing */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Quick Fill Test Roles:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-bold text-yellow-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>🔑 ADMIN</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('operator')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-mono font-bold text-sky-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>👤 OPERATOR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
