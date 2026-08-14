import React, { useEffect, useState } from 'react';
import { Users, Shield, ShieldAlert, CheckCircle, XCircle, Search, UserPlus, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_photo?: string;
  is_active: number;
  created_at: string;
}

interface LoginLog {
  id: number;
  user_id: number;
  user_name: string;
  ip_address: string;
  user_agent: string;
  login_time: string;
}

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users'|'logs'>('users');
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'OPERATOR', profile_photo: '' });
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/auth/logs');
      if (res.success) setLogs(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (!res.success) throw new Error(res.message || 'Gagal menambah pengguna');
      alert('Pengguna berhasil ditambahkan!');
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'OPERATOR', profile_photo: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      const res = await apiFetch(`/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.success) throw new Error(res.message || 'Gagal mereset password');
      alert('Password berhasil di-reset!');
      setIsResetModalOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Memuat data pengguna...</div>;
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Manajemen Pengguna
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola akses dan role pengguna pada sistem ADMS QRIS.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200">
          {error}
        </div>
      )}

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold text-sm ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          Daftar Pengguna
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-bold text-sm ${activeTab === 'logs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
        >
          Riwayat Login
        </button>
      </div>

      {activeTab === 'users' && (
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
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {u.profile_photo ? (
                      <img src={u.profile_photo} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-400 font-bold text-xs shadow-xs border border-slate-600">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
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
                        onClick={() => {
                          setSelectedUser(u);
                          setIsResetModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors tooltip-wrapper"
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRoleChange(u.id, u.role)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      >
                        {u.role === 'ADMIN' ? 'Jadikan Operator' : 'Jadikan Admin'}
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
                        {u.is_active ? 'Nonaktifkan Akses' : 'Buka Akses'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Tidak ada data pengguna yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'logs' && (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.login_time}</td>
                  <td className="px-6 py-4 text-sm text-slate-800">{log.user_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{log.ip_address || '-'}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[200px]">{log.user_agent || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">Belum ada riwayat login.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Tambah Pengguna
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Foto Profil (Opsional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setNewUser({...newUser, profile_photo: e.target?.result as string});
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600" placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600" placeholder="budi@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600" placeholder="Minimal 6 karakter" minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hak Akses (Role)</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600">
                  <option value="OPERATOR">Operator (Kasir)</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="pt-4 flex items-center gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-rose-500" /> Reset Password
              </h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 mb-4">
                Mereset password untuk pengguna: <strong className="text-slate-800 block mt-1">{selectedUser.name} ({selectedUser.email})</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
                <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600" placeholder="Minimal 6 karakter" minLength={6} />
              </div>
              <div className="pt-4 flex items-center gap-3">
                <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-lg transition-colors disabled:opacity-50">{isSubmitting ? 'Merubah...' : 'Reset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
