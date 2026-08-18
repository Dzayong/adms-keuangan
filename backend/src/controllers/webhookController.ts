import { Request, Response } from 'express';
import { getSql, runSql } from '../config/db.js';
import { Payment, Transaction } from '../models/types.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPaymentProviderByCode } from '../providers/index.js';
import { validateStateTransition, getInvalidTransitionMessage } from '../utils/paymentStateMachine.js';
import { fireWebhook } from '../utils/webhookDelivery.js';

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
      return sendSuccess(
        res,
        {
          reference: webhookResult.providerReference,
          status: payment.status,
          ignored: true
        },
        `Webhook diabaikan: ${getInvalidTransitionMessage(payment.status, webhookResult.status)}`
      );
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const paidAtStr = webhookResult.status === 'PAID' ? webhookResult.paidAt || nowStr : null;

    const queries = [
      {
        sql: 'UPDATE payments SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
        params: [webhookResult.status, paidAtStr, nowStr, payment.id]
      },
      {
        sql: 'UPDATE transactions SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
        params: [webhookResult.status, paidAtStr, nowStr, payment.transaction_id]
      },
      {
        sql: `INSERT INTO payment_logs (payment_id, event_type, reference, payload, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        params: [
          payment.id,
          webhookResult.eventType,
          webhookResult.providerReference,
          JSON.stringify(webhookResult.rawPayload),
          nowStr,
        ]
      }
    ];

    const { runTransaction } = await import('../config/db.js');
    await runTransaction(queries);

    // If payment became PAID, fire the outgoing webhook to the merchant
    if (webhookResult.status === 'PAID') {
      const fullTx = await getSql<{ 
        invoice_number: string; callback_url: string | null; source_system: string | null; 
        customer_name: string; customer_phone: string; amount: number; description: string; user_webhook: string | null 
      }>(
        'SELECT t.invoice_number, t.callback_url, t.source_system, t.customer_name, t.customer_phone, t.amount, t.description, u.webhook_url as user_webhook FROM transactions t JOIN users u ON t.created_by = u.id WHERE t.id = ?',
        [payment.transaction_id]
      );
      
      const targetUrl = fullTx?.callback_url || fullTx?.user_webhook;
      if (targetUrl && fullTx) {
        fireWebhook(targetUrl, {
          event: 'payment.paid',
          invoiceNumber: fullTx.invoice_number,
          transactionId: payment.transaction_id,
          paymentId: payment.id,
          amount: fullTx.amount,
          customerName: fullTx.customer_name,
          customerPhone: fullTx.customer_phone,
          description: fullTx.description,
          status: 'PAID',
          paidAt: nowStr,
          paymentMethod: payment.payment_method || 'QRIS',
          sourceSystem: fullTx.source_system,
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      }
    }

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
    
    // Check if the payment became PAID
    if (webhookResult.status === 'PAID') {
      const payment = await getSql<{id: number, transaction_id: number, payment_method: string}>('SELECT id, transaction_id, payment_method FROM payments WHERE provider_reference = ?', [webhookResult.providerReference]);
      
      if (payment) {
        const fullTx = await getSql<{ 
          invoice_number: string; callback_url: string | null; source_system: string | null; 
          customer_name: string; customer_phone: string; amount: number; description: string; user_webhook: string | null 
        }>(
          'SELECT t.invoice_number, t.callback_url, t.source_system, t.customer_name, t.customer_phone, t.amount, t.description, u.webhook_url as user_webhook FROM transactions t JOIN users u ON t.created_by = u.id WHERE t.id = ?',
          [payment.transaction_id]
        );
        
        const targetUrl = fullTx?.callback_url || fullTx?.user_webhook;
        if (targetUrl && fullTx) {
          fireWebhook(targetUrl, {
            event: 'payment.paid',
            invoiceNumber: fullTx.invoice_number,
            transactionId: payment.transaction_id,
            paymentId: payment.id,
            amount: fullTx.amount,
            customerName: fullTx.customer_name,
            customerPhone: fullTx.customer_phone,
            description: fullTx.description,
            status: 'PAID',
            paidAt: new Date().toISOString(),
            paymentMethod: payment.payment_method || 'QRIS',
            sourceSystem: fullTx.source_system,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      }
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
