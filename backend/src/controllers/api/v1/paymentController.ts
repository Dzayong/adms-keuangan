import { Response } from 'express';
import { z } from 'zod';
import { ApiAuthenticatedRequest } from '../../../middleware/apiAuth.js';
import { createPaymentService, getPaymentDetailService } from '../../../services/paymentService.js';

const apiCreatePaymentSchema = z.object({
  customerName: z.string().min(1, 'Nama Customer wajib diisi').max(100, 'Nama Customer maksimal 100 karakter'),
  customerPhone: z.string().max(20, 'Nomor Telepon maksimal 20 karakter').optional().default(''),
  amount: z.number().int('Nominal pembayaran harus bilangan bulat').positive('Nominal pembayaran harus lebih besar dari 0'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional().default(''),
  providerCode: z.string().optional(),
  callbackUrl: z.string().url('callbackUrl harus berupa URL yang valid').optional(),
  sourceSystem: z.string().max(100).optional(),
});

function sendApiResponse(res: Response, statusCode: number, success: boolean, data?: any, errorCode?: string, errorMessage?: string) {
  const response: any = { success };
  if (data) response.data = data;
  if (errorCode || errorMessage) {
    response.error = {
      code: errorCode || 'UNKNOWN_ERROR',
      message: errorMessage || 'An unknown error occurred'
    };
  }
  return res.status(statusCode).json(response);
}

export async function apiCreatePayment(req: ApiAuthenticatedRequest, res: Response) {
  try {
    const parseResult = apiCreatePaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map(e => e.message).join(', ');
      return sendApiResponse(res, 400, false, undefined, 'VALIDATION_ERROR', errorMsg);
    }

    const idempotencyKey = req.headers['x-idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return sendApiResponse(res, 400, false, undefined, 'MISSING_IDEMPOTENCY_KEY', 'Missing X-Idempotency-Key header.');
    }

    const { customerName, customerPhone, amount, description, providerCode, callbackUrl, sourceSystem } = parseResult.data;

    try {
      const result = await createPaymentService({
        amount,
        customerName,
        customerPhone,
        description,
        idempotencyKey,
        providerCode,
        callbackUrl,
        sourceSystem,
        userId: 1
      });

      const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
      const responsePayload: any = {
        transactionId: result.data.transactionId,
        paymentId: result.data.paymentId,
        invoiceNumber: result.data.invoiceNumber,
        paymentLink: `${appUrl}/pay/${result.data.invoiceNumber}`,
        amount: result.data.amount,
        customerName: result.data.customerName,
        customerPhone: result.data.customerPhone,
        description: result.data.description,
        status: result.data.status,
        expiredAt: result.data.expiredAt,
        qrContent: result.data.qrContent,
        providerReference: result.data.providerReference,
        paymentMethod: result.data.paymentMethod,
      };

      if (!result.isIdempotent) {
        // If it was just created, get raw payload fields injected by provider
        const paymentLog = await import('../../../config/db.js').then(db => db.getSql<{payload: string}>('SELECT payload FROM payment_logs WHERE payment_id = ? AND event_type = ? ORDER BY id DESC', [result.data.paymentId, 'PAYMENT_CREATED']));
        if (paymentLog?.payload) {
          try {
            const parsed = JSON.parse(paymentLog.payload);
            if (parsed.merchantName) responsePayload.merchantName = parsed.merchantName;
            if (parsed.nmid) responsePayload.nmid = parsed.nmid;
          } catch(e) {}
        }
      } else {
        // If idempotent, fetch the payment log
        const paymentLog = await import('../../../config/db.js').then(db => db.getSql<{payload: string}>('SELECT payload FROM payment_logs WHERE payment_id = ? AND event_type = ? ORDER BY id DESC', [result.data.paymentId, 'PAYMENT_CREATED']));
        if (paymentLog?.payload) {
          try {
            const parsed = JSON.parse(paymentLog.payload);
            if (parsed.merchantName) responsePayload.merchantName = parsed.merchantName;
            if (parsed.nmid) responsePayload.nmid = parsed.nmid;
          } catch(e) {}
        }
      }

      return sendApiResponse(res, result.isIdempotent ? 200 : 201, true, responsePayload);
    } catch (err: any) {
      if (err.name === 'IdempotencyConflictError') {
        return sendApiResponse(res, 409, false, undefined, 'IDEMPOTENCY_KEY_REUSED', err.message);
      }
      const isDuplicate = err.message === 'Payment already exists for this transaction.';
      return sendApiResponse(res, isDuplicate ? 400 : 500, false, undefined, isDuplicate ? 'DUPLICATE_PAYMENT' : 'INTERNAL_SERVER_ERROR', err.message || 'Internal Server Error');
    }

  } catch (err: any) {
    console.error('API Error creating payment:', err);
    return sendApiResponse(res, 500, false, undefined, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}

export async function apiGetPaymentByInvoice(req: ApiAuthenticatedRequest, res: Response) {
  try {
    const { invoiceNumber } = req.params;
    const { getSql: dbGetSql } = await import('../../../config/db.js');
    const tx = await dbGetSql<{ id: number }>('SELECT id FROM transactions WHERE invoice_number = ?', [invoiceNumber]);
    if (!tx) {
      return sendApiResponse(res, 404, false, undefined, 'NOT_FOUND', 'Payment not found');
    }
    return apiGetPaymentById(tx.id, res);
  } catch (err: any) {
    console.error('API Error getting payment by invoice:', err);
    return sendApiResponse(res, 500, false, undefined, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}

async function apiGetPaymentById(id: number, res: Response) {
  const result = await getPaymentDetailService(id);
  if (!result) {
    return sendApiResponse(res, 404, false, undefined, 'NOT_FOUND', 'Payment not found');
  }

  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  const cleanData: Record<string, any> = {
    transactionId: result.transaction.id,
    paymentId: result.transaction.payment_id,
    invoiceNumber: result.transaction.invoice_number,
    paymentLink: `${appUrl}/pay/${result.transaction.invoice_number}`,
    amount: result.transaction.amount,
    customerName: result.transaction.customer_name,
    customerPhone: result.transaction.customer_phone,
    description: result.transaction.description,
    status: result.transaction.status,
    paymentMethod: result.transaction.payment_method,
    expiredAt: result.transaction.expired_at,
    paidAt: (result.transaction as any).payment_paid_at,
    qrContent: (result.transaction as any).qr_content,
  };

  const createdLog = result.logs.find(l => l.event_type === 'PAYMENT_CREATED');
  if (createdLog?.payload) {
    try {
      const payload = JSON.parse(createdLog.payload);
      if (payload.merchantName) cleanData.merchantName = payload.merchantName;
      if (payload.nmid) cleanData.nmid = payload.nmid;
    } catch (_) {}
  }

  return sendApiResponse(res, 200, true, cleanData);
}

export async function apiGetPayment(req: ApiAuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendApiResponse(res, 400, false, undefined, 'INVALID_REQUEST', 'Invalid Payment ID');
    }
    return apiGetPaymentById(id, res);
  } catch (err: any) {
    console.error('API Error getting payment:', err);
    return sendApiResponse(res, 500, false, undefined, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}
