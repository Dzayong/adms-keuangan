import { getSql, runSql, runTransaction, querySql } from '../config/db.js';
import { Transaction, Payment, PaymentLog } from '../models/types.js';
import { getActivePaymentProvider } from '../providers/index.js';
import { validateStateTransition } from '../utils/paymentStateMachine.js';
import crypto from 'crypto';

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export interface CreatePaymentParams {
  amount: number;
  customerName: string;
  customerPhone?: string;
  description?: string;
  idempotencyKey?: string;
  userId?: number;
  providerCode?: string;
}

/**
 * Generate unique Invoice Number in backend format:
 * INV-YYYYMMDD-XXXXXX
 */
async function generateUniqueInvoiceNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  const rows = await querySql<{ invoice_number: string }>(
    `SELECT invoice_number FROM transactions WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let sequence = 1;
  if (rows.length > 0) {
    const lastInvoice = rows[0].invoice_number;
    const lastSeqStr = lastInvoice.split('-').pop();
    if (lastSeqStr) {
      sequence = parseInt(lastSeqStr, 10) + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(6, '0')}`;
}

export function generatePayloadFingerprint(payload: { amount: number, customerName: string, customerPhone: string, description: string }): string {
  const normalized = `${payload.amount}|${payload.customerName.trim()}|${payload.customerPhone.trim()}|${payload.description.trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function createPaymentService(params: CreatePaymentParams) {
  const { amount, customerName, customerPhone = '', description = '', idempotencyKey, userId = 1, providerCode } = params;

  // Fetch expiry setting (default 15 mins)
  const expirySetting = await getSql<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['mock_expiry_minutes']);
  const expiryMinutes = parseInt(expirySetting?.value || '15', 10);

  const now = new Date();
  const expiredAtDate = new Date(now.getTime() + expiryMinutes * 60000);
  const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const expiredAtStr = expiredAtDate.toISOString().replace('T', ' ').substring(0, 19);

  // Check Idempotency Key
  if (idempotencyKey) {
    const existingTx = await getSql<Transaction>('SELECT * FROM transactions WHERE idempotency_key = ?', [idempotencyKey]);
    if (existingTx) {
      const incomingFingerprint = generatePayloadFingerprint({ amount, customerName, customerPhone, description });
      const existingFingerprint = generatePayloadFingerprint({
        amount: existingTx.amount,
        customerName: existingTx.customer_name,
        customerPhone: existingTx.customer_phone || '',
        description: existingTx.description || ''
      });

      if (incomingFingerprint !== existingFingerprint) {
        throw new IdempotencyConflictError('Idempotency key reused with a different payload');
      }

      const existingPayment = await getSql<Payment>('SELECT * FROM payments WHERE transaction_id = ?', [existingTx.id]);
      if (existingPayment) {
        return {
          isIdempotent: true,
          data: {
            transactionId: existingTx.id,
            paymentId: existingPayment.id,
            invoiceNumber: existingTx.invoice_number,
            amount: existingTx.amount,
            customerName: existingTx.customer_name,
            customerPhone: existingTx.customer_phone,
            description: existingTx.description,
            status: existingTx.status,
            expiredAt: existingTx.expired_at,
            qrContent: existingPayment.qr_content,
            providerReference: existingPayment.provider_reference,
            paymentMethod: existingPayment.payment_method,
          }
        };
      }
    }
  }

  // Generate unique invoice number from backend
  const invoiceNumber = await generateUniqueInvoiceNumber();

  // Insert Transaction
  const txInsert = await runSql(`
    INSERT INTO transactions 
    (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, idempotency_key, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?)
  `, [invoiceNumber, customerName, customerPhone, amount, description, expiredAtStr, idempotencyKey || null, userId, nowStr, nowStr]);

  const transactionId = txInsert.lastInsertRowid;

  // Execute Payment Provider Abstraction
  let provider;
  if (providerCode) {
    const providerModel = await getSql<{ is_active: number }>('SELECT is_active FROM payment_providers WHERE code = ?', [providerCode]);
    if (!providerModel) {
      throw new Error(`Provider dengan kode ${providerCode} tidak ditemukan.`);
    }
    if (providerModel.is_active !== 1) {
      throw new Error(`Provider dengan kode ${providerCode} sedang tidak aktif.`);
    }
    const { getPaymentProviderByCode } = await import('../providers/index.js');
    provider = await getPaymentProviderByCode(providerCode);
  } else {
    provider = await getActivePaymentProvider();
  }
  let providerResult;
  try {
    providerResult = await provider.createPayment({
      transactionId,
      invoiceNumber,
      amount,
      customerName,
      customerPhone,
      description,
      expiryMinutes,
    });
  } catch (err: any) {
    console.error('Provider failed to create payment:', err);
    const providerModel = await getSql<{ id: number }>('SELECT id FROM payment_providers WHERE code = ?', [provider.code]);
    const providerId = providerModel?.id || 1;
    
    await runSql(`UPDATE transactions SET status = 'FAILED', updated_at = ? WHERE id = ?`, [nowStr, transactionId]);
    
    const failedPaymentInsert = await runSql(`
      INSERT INTO payments 
      (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, created_at, updated_at)
      VALUES (?, ?, 'FAILED', '', 'QRIS', 'FAILED', ?, ?)
    `, [transactionId, providerId, nowStr, nowStr]);
    
    await runSql(`
      INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at)
      VALUES (?, 'PROVIDER_ERROR', 'FAILED', ?, ?)
    `, [failedPaymentInsert.lastInsertRowid, JSON.stringify({ error: err.message || 'Unknown provider error' }), nowStr]);
    
    throw err;
  }

  // Defensive check: Ensure no duplicate payment exists for this transaction
  const existingPayment = await getSql<{ id: number }>('SELECT id FROM payments WHERE transaction_id = ?', [transactionId]);
  if (existingPayment) {
    throw new Error('Payment already exists for this transaction.');
  }

  // Get Provider ID
  const providerModel = await getSql<{ id: number }>('SELECT id FROM payment_providers WHERE code = ?', [provider.code]);
  const providerId = providerModel?.id || 1;

  // Insert Payment Record
  const paymentInsert = await runSql(`
    INSERT INTO payments 
    (transaction_id, provider_id, provider_reference, qr_content, payment_method, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)
  `, [transactionId, providerId, providerResult.providerReference, providerResult.qrContent, providerResult.paymentMethod, nowStr, nowStr]);

  const paymentId = paymentInsert.lastInsertRowid;

  // Insert Audit Payment Log
  await runSql(`
    INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at)
    VALUES (?, 'PAYMENT_CREATED', ?, ?, ?)
  `, [paymentId, providerResult.providerReference, JSON.stringify(providerResult.rawPayload || {}), nowStr]);

  return {
    isIdempotent: false,
    data: {
      transactionId,
      paymentId,
      invoiceNumber,
      amount,
      customerName,
      customerPhone,
      description,
      status: 'PENDING',
      expiredAt: expiredAtStr,
      qrContent: providerResult.qrContent,
      providerReference: providerResult.providerReference,
      paymentMethod: providerResult.paymentMethod,
    }
  };
}

export async function getPaymentDetailService(id: number) {
  const transaction = await getSql<Transaction>(`
    SELECT 
      t.*, 
      u.name as creator_name,
      p.id as payment_id,
      p.qr_content,
      p.provider_reference,
      p.payment_method,
      p.paid_at as payment_paid_at,
      p.status as payment_status,
      pr.code as provider_code
    FROM transactions t
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN payments p ON p.transaction_id = t.id
    LEFT JOIN payment_providers pr ON p.provider_id = pr.id
    WHERE t.id = ? OR p.id = ?
  `, [id, id]);

  if (!transaction) {
    return null;
  }

  // Auto-check expiry
  const now = new Date();
  const expiredAt = new Date(transaction.expired_at.replace(' ', 'T') + 'Z');
  let currentStatus = transaction.status;

  if (now > expiredAt && validateStateTransition(currentStatus, 'EXPIRED')) {
    currentStatus = 'EXPIRED';
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    
    const queries = [
      { sql: `UPDATE transactions SET status = 'EXPIRED', updated_at = ? WHERE id = ?`, params: [nowStr, transaction.id] },
      { sql: `UPDATE payments SET status = 'EXPIRED', updated_at = ? WHERE transaction_id = ?`, params: [nowStr, transaction.id] }
    ];

    if (transaction.payment_id) {
      queries.push({
        sql: `INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at) VALUES (?, ?, ?, ?, ?)`,
        params: [
          transaction.payment_id,
          'AUTO_EXPIRED',
          transaction.provider_reference || 'N/A',
          JSON.stringify({ note: 'Transaction automatically expired by system check' }),
          nowStr
        ]
      });
    }

    await runTransaction(queries);
    transaction.status = 'EXPIRED';
  } else {
    transaction.status = currentStatus;
  }

  // Get Payment logs
  let logs: PaymentLog[] = [];
  if (transaction.payment_id) {
    logs = await querySql<PaymentLog>('SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY id DESC', [transaction.payment_id]);
  }

  return { transaction, logs };
}
