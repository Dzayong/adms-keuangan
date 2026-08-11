import { Response } from 'express';
import { querySql, runSql } from '../config/db.js';
import { Setting } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const rows = await querySql<Setting>('SELECT * FROM settings');

    const settingsMap: Record<string, string> = {};
    for (const r of rows) {
      // Hide secret keys in response if present
      if (r.key.includes('secret') || r.key.includes('password')) {
        settingsMap[r.key] = r.value ? '********' : 'Not configured';
      } else {
        settingsMap[r.key] = r.value;
      }
    }

    // Include payment providers list
    const providers = await querySql('SELECT id, name, code, environment, is_active FROM payment_providers');

    return sendSuccess(res, {
      settings: settingsMap,
      providers,
    });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil pengaturan aplikasi.', 500);
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    // Role check: Only ADMIN can modify settings
    if (req.user?.role !== 'ADMIN') {
      return sendError(res, 'Akses ditolak. Hanya Role ADMIN yang dapat mengubah pengaturan.', 403);
    }

    const { settings = {}, providerStatus = {} } = req.body;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update settings key-values
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string' && value !== '********') {
        await runSql(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [key, value, nowStr]
        );
      }
    }

    // Update payment providers active flags
    for (const [providerCode, isActive] of Object.entries(providerStatus)) {
      await runSql(
        `UPDATE payment_providers SET is_active = ?, updated_at = ? WHERE code = ?`,
        [isActive ? 1 : 0, nowStr, providerCode]
      );
    }

    return sendSuccess(res, {}, 'Pengaturan berhasil diperbarui.');
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return sendError(res, 'Gagal memperbarui pengaturan aplikasi.', 500);
  }
}
