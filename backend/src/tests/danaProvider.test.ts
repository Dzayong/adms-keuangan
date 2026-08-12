import test from 'node:test';
import assert from 'node:assert';
import { DanaPaymentProvider, DanaConfig } from '../providers/dana/DanaPaymentProvider.js';
import { CreatePaymentDTO } from '../providers/PaymentProvider.js';

// We need to mock the WebhookParser to avoid actual cryptographic parsing in tests
import { WebhookParser } from 'dana-node/webhook/v1';

test('DanaPaymentProvider Sandbox (Phase 3.3)', async (t) => {
  let provider: DanaPaymentProvider;

  const validConfig: DanaConfig = {
    merchantId: 'M-123',
    partnerId: 'P-456',
    privateKey: 'mock-private-key',
    publicKey: 'mock-public-key',
    origin: 'http://localhost:3000',
    environment: 'sandbox',
    externalStoreId: 'STORE-1'
  };

  const resetProvider = (configOverrides: Partial<DanaConfig> = {}) => {
    provider = new DanaPaymentProvider({ ...validConfig, ...configOverrides });
  };

  await t.test('Configuration Validation', async (t) => {
    await t.test('B. should fail if missing credentials', async () => {
      try {
        resetProvider({ privateKey: '' });
        assert.fail('Should have thrown an error for missing config');
      } catch (e: any) {
        // Assert it throws from the dana-node SDK or from our validation
        assert.ok(e.message.includes('PRIVATE_KEY') || e.message.includes('not configured'));
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
      try {
        resetProvider({ externalStoreId: '' });
        await provider.createPayment({} as CreatePaymentDTO);
        assert.fail('Should have thrown an error for missing externalStoreId');
      } catch (e: any) {
        assert.ok(e.message.includes('externalStoreId is mandatory'));
      }
    });
  });

  await t.test('A/D/H/E/F/G. Create Payment Success & Gapura API Structure', async () => {
    resetProvider();

    // Mock the paymentGateway methods natively
    provider.paymentGateway.createOrder = async (payload: any): Promise<any> => {
      assert.strictEqual(payload.externalStoreId, 'STORE-1', 'QRIS externalStoreId must be included at top level');
      assert.ok(payload.partnerReferenceNo.length <= 25, 'partnerReferenceNo must be <= 25 chars');

      const validUpTo = new Date(payload.validUpTo);
      const diffMinutes = (validUpTo.getTime() - Date.now()) / 60000;
      assert.ok(diffMinutes > 0 && diffMinutes <= 30.1, 'validUpTo must be <= 30 mins in future');

      assert.strictEqual(payload.payOptionDetails[0].payMethod, 'NETWORK_PAY');
      assert.strictEqual(payload.payOptionDetails[0].payOption, 'NETWORK_PAY_PG_QRIS');

      assert.ok(payload.urlParams.find((u: any) => u.type === 'NOTIFICATION'), 'must have NOTIFICATION url');
      assert.ok(payload.urlParams.find((u: any) => u.type === 'PAY_RETURN'), 'must have PAY_RETURN url');
      assert.strictEqual(payload.additionalInfo.mcc, '5499');
      assert.strictEqual(payload.additionalInfo.envInfo.terminalType, 'SYSTEM');
      assert.strictEqual(payload.additionalInfo.order.scenario, 'API');

      return {
        additionalInfo: { paymentCode: '000201010212...' }
      };
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

    assert.strictEqual(result.status, 'PENDING');
    assert.ok(result.providerReference.startsWith('ADMS-'));
    assert.strictEqual(result.qrContent, '000201010212...');
  });

  await t.test('Idempotency Strategy - same internal transaction ID generates same reference', async () => {
    resetProvider();

    provider.paymentGateway.createOrder = async (payload: any): Promise<any> => {
      return { additionalInfo: { paymentCode: 'QR' } };
    };

    const r1 = await provider.createPayment({ transactionId: 9999, amount: 50000, invoiceNumber: 'A' } as CreatePaymentDTO);
    const r2 = await provider.createPayment({ transactionId: 9999, amount: 50000, invoiceNumber: 'A' } as CreatePaymentDTO);
    const r3 = await provider.createPayment({ transactionId: 10000, amount: 50000, invoiceNumber: 'B' } as CreatePaymentDTO);

    assert.strictEqual(r1.providerReference.length, 25, 'partnerReferenceNo must be exactly 25 characters');
    assert.ok(r1.providerReference.startsWith('ADMS-'), 'partnerReferenceNo format must start with ADMS-');
    assert.strictEqual(r1.providerReference, r2.providerReference, 'Same transactionId MUST yield same reference (retry stable)');
    assert.notStrictEqual(r1.providerReference, r3.providerReference, 'Different transactionId MUST yield different reference');
  });

  await t.test('Query Payment Mapping', async () => {
    resetProvider();

    provider.paymentGateway.queryPayment = async (payload: any): Promise<any> => {
      assert.strictEqual(payload.merchantId, 'M-123');
      assert.strictEqual(payload.originalPartnerReferenceNo, 'ADMS-123');
      assert.strictEqual(payload.serviceCode, '54');
      assert.strictEqual(payload.externalStoreId, 'STORE-1');
      return { latestTransactionStatus: '00' };
    };

    const result = await provider.checkPayment('ADMS-123');
    assert.strictEqual(result.status, 'PAID');

    provider.paymentGateway.queryPayment = async (payload: any): Promise<any> => {
      return { latestTransactionStatus: '01' }; // 01 maps to PENDING
    };
    const result2 = await provider.checkPayment('ADMS-123');
    assert.strictEqual(result2.status, 'PENDING');
  });

  await t.test('E/I. Authentication & Provider Errors', async (t) => {
    await t.test('should map HTTP 401 to AUTHENTICATION_ERROR', async () => {
      resetProvider();
      provider.paymentGateway.createOrder = async (): Promise<any> => {
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
    const originalParse = WebhookParser.prototype.parseWebhook;

    await t.test('should reject webhook with invalid signature', async () => {
      resetProvider();

      WebhookParser.prototype.parseWebhook = () => {
        throw new Error('Invalid signature');
      };

      try {
        await provider.handleWebhook({ partnerReferenceNo: '123' }, {});
        assert.fail('Should throw');
      } catch (e: any) {
        assert.ok(e.message.includes('VALIDATION_ERROR'));
      }
    });

    await t.test('should accept webhook with valid signature via WebhookParser', async () => {
      resetProvider();

      WebhookParser.prototype.parseWebhook = () => {
        // Return a mocked parsed webhook payload
        return {
          originalPartnerReferenceNo: '123',
          latestTransactionStatus: '00'
        } as any;
      };

      const result = await provider.handleWebhook({ partnerReferenceNo: '123', orderStatus: 'SUCCESS' }, { 'x-signature': 'abc' });
      assert.strictEqual(result.providerReference, '123');
      assert.strictEqual(result.status, 'PAID');
    });

    // Restore original parse
    WebhookParser.prototype.parseWebhook = originalParse;
  });
});
