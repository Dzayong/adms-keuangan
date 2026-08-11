import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 15;

  const record = loginAttempts.get(ip);

  if (!record) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  if (now - record.firstAttempt > windowMs) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return next();
  }

  record.count += 1;

  if (record.count > maxAttempts) {
    return sendError(
      res,
      'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
      429
    );
  }

  next();
}
