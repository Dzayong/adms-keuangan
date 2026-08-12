import { test } from 'node:test';
import assert from 'node:assert';
import { getPaymentProviderByCode } from '../providers/index.js';
import { MockPaymentProvider } from '../providers/mock/MockPaymentProvider.js';
import { createPaymentService } from '../services/paymentService.js';
import { runSql, getSql } from '../config/db.js';
import { ENV } from '../config/env.js';

test('Provider Abstraction Test Suite', async (t) => {
  await t.test('A. Mock provider can be instantiated', async () => {
    const provider = new MockPaymentProvider();
    assert.strictEqual(provider.code, 'mock');
    assert.strictEqual(provider.name, 'Mock QRIS');
  });

  await t.test('B. Mock provider conforms to the provider contract', async () => {
    const provider = new MockPaymentProvider();
    assert.ok(typeof provider.createPayment === 'function');
    assert.ok(typeof provider.checkPayment === 'function');
    assert.ok(typeof provider.cancelPayment === 'function');
    assert.ok(typeof provider.refundPayment === 'function');
    assert.ok(typeof provider.handleWebhook === 'function');

    const result = await provider.createPayment({
      transactionId: 999,
      invoiceNumber: 'INV-TEST-123',
      amount: 10000,
      customerName: 'Test User',
      customerPhone: '081234567890',
      description: 'Test Payment'
    });
    
    assert.strictEqual(result.providerId, 1);
    assert.strictEqual(result.paymentMethod, 'QRIS');
    assert.strictEqual(result.status, 'PENDING');
    assert.ok(result.providerReference.startsWith('MOCK-REF-'));
    assert.ok(result.qrContent.length > 0);
  });

  await t.test('C & E. PaymentService can use the provider and existing payment creation works', async () => {
    // We can rely on default environment to be 'mock'
    assert.strictEqual(ENV.PAYMENT_PROVIDER, 'mock');
    
    const payment = await createPaymentService({
      amount: 50000,
      customerName: 'Service Test User',
      customerPhone: '089999999',
      description: 'Test via service',
      userId: 1
    });

    assert.strictEqual(payment.data.status, 'PENDING');
    assert.strictEqual(payment.data.amount, 50000);
    assert.ok(payment.data.providerReference.startsWith('MOCK-REF-'));
    assert.ok(payment.data.qrContent.length > 0);
  });

  await t.test('D. Provider selection works for the mock provider', async () => {
    const provider = await getPaymentProviderByCode('mock');
    assert.ok(provider instanceof MockPaymentProvider);
  });

  await t.test('I. Invalid provider configuration fails safely', async () => {
    try {
      await getPaymentProviderByCode('non-existent');
      assert.fail('Should have thrown an error for invalid provider');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Invalid payment provider configuration: non-existent');
    }
  });

  await t.test('H. No real provider credentials are required', async () => {
    assert.strictEqual(ENV.DANA_X_PARTNER_ID, '');
    assert.strictEqual(ENV.DANA_PRIVATE_KEY, '');
  });

  await t.test('J. Same idempotency key + same payload still works', async () => {
    const idempotencyKey = `IDEM-KEY-${Date.now()}`;
    const payload = {
      amount: 100000,
      customerName: 'Idempotency User',
      customerPhone: '0811111111',
      description: 'Idem test',
      userId: 1,
      idempotencyKey
    };

    const first = await createPaymentService(payload);
    assert.strictEqual(first.isIdempotent, false);

    const second = await createPaymentService(payload);
    assert.strictEqual(second.isIdempotent, true);
    assert.strictEqual(first.data.paymentId, second.data.paymentId);
  });

  await t.test('K. Same idempotency key + different payload still returns 409', async () => {
    const idempotencyKey = `IDEM-KEY-DIFF-${Date.now()}`;
    const payload = {
      amount: 200000,
      customerName: 'Diff User',
      customerPhone: '0822222222',
      description: 'Diff test',
      userId: 1,
      idempotencyKey
    };

    await createPaymentService(payload);

    try {
      await createPaymentService({ ...payload, amount: 200001 });
      assert.fail('Should have thrown IdempotencyConflictError');
    } catch (err: any) {
      assert.strictEqual(err.name, 'IdempotencyConflictError');
    }
  });

  await t.test('L. Existing payment state machine still works', async () => {
    const { getPaymentDetailService } = await import('../services/paymentService.js');
    const payment = await createPaymentService({
      amount: 77777,
      customerName: 'State Machine User',
      userId: 1
    });

    const detail = await getPaymentDetailService(payment.data.transactionId);
    assert.ok(detail);
    assert.strictEqual(detail.transaction.status, 'PENDING');
  });
});
