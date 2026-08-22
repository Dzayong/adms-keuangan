import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Ganti dengan IP laptop kamu saat dev (cek dengan ipconfig)
// Contoh: 'http://192.168.1.5:5000/api'
const BASE_URL = __DEV__
  ? 'http://192.168.1.92:5000/api'
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth — backend pakai session sederhana (belum JWT), simpan user di SecureStore
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    name: string; email: string; password: string; nik?: string; no_hp?: string;
  }) =>
    api.post('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      nik: data.nik,
      noHp: data.no_hp, // backend pakai noHp
    }),
};

// Submissions — field backend: resiId, noHp, jenisSim, serviceTitle
export const submissionAPI = {
  getAll: () => api.get('/submissions'),

  create: (data: {
    resiId: string; nama: string; nik: string; noHp: string;
    email: string; jenisSim: string; satpas: string; serviceTitle: string;
  }) => api.post('/submissions', data),

  updateStatus: (id: number, status: 'Pending' | 'Approved' | 'Rejected') =>
    api.patch(`/submissions/${id}/status`, { status }),
};

// SATPAS — backend return array of strings
export const satpasAPI = {
  getAll: () => api.get('/satpas'),
};

export default api;
