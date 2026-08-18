import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import { authMiddleware, roleMiddleware } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import apiV1PaymentRoutes from './routes/api/v1/paymentRoutes.js';
import apiV1InternalMerchantRoutes from './routes/api/v1/internalMerchantRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { autoExpireTransactions } from './controllers/transactionController.js';
import { runSql } from './config/db.js';
import path from 'path';

export async function createApp() {
  const app = express();

  // Initialize DB & Seed Data
  await getDb();

  // Auto-expire: run on startup then every 60 seconds
  autoExpireTransactions().catch(() => {});
  setInterval(() => autoExpireTransactions().catch(() => {}), 60_000);

  // Security & Utility Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Vite SPA scripts in dev
  }));
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  // Internal API v1 Routes that require custom body parsing limits
  app.use('/api/v1/internal-merchants', apiV1InternalMerchantRoutes);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Request Logger — catat semua request ke /api/v1/*
  app.use('/api/v1', (req: any, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
      const apiKeyId = req.apiApp?.id || null;
      const sourceSystem = req.apiApp?.name || null;
      console.log(`[API] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms) src=${sourceSystem || '-'} ip=${ip}`);
      runSql(
        `INSERT INTO api_logs (api_key_id, source_system, method, path, status_code, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
        [apiKeyId, sourceSystem, req.method, req.path, res.statusCode, ip]
      ).catch(() => {});
    });
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/providers', providerRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/settings', settingRoutes);

  app.use('/api/api-keys', authMiddleware, roleMiddleware(['ADMIN', 'IT']), apiKeyRoutes);

  // Other Internal API v1 Routes
  app.use('/api/v1/payments', apiV1PaymentRoutes);

  // Public routes (no auth required — for customer payment page)
  app.use('/api/public', publicRoutes);

  // Serve uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Healthcheck Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      data: { status: 'OK', timestamp: new Date().toISOString() }
    });
  });



  // Global Error Handler (e.g. for malformed JSON)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MALFORMED_JSON',
          message: 'Invalid JSON payload'
        }
      });
    }
    // Pass other errors to the existing errorHandler
    next(err);
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
