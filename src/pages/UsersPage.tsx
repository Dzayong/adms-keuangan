import React, { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await apiFetch('/users');
      if (!res.success) throw new Error(res.message || 'Failed to fetch users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'OPERATOR' : 'ADMIN';
    if (!window.confirm(`Ubah role menjadi ${newRole}?`)) return;

    try {
      const res = await apiFetch(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (!res.success) throw new Error(res.message || 'Gagal mengubah role');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    if (!window.confirm(newStatus ? 'Aktifkan pengguna ini?' : 'Nonaktifkan pengguna ini?')) return;

    try {
      const res = await apiFetch(`/users/${userId}/active`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: newStatus })
      });
      if (!res.success) throw new Error(res.message || 'Gagal mengubah status');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat data pengguna...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-500" />
            Manajemen Pengguna
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akses dan role pengguna pada sistem ADMS QRIS.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4 text-center">Role</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'ADMIN' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
                          <XCircle className="w-4 h-4" /> Nonaktif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRoleChange(u.id, u.role)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Ubah Role
                      </button>
                      <button
                        onClick={() => handleStatusChange(u.id, u.is_active)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                          u.is_active 
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        disabled={u.id === currentUser?.id}
                      >
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Belum ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
