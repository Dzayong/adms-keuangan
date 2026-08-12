import { PaymentProvider, CreatePaymentDTO, PaymentResult, PaymentStatusResult, WebhookResult } from '../PaymentProvider.js';
import { getSql } from '../../config/db.js';

export class InternalOfficeQrisProvider implements PaymentProvider {
  code = 'internal_qris';
  name = 'Internal Office QRIS';

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    const merchant = await getSql<{ name: string; nmid: string; qris_image_path: string; is_active: number }>(
      'SELECT * FROM internal_merchants WHERE nmid = ?',
      ['ID1025438297117']
    );

    if (!merchant) {
      throw new Error('Internal merchant configuration not found.');
    }

    if (!merchant.is_active) {
      throw new Error('Internal Office QRIS is currently inactive.');
    }

    if (!merchant.qris_image_path) {
      throw new Error('Internal Office QRIS image has not been configured.');
    }

    return {
      providerId: 3, // Since we hardcoded it in DB as 3
      providerReference: `INTERNAL-${data.transactionId}`,
      qrContent: merchant.qris_image_path,
      paymentMethod: 'STATIC_QRIS',
      status: 'PENDING',
      rawPayload: {
        merchantName: merchant.name,
        nmid: merchant.nmid,
        note: 'Static QRIS. Automatic verification is not supported.',
      }
    };
  }

  async checkPayment(providerReference: string): Promise<PaymentStatusResult> {
    // Static QRIS cannot automatically check payment status from an external network.
    // It remains in PENDING until it EXPIRES. The ADMS system state machine handles expiry.
    // So we just return PENDING here.
    return {
      providerReference,
      status: 'PENDING',
      rawPayload: {
        note: 'Static QRIS payments require manual reconciliation.'
      }
    };
  }

  async cancelPayment(providerReference: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Static QRIS payment marked as cancelled locally.'
    };
  }

  async refundPayment(providerReference: string, amount?: number): Promise<{ success: boolean; message: string }> {
    throw new Error('Refund is not supported for Static QRIS provider.');
  }

  async handleWebhook(payload: any, headers?: any): Promise<WebhookResult> {
    // Static QRIS doesn't have webhooks. Reject any attempts.
    return {
      providerReference: 'UNKNOWN',
      status: 'FAILED',
      eventType: 'UNSUPPORTED',
      isValid: false,
      rawPayload: {
        error: 'Webhook received for Internal Office QRIS. This is unsupported.'
      }
    };
  }
}
