import { Response } from 'express';
import { z } from 'zod';
import { getSql, runSql, runTransaction } from '../config/db.js';
import { Transaction, Payment } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { validateStateTransition, getInvalidTransitionMessage } from '../utils/paymentStateMachine.js';
import { createPaymentService, getPaymentDetailService } from '../services/paymentService.js';

const createPaymentSchema = z.object({
  customerName: z.string().min(1, 'Nama Customer wajib diisi'),
  customerPhone: z.string().optional().default(''),
  amount: z.number().positive('Nominal pembayaran harus lebih besar dari 0'),
  description: z.string().optional().default(''),
  providerCode: z.string().optional(),
});

export async function createPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
      return sendError(res, errorMsg, 400);
    }

    const { customerName, customerPhone, amount, description, providerCode } = parseResult.data;
    const userId = req.user?.userId || 1;
    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;

    try {
      const result = await createPaymentService({
        amount,
        customerName,
        customerPhone,
        description,
        idempotencyKey,
        userId,
        providerCode
      });

      if (result.isIdempotent) {
        return sendSuccess(res, result.data, 'Idempotent request: returning existing transaction.', 200);
      }

      return sendSuccess(res, result.data, 'Pembayaran QRIS berhasil dibuat', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Gagal membuat pembayaran QRIS.', err.message === 'Payment already exists for this transaction.' ? 400 : 500);
    }

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

    const result = await getPaymentDetailService(id);

    if (!result) {
      return sendError(res, 'Data pembayaran tidak ditemukan.', 404);
    }

    return sendSuccess(res, result);
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

    if (!validateStateTransition(transaction.status, targetStatus)) {
      return sendError(res, getInvalidTransitionMessage(transaction.status, targetStatus), 400);
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

/**
 * Manual Verification Endpoint for Internal Static QRIS
 */
export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 'ID Pembayaran tidak valid.', 400);
    }

    // Role check (fallback just in case, router handles it too)
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'OPERATOR') {
      return sendError(res, 'Akses ditolak.', 403);
    }

    // Use getPaymentDetailService to get the full info with provider code
    const result = await getPaymentDetailService(id);
    if (!result) {
      return sendError(res, 'Data pembayaran tidak ditemukan.', 404);
    }

    const { transaction } = result;

    // Must be internal_qris
    if (transaction.provider_code !== 'internal_qris') {
      return sendError(res, 'Metode pembayaran ini tidak mendukung verifikasi manual.', 400);
    }

    // Must be PENDING
    if (transaction.status !== 'PENDING') {
      return sendError(res, getInvalidTransitionMessage(transaction.status, 'PAID'), 400);
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const queries = [
      {
        sql: `UPDATE transactions SET status = 'PAID', paid_at = ?, updated_at = ? WHERE id = ?`,
        params: [nowStr, nowStr, transaction.id]
      }
    ];

    if (transaction.payment_id) {
      queries.push({
        sql: `UPDATE payments SET status = 'PAID', paid_at = ?, updated_at = ? WHERE id = ?`,
        params: [nowStr, nowStr, transaction.payment_id]
      });

      queries.push({
        sql: `INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at) VALUES (?, ?, ?, ?, ?)`,
        params: [
          transaction.payment_id,
          'MANUAL_STATIC_QRIS',
          transaction.provider_reference || 'N/A',
          JSON.stringify({
            verifiedBy: req.user.userId,
            verifierName: req.user.name,
            timestamp: nowStr,
            previousStatus: 'PENDING',
            newStatus: 'PAID'
          }),
          nowStr
        ]
      });
    }

    // Execute atomically
    await runTransaction(queries);

    return sendSuccess(res, {
      transactionId: transaction.id,
      status: 'PAID'
    }, 'Pembayaran berhasil diverifikasi.');

  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return sendError(res, 'Gagal memverifikasi pembayaran.', 500);
  }
}
