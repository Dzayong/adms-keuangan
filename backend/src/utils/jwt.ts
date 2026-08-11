import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { JwtPayload } from '../models/types.js';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
