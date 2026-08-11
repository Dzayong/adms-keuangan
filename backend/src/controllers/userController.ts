import { Response } from 'express';
import { querySql, runSql } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, UserRole } from '../models/types.js';

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await querySql<Omit<User, 'password_hash'>>(
      `SELECT id, name, email, role, is_active, created_at, updated_at FROM users`
    );
    return sendSuccess(res, users);
  } catch (err) {
    return sendError(res, 'Gagal mengambil data pengguna.', 500);
  }
}

export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'OPERATOR'].includes(role)) {
      return sendError(res, 'Role tidak valid.', 400);
    }

    // Check if we are demoting the last admin
    if (role !== 'ADMIN') {
      const admins = await querySql<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND is_active = 1`);
      const targetUser = await querySql<User>(`SELECT role FROM users WHERE id = ?`, [id]);
      
      if (targetUser[0]?.role === 'ADMIN' && admins[0]?.count <= 1) {
        return sendError(res, 'Tidak dapat mengubah role Admin terakhir.', 400);
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await runSql(`UPDATE users SET role = ?, updated_at = ? WHERE id = ?`, [role, nowStr, id]);

    return sendSuccess(res, {}, 'Role pengguna berhasil diperbarui.');
  } catch (err) {
    return sendError(res, 'Gagal memperbarui role pengguna.', 500);
  }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Check if we are deactivating the last admin
    if (!is_active) {
      const admins = await querySql<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN' AND is_active = 1`);
      const targetUser = await querySql<User>(`SELECT role FROM users WHERE id = ?`, [id]);
      
      if (targetUser[0]?.role === 'ADMIN' && admins[0]?.count <= 1) {
        return sendError(res, 'Tidak dapat menonaktifkan Admin terakhir.', 400);
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await runSql(`UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?`, [is_active ? 1 : 0, nowStr, id]);

    return sendSuccess(res, {}, 'Status pengguna berhasil diperbarui.');
  } catch (err) {
    return sendError(res, 'Gagal memperbarui status pengguna.', 500);
  }
}
