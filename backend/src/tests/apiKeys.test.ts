import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDb, querySql, runSql } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import bcrypt from 'bcryptjs';

describe('Phase 3.5 - API Key Management & Internal App Integration', async () => {
  let app: any;
  let adminToken: string;
  let defaultApiKey: string;
  let newApiId: number;
  let newApiKeyPlaintext: string;

  before(async () => {
    app = await createApp();
    const db = await getDb();

    // 1. Get an Admin Token for dashboard auth
    adminToken = jwt.sign(
      { id: 1, email: 'admin@admsqris.local', role: 'ADMIN' },
      ENV.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    // 2. Find the default API key hash and regenerate it so we know the plaintext for tests.
    // In the real DB it's randomly generated, but since this is a test environment we can just inject a known key.
    defaultApiKey = 'adms_sk_test_default_test_key_123';
    const keyHash = bcrypt.hashSync(defaultApiKey, 10);
    
    // We update the existing Default Internal Application so we don't break other tests that might rely on its ID.
    await runSql("UPDATE api_keys SET key_hash = ?, key_hint = 'adms_sk_test_••••••••••••_123' WHERE name = 'Default Internal Application'", [keyHash]);
  });

  test('A. Default Internal Application key still works (Backward Compatibility)', async () => {
    const res = await request(app)
      .get('/api/v1/payments/1') // Assuming payment ID 1 exists from seed
      .set('X-API-Key', defaultApiKey);
    
    assert.notStrictEqual(res.status, 401);
  });

  test('B. Create new API Key via Dashboard', async () => {
    const res = await request(app)
      .post('/api/api-keys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Hosting App' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    
    const data = res.body.data;
    assert.ok(data.id);
    assert.ok(data.key.startsWith('adms_sk_test_'));
    assert.strictEqual(data.key_hint, `adms_sk_test_••••••••••••${data.key.slice(-4)}`);
    assert.ok(!data.key_hash);

    newApiId = data.id;
    newApiKeyPlaintext = data.key;
  });

  test('C. New API Key works with X-API-Key', async () => {
    const res = await request(app)
      .get('/api/v1/payments/1')
      .set('X-API-Key', newApiKeyPlaintext);

    assert.notStrictEqual(res.status, 401);
  });

  test('D. List API Keys does not leak plaintext or key_hash', async () => {
    const res = await request(app)
      .get('/api/api-keys')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    const data = res.body.data;
    
    const testKey = data.find((k: any) => k.id === newApiId);
    assert.ok(testKey);
    assert.strictEqual(testKey.key_hint.includes('••••••••••••'), true);
    assert.strictEqual(testKey.key, undefined);
    assert.strictEqual(testKey.key_hash, undefined);
  });

  test('E. Revoke API Key via Dashboard', async () => {
    const res = await request(app)
      .post(`/api/api-keys/${newApiId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Verify status is updated in list
    const listRes = await request(app)
      .get('/api/api-keys')
      .set('Authorization', `Bearer ${adminToken}`);
    const revokedKey = listRes.body.data.find((k: any) => k.id === newApiId);
    assert.strictEqual(revokedKey.status, 'REVOKED');
  });

  test('F. Revoked API Key returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/payments/1')
      .set('X-API-Key', newApiKeyPlaintext);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('G. Invalid API Key returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/payments/1')
      .set('X-API-Key', 'invalid_key_123');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('H. Payment API and Idempotency still work (Internal QRIS)', async () => {
    const payload = {
      customerName: 'Test Idempotency',
      amount: 15000,
      providerCode: 'internal_qris'
    };

    const res1 = await request(app)
      .post('/api/v1/payments')
      .set('X-API-Key', defaultApiKey)
      .set('X-Idempotency-Key', 'idem-test-123')
      .send(payload);

    assert.strictEqual(res1.status, 201);

    const res2 = await request(app)
      .post('/api/v1/payments')
      .set('X-API-Key', defaultApiKey)
      .set('X-Idempotency-Key', 'idem-test-123')
      .send(payload);

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res1.body.data.paymentId, res2.body.data.paymentId);
  });

  test('I. Mock provider still works', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('X-API-Key', defaultApiKey)
      .set('X-Idempotency-Key', 'mock-idem-123')
      .send({
        customerName: 'Mock Provider Test',
        amount: 25000,
        providerCode: 'mock'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.providerReference.startsWith('MOCK'), true);
  });
});
