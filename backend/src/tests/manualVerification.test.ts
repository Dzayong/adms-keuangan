import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../app.js';
import { runSql, getSql } from '../config/db.js';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

function generateDevToken(userId: number, role: string) {
  return jwt.sign(
    { userId, email: `test${userId}@admsqris.local`, role, name: `Test ${role}` },
    ENV.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );
}

describe('Manual Verification (Real Static QRIS)', () => {
  let app: any;
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string; // we will use a viewer user
  let txId: number;
  let mockTxId: number;
  let expiredTxId: number;
  let providerId: number;
  let mockProviderId: number;

  before(async () => {
    app = await createApp();
    adminToken = generateDevToken(1, 'ADMIN');
    operatorToken = generateDevToken(2, 'OPERATOR');
    viewerToken = generateDevToken(3, 'VIEWER');

    // Create a VIEWER user
    await runSql(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role, is_active) VALUES (3, 'Viewer', 'viewer@admsqris.local', 'hash', 'VIEWER', 1)`);

    // Ensure internal_qris provider exists
    const internalProv = await getSql<{ id: number }>('SELECT id FROM payment_providers WHERE code = ?', ['internal_qris']);
    providerId = internalProv?.id || 3;

    const mockProv = await getSql<{ id: number }>('SELECT id FROM payment_providers WHERE code = ?', ['mock']);
    mockProviderId = mockProv?.id || 1;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Create PENDING internal_qris transaction
    const resTx1 = await runSql(`
      INSERT INTO transactions (invoice_number, customer_name, amount, status, expired_at, created_by, created_at)
      VALUES ('INV-TEST-VERIFY-001', 'Test User', 50000, 'PENDING', datetime('now', '+15 minutes', 'localtime'), 1, ?)
    `, [nowStr]);
    txId = resTx1.lastInsertRowid;
    await runSql(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, created_at)
      VALUES (?, ?, 'INTERNAL-REF-001', 'QRIS_RAW_DATA', 'STATIC_QRIS', 'PENDING', ?)
    `, [txId, providerId, nowStr]);

    // Create PENDING mock transaction
    const resTx2 = await runSql(`
      INSERT INTO transactions (invoice_number, customer_name, amount, status, expired_at, created_by, created_at)
      VALUES ('INV-TEST-VERIFY-002', 'Test User 2', 50000, 'PENDING', datetime('now', '+15 minutes', 'localtime'), 1, ?)
    `, [nowStr]);
    mockTxId = resTx2.lastInsertRowid;
    await runSql(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, created_at)
      VALUES (?, ?, 'MOCK-REF-002', 'QRIS_RAW_DATA', 'QRIS', 'PENDING', ?)
    `, [mockTxId, mockProviderId, nowStr]);

    // Create EXPIRED internal_qris transaction
    const resTx3 = await runSql(`
      INSERT INTO transactions (invoice_number, customer_name, amount, status, expired_at, created_by, created_at)
      VALUES ('INV-TEST-VERIFY-003', 'Test User 3', 50000, 'EXPIRED', datetime('now', '-15 minutes', 'localtime'), 1, ?)
    `, [nowStr]);
    expiredTxId = resTx3.lastInsertRowid;
    await runSql(`
      INSERT INTO payments (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, created_at)
      VALUES (?, ?, 'INTERNAL-REF-003', 'QRIS_RAW_DATA', 'STATIC_QRIS', 'EXPIRED', ?)
    `, [expiredTxId, providerId, nowStr]);
  });

  after(async () => {
    // cleanup
    await runSql(`DELETE FROM payment_logs WHERE payment_id IN (SELECT id FROM payments WHERE transaction_id IN (?, ?, ?))`, [txId, mockTxId, expiredTxId]);
    await runSql(`DELETE FROM payments WHERE transaction_id IN (?, ?, ?)`, [txId, mockTxId, expiredTxId]);
    await runSql(`DELETE FROM transactions WHERE id IN (?, ?, ?)`, [txId, mockTxId, expiredTxId]);
    await runSql(`DELETE FROM users WHERE id = 3`);
  });

  test('POST /api/payments/:id/verify - Viewer should be rejected (403)', async () => {
    const res = await request(app)
      .post(`/api/payments/${txId}/verify`)
      .set('Authorization', `Bearer ${viewerToken}`);
    
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/payments/:id/verify - Unauthenticated should be rejected (401)', async () => {
    const res = await request(app)
      .post(`/api/payments/${txId}/verify`);
    
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/payments/:id/verify - Cannot verify mock provider payment', async () => {
    const res = await request(app)
      .post(`/api/payments/${mockTxId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /tidak mendukung verifikasi manual/i);
  });

  test('POST /api/payments/:id/verify - Cannot verify expired payment', async () => {
    const res = await request(app)
      .post(`/api/payments/${expiredTxId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /transisi status/i);
  });

  test('POST /api/payments/:id/verify - Admin can verify pending internal_qris payment successfully', async () => {
    const res = await request(app)
      .post(`/api/payments/${txId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'PAID');

    // Verify DB
    const tx = await getSql<{ status: string }>('SELECT status FROM transactions WHERE id = ?', [txId]);
    assert.strictEqual(tx?.status, 'PAID');

    const payment = await getSql<{ status: string, id: number }>('SELECT id, status FROM payments WHERE transaction_id = ?', [txId]);
    assert.strictEqual(payment?.status, 'PAID');

    const logs = await getSql<{ event_type: string, payload: string }>(
      'SELECT event_type, payload FROM payment_logs WHERE payment_id = ? AND event_type = ?', 
      [payment?.id, 'MANUAL_STATIC_QRIS']
    );
    assert.ok(logs);
    
    const payload = JSON.parse(logs.payload);
    assert.strictEqual(payload.verifiedBy, 1); // Admin ID
    assert.strictEqual(payload.previousStatus, 'PENDING');
    assert.strictEqual(payload.newStatus, 'PAID');
  });

  test('POST /api/payments/:id/verify - Cannot verify payment that is already PAID (Idempotent/Double click check)', async () => {
    // txId is now PAID
    const res = await request(app)
      .post(`/api/payments/${txId}/verify`)
      .set('Authorization', `Bearer ${operatorToken}`);
    
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /transisi status/i);
  });

  describe('Dashboard Create Payment Endpoint (paymentController)', () => {
    test('A. providerCode = "mock" menghasilkan Mock QRIS', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 10000,
          customerName: 'Mock User',
          providerCode: 'mock'
        });
      
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.paymentMethod, 'QRIS');
      assert.ok(res.body.data.providerReference.startsWith('MOCK-REF-'));
      // Wait, is it providerReference or transactionId? In dashboard, the response might be { success: true, data: { transactionId: ... } }
      // We should check the DB directly to ensure correct fields.
      const txId = res.body.data.transactionId;
      const payment = await getSql<{ provider_reference: string, payment_method: string, qr_content: string }>('SELECT provider_reference, payment_method, qr_content FROM payments WHERE transaction_id = ?', [txId]);
      assert.ok(payment?.provider_reference.startsWith('MOCK-REF-'));
      assert.strictEqual(payment?.payment_method, 'QRIS');
    });

    test('B. providerCode = "internal_qris" menghasilkan Internal Office QRIS', async () => {
      // Setup the internal merchant first
      await runSql(`UPDATE internal_merchants SET name = 'Test Merchant', nmid = 'ID1025438297117', qris_image_path = '/uploads/test.png', is_active = 1 WHERE nmid = 'ID1025438297117'`);

      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 20000,
          customerName: 'Internal User',
          providerCode: 'internal_qris'
        });
      
      assert.strictEqual(res.status, 201);
      const txId = res.body.data.transactionId;
      const payment = await getSql<{ provider_reference: string, payment_method: string, qr_content: string }>('SELECT provider_reference, payment_method, qr_content FROM payments WHERE transaction_id = ?', [txId]);
      
      assert.ok(payment?.provider_reference.startsWith('INTERNAL-'));
      assert.strictEqual(payment?.payment_method, 'STATIC_QRIS');
      assert.strictEqual(payment?.qr_content, '/uploads/test.png');
    });

    test('C. Request tanpa providerCode tetap menggunakan provider default (mock)', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 30000,
          customerName: 'Default User'
        });
      
      assert.strictEqual(res.status, 201);
      const txId = res.body.data.transactionId;
      const payment = await getSql<{ provider_reference: string, payment_method: string }>('SELECT provider_reference, payment_method FROM payments WHERE transaction_id = ?', [txId]);
      
      assert.ok(payment?.provider_reference.startsWith('MOCK-REF-'));
    });

    test('D. providerCode tidak valid/disabled ditolak', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 40000,
          customerName: 'Invalid User',
          providerCode: 'invalid_provider_code'
        });
      
      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Provider dengan kode/i);
    });
  });

});
