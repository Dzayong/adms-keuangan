import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getDb } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import apiV1PaymentRoutes from './routes/api/v1/paymentRoutes.js';

export async function createApp() {
  const app = express();

  // Initialize DB & Seed Data
  await getDb();

  // Security & Utility Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Vite SPA scripts in dev
  }));
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/providers', providerRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/settings', settingRoutes);

  // Internal API v1 Routes
  app.use('/api/v1/payments', apiV1PaymentRoutes);

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
