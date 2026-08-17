import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSql, runSql, querySql } from '../config/db.js';
import { User } from '../models/types.js';
import { signToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const { email, password } = parseResult.data;

    const user = await getSql<User>(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return sendError(res, 'Email atau password salah.', 401);
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Email atau password salah.', 401);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      profile_photo: user.profile_photo,
      source_system: (user as any).source_system ?? undefined,
    });

    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      await runSql(
        'INSERT INTO login_logs (user_id, user_name, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [user.id, user.name, String(ip), userAgent]
      );
    } catch (logErr) {
      console.error('Failed to save login log:', logErr);
    }

    const userDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_photo: user.profile_photo,
      is_active: user.is_active === 1,
      created_at: user.created_at,
    };

    return sendSuccess(
      res,
      {
        user: userDto,
        token,
      },
      'Login berhasil'
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return sendError(res, 'Gagal melakukan login.', 500);
  }
}

export async function logout(req: Request, res: Response) {
  return sendSuccess(res, {}, 'Logout berhasil');
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Pengguna tidak terautentikasi.', 401);
    }

    const user = await getSql<User>(
      'SELECT id, name, email, role, is_active, profile_photo, created_at, updated_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!user) {
      return sendError(res, 'Pengguna tidak ditemukan.', 404);
    }

    const userDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile_photo: user.profile_photo,
      is_active: user.is_active === 1,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return sendSuccess(res, { user: userDto });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil data pengguna.', 500);
  }
}

export async function getLoginLogs(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return sendError(res, 'Akses ditolak.', 403);
    }
    const logs = await querySql(
      'SELECT id, user_id, user_name, ip_address, user_agent, login_time FROM login_logs ORDER BY login_time DESC LIMIT 100'
    );
    return sendSuccess(res, logs);
  } catch (err) {
    console.error('Error fetching login logs:', err);
    return sendError(res, 'Gagal mengambil riwayat login.', 500);
  }
}
