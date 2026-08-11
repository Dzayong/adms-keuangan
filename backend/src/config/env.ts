import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '3000',
  JWT_SECRET: process.env.JWT_SECRET || 'adms_qris_internal_secret_key_2026_super_secure_jwt',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  DANA_CLIENT_ID: process.env.DANA_CLIENT_ID || '',
  DANA_CLIENT_SECRET: process.env.DANA_CLIENT_SECRET || '',
  DANA_ENVIRONMENT: process.env.DANA_ENVIRONMENT || 'sandbox',
};
