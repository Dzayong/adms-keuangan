import { Response } from 'express';
import { querySql, runSql } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, UserRole } from '../models/types.js';
import bcrypt from 'bcryptjs';

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role, profile_photo } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, 'Semua field (nama, email, password, role) wajib diisi.', 400);
    }

    if (!['ADMIN', 'OPERATOR'].includes(role)) {
      return sendError(res, 'Role tidak valid.', 400);
    }

    // Check if email exists
    const existing = await querySql<{ id: number }>(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return sendError(res, 'Email sudah terdaftar.', 400);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await runSql(
      `INSERT INTO users (name, email, password_hash, role, profile_photo, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [name, email, passwordHash, role, profile_photo || '', nowStr, nowStr]
    );

    return sendSuccess(res, {}, 'Pengguna baru berhasil ditambahkan.', 201);
  } catch (err) {
    console.error('Error creating user:', err);
    return sendError(res, 'Gagal menambahkan pengguna.', 500);
  }
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return sendError(res, 'Password baru minimal 6 karakter.', 400);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await runSql(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, [passwordHash, nowStr, id]);

    return sendSuccess(res, {}, 'Password berhasil di-reset.');
  } catch (err) {
    console.error('Error resetting password:', err);
    return sendError(res, 'Gagal mereset password.', 500);
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await querySql<Omit<User, 'password_hash'>>(
      `SELECT id, name, email, role, profile_photo, is_active, created_at, updated_at FROM users`
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
