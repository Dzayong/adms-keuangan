import { PaymentProvider } from './PaymentProvider.js';
import { MockPaymentProvider } from './mock/MockPaymentProvider.js';
import { DanaPaymentProvider } from './dana/DanaPaymentProvider.js';
import { ENV } from '../config/env.js';
import { getSql, querySql } from '../config/db.js';

export async function getActivePaymentProvider(): Promise<PaymentProvider> {
  const code = ENV.PAYMENT_PROVIDER || 'mock';
  return getPaymentProviderByCode(code);
}

export async function getPaymentProviderByCode(code: string): Promise<PaymentProvider> {
  if (code === 'dana') {
    const settings = await querySql<{key: string, value: string}>('SELECT key, value FROM settings WHERE key LIKE "dana_%"');
    const danaConfig = settings.reduce((acc, row) => ({...acc, [row.key]: row.value}), {} as any);

    return new DanaPaymentProvider(
      danaConfig.dana_client_id || ENV.DANA_CLIENT_ID,
      danaConfig.dana_client_secret || ENV.DANA_CLIENT_SECRET,
      danaConfig.dana_environment || ENV.DANA_ENVIRONMENT
    );
  }

  if (code === 'mock') {
    return new MockPaymentProvider();
  }

  throw new Error(`Invalid payment provider configuration: ${code}`);
}

export * from './PaymentProvider.js';
