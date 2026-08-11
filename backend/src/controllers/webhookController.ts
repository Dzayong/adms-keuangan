import { Request, Response } from 'express';
import { getSql, runSql } from '../config/db.js';
import { Payment, Transaction } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPaymentProviderByCode } from '../providers/index.js';
import { validateStateTransition, getInvalidTransitionMessage } from '../utils/paymentStateMachine.js';

export async function handleMockWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const provider = await getPaymentProviderByCode('mock');

    let webhookResult;
    try {
      webhookResult = await provider.handleWebhook(payload, req.headers);
    } catch (err: any) {
      console.error('Provider failed to handle mock webhook:', err);
      return sendError(res, err.message || 'Provider failed to process webhook.', 400);
    }

    if (!webhookResult.isValid || !webhookResult.providerReference) {
      return sendError(res, 'Webhook payload tidak valid.', 400);
    }

    const payment = await getSql<Payment>(
      'SELECT * FROM payments WHERE provider_reference = ?',
      [webhookResult.providerReference]
    );

    if (!payment) {
      return sendError(
        res,
        `Pembayaran dengan referensi ${webhookResult.providerReference} tidak ditemukan.`,
        404
      );
    }

    // IDEMPOTENCY GUARD
    // If payment is already in final status, avoid duplicate status mutation or duplicate logic
    if (payment.status === webhookResult.status) {
      return sendSuccess(
        res,
        {
          reference: webhookResult.providerReference,
          status: payment.status,
          idempotent: true,
        },
        'Webhook telah diproses sebelumnya (Idempotent call).'
      );
    }

    if (!validateStateTransition(payment.status, webhookResult.status)) {
      return sendError(
        res,
        getInvalidTransitionMessage(payment.status, webhookResult.status),
        400
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const paidAtStr = webhookResult.status === 'PAID' ? webhookResult.paidAt || nowStr : null;

    // Update Payment
    await runSql(
      'UPDATE payments SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
      [webhookResult.status, paidAtStr, nowStr, payment.id]
    );

    // Update Transaction
    await runSql(
      'UPDATE transactions SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
      [webhookResult.status, paidAtStr, nowStr, payment.transaction_id]
    );

    // Audit Payment Log
    await runSql(
      `INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        payment.id,
        webhookResult.eventType,
        webhookResult.providerReference,
        JSON.stringify(webhookResult.rawPayload),
        nowStr,
      ]
    );

    return sendSuccess(
      res,
      {
        reference: webhookResult.providerReference,
        status: webhookResult.status,
        paidAt: paidAtStr,
      },
      `Webhook berhasil diproses. Status diperbarui menjadi ${webhookResult.status}.`
    );
  } catch (err: any) {
    console.error('Error handling mock webhook:', err);
    return sendError(res, err.message || 'Gagal memproses webhook mock.', 500);
  }
}

export async function handleDanaWebhook(req: Request, res: Response) {
  try {
    const provider = await getPaymentProviderByCode('dana');

    let webhookResult;
    try {
      webhookResult = await provider.handleWebhook(req.body, req.headers);
    } catch (err: any) {
      console.error('Provider failed to handle DANA webhook:', err);
      return sendError(res, err.message || 'Provider failed to process webhook.', 400);
    }

    return sendSuccess(
      res,
      {
        reference: webhookResult.providerReference,
        status: webhookResult.status,
        note: 'DANA webhook placeholder callback received.',
      },
      'DANA Webhook successfully received.'
    );
  } catch (err: any) {
    return sendError(res, 'Gagal memproses webhook DANA.', 500);
  }
}
