import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '3000',
  JWT_SECRET: process.env.JWT_SECRET || 'adms_qris_internal_secret_key_2026_super_secure_jwt',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  DANA_ENVIRONMENT: process.env.DANA_ENVIRONMENT || 'sandbox',
  DANA_X_PARTNER_ID: process.env.DANA_X_PARTNER_ID || '',
  DANA_PRIVATE_KEY: process.env.DANA_PRIVATE_KEY || '',
  DANA_PUBLIC_KEY: process.env.DANA_PUBLIC_KEY || '',
  DANA_MERCHANT_ID: process.env.DANA_MERCHANT_ID || '',
  DANA_EXTERNAL_STORE_ID: process.env.DANA_EXTERNAL_STORE_ID || '',
  DANA_ORIGIN: process.env.DANA_ORIGIN || '',
};
