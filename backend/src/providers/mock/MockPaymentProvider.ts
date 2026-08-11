import {
  PaymentProvider,
  CreatePaymentDTO,
  PaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from '../PaymentProvider.js';
import { ProviderError } from '../../utils/errors.js';

export class MockPaymentProvider implements PaymentProvider {
  code = 'mock';
  name = 'Mock QRIS';

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    const reference = `MOCK-REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Standard EMVCo-like simulated QRIS payload
    const paddedAmount = String(data.amount);
    const mockQr = `00020101021226670016COM.DANA.WWW01189360091100000000010215${reference.substring(0, 15)}52045812530336054${paddedAmount.length.toString().padStart(2, '0')}${paddedAmount}5802ID5918ADMS QRIS INTERNAL6012JAKARTA SEL6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      providerId: 1,
      providerReference: reference,
      qrContent: mockQr,
      paymentMethod: 'QRIS',
      status: 'PENDING',
      rawPayload: {
        action: 'CREATE_SIMULATION',
        data,
        reference,
        generated_at: new Date().toISOString(),
      },
    };
  }

  async checkPayment(providerReference: string): Promise<PaymentStatusResult> {
    return {
      providerReference,
      status: 'PENDING',
      rawPayload: {
        reference: providerReference,
        checked_at: new Date().toISOString(),
      },
    };
  }

  async cancelPayment(providerReference: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Simulasi pembatalan pembayaran untuk referensi ${providerReference} berhasil.`,
    };
  }

  async refundPayment(providerReference: string, amount?: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Simulasi pengembalian dana (refund) untuk referensi ${providerReference} sebesar ${amount || 'full'} berhasil.`,
    };
  }

  async handleWebhook(payload: any): Promise<WebhookResult> {
    const { reference, status, paid_at } = payload || {};

    if (!reference) {
      throw new ProviderError(this.code, 'Webhook mock tidak valid: reference tidak ditemukan.', 400);
    }

    const mappedStatus = ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'].includes(status)
      ? status
      : 'PAID';

    return {
      providerReference: reference,
      status: mappedStatus,
      paidAt: mappedStatus === 'PAID' ? paid_at || new Date().toISOString() : null,
      eventType: `SIMULATED_WEBHOOK_${mappedStatus}`,
      isValid: true,
      rawPayload: payload,
    };
  }
}
