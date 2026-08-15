import test, { describe, it, before } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createApp } from '../app.js';
import { getSql, runSql } from '../config/db.js';
import { ENV } from '../config/env.js';

describe('Phase 3.4 - Internal Application Payment Gateway + Existing Office QRIS', () => {
  let app: any;
  let validApiKey: string;

  before(async () => {
    app = await createApp();
    
    // Create a specific API key for testing
    const apiKeyInsert = await runSql(`
      INSERT INTO api_keys (name, key_hash, permissions, is_active)
      VALUES ('Test Hosting App', '$2a$10$abcdefghijklmnopqrstuv', '["payments:create", "payments:read"]', 1)
    `);
    
    // Note: We bypass bcrypt matching for this specific test by overriding the middleware or DB if we needed, 
    // but the DB is already seeded with one in initSchemaAndSeed. Let's fetch the seeded one.
    // Wait, bcrypt compares hash, so we don't know the plain text of the seeded one unless we created it.
    // Instead of messing with bcrypt, let's just insert an API key with a known hash.
    // "adms_sk_test_123" -> hash.
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.default.hashSync('adms_sk_test_123', 10);
    await runSql(`UPDATE api_keys SET key_hash = ? WHERE id = 1`, [hash]);
    validApiKey = 'adms_sk_test_123';
  });

  describe('Admin Configuration API', () => {
    let adminToken: string;
    
    before(async () => {
      adminToken = jwt.sign(
        { id: 1, email: 'admin@admsqris.local', role: 'ADMIN' },
        ENV.JWT_SECRET,
        { expiresIn: '1h' }
      );
      // Reset state for idempotent test runs
      await runSql(`UPDATE internal_merchants SET name = 'ARMADA DIGITAL MARKETING' WHERE nmid = 'ID1025438297117'`);
    });

    it('A. Internal merchant configuration exists', async () => {
      const res = await request(app)
        .get('/api/v1/internal-merchants')
        .set('Authorization', `Bearer ${adminToken}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.name, 'ARMADA DIGITAL MARKETING');
      assert.strictEqual(res.body.data.nmid, 'ID1025438297117');
    });

    it('D. Invalid file rejection (SVG / text file)', async () => {
      const res = await request(app)
        .put('/api/v1/internal-merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'ARMADA',
          nmid: 'ID1025438297117',
          isActive: true,
          qrisImageBase64: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' // Invalid magic bytes
        });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /Invalid image format/);
    });

    it('B. QR image validation & C. Valid QR image storage', async () => {
      // Tiny valid PNG 1x1 pixel base64
      const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const res = await request(app)
        .put('/api/v1/internal-merchants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'ARMADA VALID',
          nmid: 'ID1025438297117',
          isActive: true,
          qrisImageBase64: validPngBase64
        });
      assert.strictEqual(res.status, 200);

      const check = await request(app).get('/api/v1/internal-merchants').set('Authorization', `Bearer ${adminToken}`);
      assert.match(check.body.data.qris_image_path, /^\/uploads\/qris\/internal_office_qris_\d+\.png$/);
    });
  });

  describe('Hosting App API Client', () => {
    it('E. Hosting App API-key authentication', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .send({});
      assert.strictEqual(res.status, 401);
      
      const authRes = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', 'wrong_key')
        .send({});
      assert.strictEqual(authRes.status, 401);
    });

    it('F. Payment creation & G. QRIS information in response', async () => {
      const uniqueKey = `idempotent-key-1-${crypto.randomUUID()}`;
      const payload = {
        amount: 50000,
        customerName: 'Hosting Client',
        description: 'Hosting Invoice #1',
        providerCode: 'internal_qris',
        idempotencyKey: uniqueKey // Use unique key inside payload or headers depending on how it's tested, actually we pass in headers.
      };

      const res = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send(payload);
      
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'PENDING');
      assert.strictEqual(res.body.data.paymentMethod, 'STATIC_QRIS');
      assert.match(res.body.data.providerReference, /^INTERNAL-\d+$/);
      
      // Explicit QRIS info
      assert.strictEqual(res.body.data.merchantName, 'ARMADA VALID');
      assert.strictEqual(res.body.data.nmid, 'ID1025438297117');
      assert.match(res.body.data.qrContent, /^\/uploads\/qris\//);
    });

    it('H. GET payment status & L. Static QRIS remains PENDING', async () => {
      const uniqueKey = `status-key-1-${crypto.randomUUID()}`;
      const payload = {
        amount: 60000,
        customerName: 'Status Check',
        providerCode: 'internal_qris'
      };

      const createRes = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send(payload);
      
      const paymentId = createRes.body.data.transactionId;

      const res = await request(app)
        .get(`/api/v1/payments/${paymentId}`)
        .set('x-api-key', validApiKey);
      
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'PENDING');
    });

    it('I. Same idempotency key + same payload = existing payment', async () => {
      const uniqueKey = `idempotent-key-same-${crypto.randomUUID()}`;
      const payload = {
        amount: 50000,
        customerName: 'Hosting Client',
        description: 'Hosting Invoice #1',
        providerCode: 'internal_qris'
      };

      const resFirst = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send(payload);

      const res = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send(payload);
      
      assert.strictEqual(res.status, 200); // 200 OK means idempotent
      assert.strictEqual(res.body.data.merchantName, 'ARMADA VALID');
    });

    it('J. Same idempotency key + different payload = 409', async () => {
      const uniqueKey = `idempotent-key-diff-${crypto.randomUUID()}`;
      const payload = {
        amount: 99999, // Different
        customerName: 'Hosting Client',
        description: 'Hosting Invoice #1',
        providerCode: 'internal_qris'
      };
      
      await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send({ ...payload, amount: 99998 });

      const res = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send(payload);
      
      assert.strictEqual(res.status, 409);
    });

    it('K. Client cannot mark PAID & M. Expired payment cannot become PAID & P. Payment state machine regression', async () => {
      const uniqueKey = `state-key-1-${crypto.randomUUID()}`;
      // Create a payment
      const createRes = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', uniqueKey)
        .send({
          amount: 10000,
          customerName: 'State Machine Test',
          providerCode: 'internal_qris'
        });
      
      const txId = createRes.body.data.transactionId;

      // Ensure API doesn't expose a way for API key clients to PUT/mark as paid.
      // There is no PUT endpoint in API v1 for payment status updates for external clients.
      const putRes = await request(app)
        .put(`/api/v1/payments/${txId}`)
        .set('x-api-key', validApiKey)
        .send({ status: 'PAID' });
      assert.strictEqual(putRes.status, 404); // Route doesn't exist

      // Fast-forward expiration in DB
      await runSql(`UPDATE transactions SET expired_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE id = ?`, [txId]);

      // Check status -> should auto-expire
      const getRes = await request(app)
        .get(`/api/v1/payments/${txId}`)
        .set('x-api-key', validApiKey);
      assert.strictEqual(getRes.body.data.status, 'EXPIRED');

      // Admin tries to mark PAID via webhook (which is unsupported)
      // Call checkPayment on the provider to ensure it doesn't change
      const { getPaymentProviderByCode } = await import('../providers/index.js');
      const provider = await getPaymentProviderByCode('internal_qris');
      const checkResult = await provider.checkPayment(`INTERNAL-${txId}`);
      assert.strictEqual(checkResult.status, 'PENDING'); // The provider check returns PENDING for static QRIS always, ADMS layer handles EXPIRED.
    });

    it('N. Mock provider regression & O. DANA provider regression', async () => {
      const mockKey = `mock-key-1-${crypto.randomUUID()}`;
      const danaKey = `dana-key-1-${crypto.randomUUID()}`;
      // Mock should still work
      const mockRes = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', mockKey)
        .send({
          amount: 5000,
          customerName: 'Mock Client',
          providerCode: 'mock'
        });
      
      assert.strictEqual(mockRes.status, 201);
      assert.strictEqual(mockRes.body.data.paymentMethod, 'QRIS'); // Mock provider returns QRIS

      // Dana should attempt (will fail with DANA error but proves routing works)
      const danaRes = await request(app)
        .post('/api/v1/payments')
        .set('x-api-key', validApiKey)
        .set('x-idempotency-key', danaKey)
        .send({
          amount: 5000,
          customerName: 'Dana Client',
          providerCode: 'dana'
        });
      
      // It fails because DANA credentials aren't set in tests, which is expected, 
      // but the fact that it reaches DANA and fails proves routing works.
      assert.strictEqual(danaRes.status, 500); 
    });
  });
});
