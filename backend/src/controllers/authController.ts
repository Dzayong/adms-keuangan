import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSql } from '../config/db.js';
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
    });

    const userDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
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
      is_active: user.is_active === 1,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return sendSuccess(res, { user: userDto });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil data pengguna.', 500);
  }
}
