const API_BASE = '/api';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message?: string; data?: T; errors?: any[] }> {
  const token = localStorage.getItem('adms_qris_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok && json.message === 'Token tidak valid atau telah kedaluwarsa.') {
      localStorage.removeItem('adms_qris_token');
      localStorage.removeItem('adms_qris_user');
      window.location.href = '/login';
    }

    return json;
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return {
      success: false,
      message: err.message || 'Gagal terhubung ke server.',
    };
  }
}
