import { Response } from 'express';
import { z } from 'zod';
import { querySql, getSql, runSql } from '../config/db.js';
import { Transaction, Payment, PaymentLog } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getPaymentProvider } from '../providers/index.js';

const createPaymentSchema = z.object({
  customerName: z.string().min(1, 'Nama Customer wajib diisi'),
  customerPhone: z.string().optional().default(''),
  amount: z.number().positive('Nominal pembayaran harus lebih besar dari 0'),
  description: z.string().optional().default(''),
});

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

export async function createPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const { customerName, customerPhone, amount, description } = parseResult.data;
    const userId = req.user?.userId || 1;

    // Fetch expiry setting (default 15 mins)
    const expirySetting = await getSql<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['mock_expiry_minutes']);
    const expiryMinutes = parseInt(expirySetting?.value || '15', 10);

    const now = new Date();
    const expiredAtDate = new Date(now.getTime() + expiryMinutes * 60000);
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const expiredAtStr = expiredAtDate.toISOString().replace('T', ' ').substring(0, 19);

    // Generate unique invoice number from backend
    const invoiceNumber = await generateUniqueInvoiceNumber();

    // Insert Transaction
    const txInsert = await runSql(`
      INSERT INTO transactions 
      (invoice_number, customer_name, customer_phone, amount, description, status, expired_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)
    `, [invoiceNumber, customerName, customerPhone, amount, description, expiredAtStr, userId, nowStr, nowStr]);

    const transactionId = txInsert.lastInsertRowid;

    // Execute Payment Provider Abstraction
    const provider = getPaymentProvider();
    const providerResult = await provider.createPayment({
      transactionId,
      invoiceNumber,
      amount,
      customerName,
      customerPhone,
      description,
      expiryMinutes,
    });

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

    return sendSuccess(res, {
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
    }, 'Pembayaran QRIS berhasil dibuat', 201);

  } catch (err: any) {
    console.error('Error creating payment:', err);
    return sendError(res, 'Gagal membuat pembayaran QRIS.', 500);
  }
}

export async function getPaymentDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'ID Pembayaran tidak valid.', 400);
    }

    const transaction = await getSql<Transaction>(`
      SELECT 
        t.*, 
        u.name as creator_name,
        p.id as payment_id,
        p.qr_content,
        p.provider_reference,
        p.payment_method,
        p.paid_at as payment_paid_at,
        p.status as payment_status
      FROM transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN payments p ON p.transaction_id = t.id
      WHERE t.id = ? OR p.id = ?
    `, [id, id]);

    if (!transaction) {
      return sendError(res, 'Data pembayaran tidak ditemukan.', 404);
    }

    // Auto-check expiry
    const now = new Date();
    const expiredAt = new Date(transaction.expired_at.replace(' ', 'T') + 'Z');
    let currentStatus = transaction.status;

    if (currentStatus === 'PENDING' && now > expiredAt) {
      currentStatus = 'EXPIRED';
      const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
      await runSql(`UPDATE transactions SET status = 'EXPIRED', updated_at = ? WHERE id = ?`, [nowStr, transaction.id]);
      await runSql(`UPDATE payments SET status = 'EXPIRED', updated_at = ? WHERE transaction_id = ?`, [nowStr, transaction.id]);
      transaction.status = 'EXPIRED';
    }

    // Get Payment logs
    let logs: PaymentLog[] = [];
    if (transaction.payment_id) {
      logs = await querySql<PaymentLog>('SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY id DESC', [transaction.payment_id]);
    }

    return sendSuccess(res, {
      transaction: {
        ...transaction,
        status: currentStatus,
      },
      logs,
    });
  } catch (err: any) {
    return sendError(res, 'Gagal mengambil detail pembayaran.', 500);
  }
}

/**
 * Interactive Simulation Endpoint for Sandbox / Mock Development
 */
export async function simulatePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { targetStatus = 'PAID' } = req.body;

    const validStatuses = ['PAID', 'FAILED', 'EXPIRED'];
    if (!validStatuses.includes(targetStatus)) {
      return sendError(res, 'Target status simulasi tidak valid.', 400);
    }

    const transaction = await getSql<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!transaction) {
      return sendError(res, 'Transaksi tidak ditemukan.', 404);
    }

    const payment = await getSql<Payment>('SELECT * FROM payments WHERE transaction_id = ?', [transaction.id]);
    if (!payment) {
      return sendError(res, 'Data pembayaran tidak ditemukan.', 404);
    }

    if (transaction.status !== 'PENDING') {
      return sendError(res, `Simulasi gagal: Status transaksi saat ini sudah '${transaction.status}'.`, 400);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const paidAtStr = targetStatus === 'PAID' ? nowStr : null;

    // Update Transaction & Payment
    await runSql(
      `UPDATE transactions SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?`,
      [targetStatus, paidAtStr, nowStr, transaction.id]
    );

    await runSql(
      `UPDATE payments SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?`,
      [targetStatus, paidAtStr, nowStr, payment.id]
    );

    // Record Payment Log
    await runSql(`
      INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      payment.id,
      `SIMULATION_${targetStatus}`,
      payment.provider_reference,
      JSON.stringify({
        simulated_by: req.user?.name || 'Operator',
        simulated_at: nowStr,
        new_status: targetStatus,
      }),
      nowStr,
    ]);

    return sendSuccess(res, {
      transactionId: transaction.id,
      invoiceNumber: transaction.invoice_number,
      status: targetStatus,
      paidAt: paidAtStr,
    }, `Simulasi pembayaran berhasil! Status diubah menjadi ${targetStatus}.`);

  } catch (err: any) {
    console.error('Error simulating payment:', err);
    return sendError(res, 'Gagal menjalankan simulasi pembayaran.', 500);
  }
}
