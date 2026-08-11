import { Response } from 'express';
import { z } from 'zod';
import { ApiAuthenticatedRequest } from '../../../middleware/apiAuth.js';
import { createPaymentService, getPaymentDetailService } from '../../../services/paymentService.js';

const apiCreatePaymentSchema = z.object({
  customerName: z.string().min(1, 'Nama Customer wajib diisi').max(100, 'Nama Customer maksimal 100 karakter'),
  customerPhone: z.string().max(20, 'Nomor Telepon maksimal 20 karakter').optional().default(''),
  amount: z.number().int('Nominal pembayaran harus bilangan bulat').positive('Nominal pembayaran harus lebih besar dari 0'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional().default(''),
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

    const { customerName, customerPhone, amount, description } = parseResult.data;

    try {
      const result = await createPaymentService({
        amount,
        customerName,
        customerPhone,
        description,
        idempotencyKey,
        // Since it's an API, there is no direct user ID. We can map the API key ID to created_by
        // or just use 1 (System Admin) for now to fulfill the DB constraint.
        userId: 1 
      });

      return sendApiResponse(res, result.isIdempotent ? 200 : 201, true, result.data);
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

export async function apiGetPayment(req: ApiAuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendApiResponse(res, 400, false, undefined, 'INVALID_REQUEST', 'Invalid Payment ID');
    }

    const result = await getPaymentDetailService(id);

    if (!result) {
      return sendApiResponse(res, 404, false, undefined, 'NOT_FOUND', 'Payment not found');
    }

    // Return a clean representation, hiding logs and internal details if necessary.
    // The requirement is to expose a clean API response contract.
    const cleanData = {
      transactionId: result.transaction.id,
      paymentId: result.transaction.payment_id,
      invoiceNumber: result.transaction.invoice_number,
      amount: result.transaction.amount,
      customerName: result.transaction.customer_name,
      customerPhone: result.transaction.customer_phone,
      description: result.transaction.description,
      status: result.transaction.status,
      paymentMethod: result.transaction.payment_method,
      expiredAt: result.transaction.expired_at,
      paidAt: (result.transaction as any).payment_paid_at,
      qrContent: (result.transaction as any).qr_content
    };

    return sendApiResponse(res, 200, true, cleanData);
  } catch (err: any) {
    console.error('API Error getting payment:', err);
    return sendApiResponse(res, 500, false, undefined, 'INTERNAL_SERVER_ERROR', 'Internal Server Error');
  }
}
