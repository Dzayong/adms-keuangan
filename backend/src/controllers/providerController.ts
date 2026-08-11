import { Response } from 'express';
import { querySql, runSql } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getAllProviders(req: AuthenticatedRequest, res: Response) {
  try {
    const providers = await querySql(
      `SELECT id, name, code, environment, is_active FROM payment_providers`
    );
    return sendSuccess(res, providers);
  } catch (err) {
    return sendError(res, 'Gagal mengambil data provider.', 500);
  }
}

export async function toggleProviderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await runSql(`UPDATE payment_providers SET is_active = ?, updated_at = ? WHERE id = ?`, [is_active ? 1 : 0, nowStr, id]);

    return sendSuccess(res, {}, 'Status provider berhasil diperbarui.');
  } catch (err) {
    return sendError(res, 'Gagal memperbarui status provider.', 500);
  }
}
