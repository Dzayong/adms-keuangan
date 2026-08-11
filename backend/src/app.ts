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
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/settings', settingRoutes);

  // Healthcheck Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'ADMS QRIS INTERNAL',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
