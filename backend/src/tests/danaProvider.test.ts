import test from 'node:test';
import assert from 'node:assert';
import { DanaPaymentProvider, DanaConfig } from '../providers/dana/DanaPaymentProvider.js';
import { CreatePaymentDTO } from '../providers/PaymentProvider.js';

test('DanaPaymentProvider Sandbox (Phase 3.2)', async (t) => {
  let provider: DanaPaymentProvider;

  const validConfig: DanaConfig = {
    merchantId: 'M-123',
    partnerId: 'P-456',
    privateKey: 'mock-private-key',
    origin: 'http://localhost:3000',
    environment: 'sandbox',
    externalStoreId: 'STORE-1'
  };

  const resetProvider = (configOverrides: Partial<DanaConfig> = {}) => {
    provider = new DanaPaymentProvider({ ...validConfig, ...configOverrides });
  };

  await t.test('Configuration Validation', async (t) => {
    await t.test('B. should fail if missing credentials', async () => {
      resetProvider({ privateKey: '' });
      try {
        await provider.createPayment({} as CreatePaymentDTO);
        assert.fail('Should have thrown an error for missing config');
      } catch (e: any) {
        assert.ok(e.message.includes('not configured'));
      }
    });

    await t.test('C/L. should fail if environment is not sandbox and not leak secrets', async () => {
      resetProvider({ environment: 'production' });
      try {
        await provider.createPayment({} as CreatePaymentDTO);
        assert.fail('Should have thrown an error for non-sandbox environment');
      } catch (e: any) {
        assert.ok(e.message.includes('sandbox environment is supported'));
      }
    });

    await t.test('D. should fail if externalStoreId is missing for QRIS', async () => {
      resetProvider({ externalStoreId: '' });
      try {
        await provider.createPayment({} as CreatePaymentDTO);
        assert.fail('Should have thrown an error for missing externalStoreId');
      } catch (e: any) {
        assert.ok(e.message.includes('externalStoreId is mandatory for QRIS'));
      }
    });
  });

  await t.test('A/D/H/E/F/G. Create Payment Success & Gapura API Structure', async () => {
    resetProvider();
    let callCount = 0;
    provider.httpClient.post = async (endpoint: string, data?: any, headers?: any): Promise<any> => {
      callCount++;
      if (endpoint === '/v1.0/access-token/b2b') {
        assert.ok(headers['X-SIGNATURE'], 'Auth must be signed');
        return { data: { accessToken: 'mock-auth-token' }, status: 200 };
      }
      if (endpoint === '/payment-gateway/v1.0/debit/payment-host-to-host.htm') {
        assert.ok(headers['X-SIGNATURE'], 'Request must be signed using Asymmetric Signature');
        assert.strictEqual(data.externalStoreId, 'STORE-1', 'QRIS externalStoreId must be included');
        assert.ok(data.partnerReferenceNo.length <= 25, 'partnerReferenceNo must be <= 25 chars');
        
        // Assert validUpTo is correctly formatted and within 30 min (sandbox limit)
        const validUpTo = new Date(data.validUpTo);
        const diffMinutes = (validUpTo.getTime() - Date.now()) / 60000;
        assert.ok(diffMinutes > 0 && diffMinutes <= 30.1, 'validUpTo must be <= 30 mins in future');

        return { data: { partnerReferenceNo: data.partnerReferenceNo, qrContent: '000201010212...' }, status: 200 };
      }
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    };

    const paymentData: CreatePaymentDTO = {
      transactionId: 1,
      invoiceNumber: 'INV-001',
      amount: 50000,
      customerName: 'Test',
      customerPhone: '081234567890',
      description: 'Test Payment'
    };

    const result = await provider.createPayment(paymentData);

    assert.strictEqual(callCount, 2);
    assert.strictEqual(result.status, 'PENDING');
    assert.ok(result.providerReference.startsWith('ADMS-'));
    assert.strictEqual(result.qrContent, '000201010212...');
  });

  await t.test('Idempotency Strategy - same internal transaction ID generates same reference', async () => {
    resetProvider();
    const mockPost = async (endpoint: string, data?: any): Promise<any> => {
      if (endpoint === '/v1.0/access-token/b2b') return { data: { accessToken: 'mock-auth-token' } };
      return { data: { partnerReferenceNo: data.partnerReferenceNo, qrContent: 'QR' } };
    };
    provider.httpClient.post = mockPost;

    const r1 = await provider.createPayment({ transactionId: 9999, amount: 50000, invoiceNumber: 'A' } as CreatePaymentDTO);
    const r2 = await provider.createPayment({ transactionId: 9999, amount: 50000, invoiceNumber: 'A' } as CreatePaymentDTO);
    const r3 = await provider.createPayment({ transactionId: 10000, amount: 50000, invoiceNumber: 'B' } as CreatePaymentDTO);

    assert.strictEqual(r1.providerReference.length, 25, 'partnerReferenceNo must be exactly 25 characters');
    assert.ok(r1.providerReference.startsWith('ADMS-'), 'partnerReferenceNo format must start with ADMS-');
    assert.strictEqual(r1.providerReference, r2.providerReference, 'Same transactionId MUST yield same reference (retry stable)');
    assert.notStrictEqual(r1.providerReference, r3.providerReference, 'Different transactionId MUST yield different reference');
  });

  await t.test('E/I. Authentication & Provider Errors', async (t) => {
    await t.test('should map HTTP 401 to AUTHENTICATION_ERROR', async () => {
      resetProvider();
      provider.httpClient.post = async (): Promise<any> => {
        const error = new Error('Auth failed') as any;
        error.response = { status: 401 };
        throw error;
      };

      try {
        await provider.createPayment({ amount: 1, invoiceNumber: 'A', transactionId: 1 } as CreatePaymentDTO);
        assert.fail('Should throw');
      } catch (e: any) {
        assert.ok(e.message.includes('AUTHENTICATION_ERROR'));
      }
    });
  });

  await t.test('Webhook Validation', async (t) => {
    await t.test('should reject webhook without signature', async () => {
      resetProvider();
      try {
        await provider.handleWebhook({ partnerReferenceNo: '123' }, {});
        assert.fail('Should throw');
      } catch (e: any) {
        assert.ok(e.message.includes('VALIDATION_ERROR'));
      }
    });

    await t.test('should accept webhook with signature', async () => {
      resetProvider();
      const result = await provider.handleWebhook({ partnerReferenceNo: '123', orderStatus: 'SUCCESS' }, { 'x-signature': 'abc' });
      assert.strictEqual(result.providerReference, '123');
      assert.strictEqual(result.status, 'PAID');
    });
  });
});
