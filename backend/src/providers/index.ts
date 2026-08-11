import { PaymentProvider } from './PaymentProvider.js';
import { MockPaymentProvider } from './mock/MockPaymentProvider.js';
import { DanaPaymentProvider } from './dana/DanaPaymentProvider.js';
import { ENV } from '../config/env.js';

export function getPaymentProvider(code?: string): PaymentProvider {
  const providerCode = code || ENV.PAYMENT_PROVIDER || 'mock';

  if (providerCode === 'dana') {
    return new DanaPaymentProvider(
      ENV.DANA_CLIENT_ID,
      ENV.DANA_CLIENT_SECRET,
      ENV.DANA_ENVIRONMENT
    );
  }

  return new MockPaymentProvider();
}

export * from './PaymentProvider.js';
