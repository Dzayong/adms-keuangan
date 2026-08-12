import { PaymentProvider } from './PaymentProvider.js';
import { MockPaymentProvider } from './mock/MockPaymentProvider.js';
import { DanaPaymentProvider, DanaConfig } from './dana/DanaPaymentProvider.js';
import { InternalOfficeQrisProvider } from './internal/InternalOfficeQrisProvider.js';
import { ENV } from '../config/env.js';

export async function getActivePaymentProvider(): Promise<PaymentProvider> {
  const code = ENV.PAYMENT_PROVIDER || 'mock';
  return getPaymentProviderByCode(code);
}

export async function getPaymentProviderByCode(code: string): Promise<PaymentProvider> {
  if (code === 'dana') {
    // DANA credentials are never stored in the database.
    // They are injected purely via environment variables.
    const config: DanaConfig = {
      merchantId: process.env.DANA_MERCHANT_ID || '',
      partnerId: process.env.DANA_X_PARTNER_ID || '',
      privateKey: process.env.DANA_PRIVATE_KEY || '',
      publicKey: process.env.DANA_PUBLIC_KEY || '',
      origin: process.env.DANA_ORIGIN || '',
      environment: process.env.DANA_ENVIRONMENT || 'sandbox',
      externalStoreId: process.env.DANA_EXTERNAL_STORE_ID || ''
    };

    return new DanaPaymentProvider(config);
  }

  if (code === 'mock') {
    return new MockPaymentProvider();
  }

  if (code === 'internal_qris') {
    return new InternalOfficeQrisProvider();
  }

  throw new Error(`Invalid payment provider configuration: ${code}`);
}

export * from './PaymentProvider.js';
