import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  const errors = process.env.NODE_ENV !== 'production' && err.stack ? [err.stack] : [];

  return sendError(res, message, statusCode, errors);
}
