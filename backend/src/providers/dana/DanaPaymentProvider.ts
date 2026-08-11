import {
  PaymentProvider,
  CreatePaymentDTO,
  PaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from '../PaymentProvider.js';

/**
 * DanaPaymentProvider (Skeleton/Placeholder)
 * Ready for official DANA PJP API credentials integration in future stages.
 * Security Note: Secrets and credentials are ONLY stored in environment variables / backend configuration.
 */
export class DanaPaymentProvider implements PaymentProvider {
  code = 'dana';
  name = 'DANA QRIS';

  private clientId: string;
  private clientSecret: string;
  private environment: string;

  constructor(clientId = '', clientSecret = '', environment = 'sandbox') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.environment = environment;
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'DANA Provider credentials belum dikonfigurasi. Menggunakan fallback Mock Provider.'
      );
    }

    // Skeleton for DANA API OAuth Token & Create Order Request
    const reference = `DANA-REF-${Date.now()}`;
    const mockDanaQr = `00020101021226670016COM.DANA.WWW01189360091100000000010215DANA${reference}52045812530336054${data.amount}5802ID5918ADMS DANA QRIS6012JAKARTA SEL6304DANA`;

    return {
      providerId: 2,
      providerReference: reference,
      qrContent: mockDanaQr,
      paymentMethod: 'DANA_QRIS',
      status: 'PENDING',
      rawPayload: {
        provider: 'DANA_SKELETON',
        status: 'PENDING',
        note: 'DANA API integration placeholder. Pending official production merchant credentials.',
      },
    };
  }

  async checkPayment(providerReference: string): Promise<PaymentStatusResult> {
    return {
      providerReference,
      status: 'PENDING',
      rawPayload: { provider: 'DANA_SKELETON', action: 'QUERY_ORDER_STATUS' },
    };
  }

  async cancelPayment(providerReference: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `DANA Placeholder: Pembatalan transaksi ${providerReference} diproses.`,
    };
  }

  async refundPayment(providerReference: string, amount?: number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `DANA Placeholder: Pengembalian dana transaksi ${providerReference} diproses.`,
    };
  }

  async handleWebhook(payload: any, headers?: any): Promise<WebhookResult> {
    // DANA Signature Verification Placeholder
    const reference = payload?.acquiringOrderNo || payload?.reference || 'DANA-UNKNOWN';
    const status = payload?.orderStatus === 'SUCCESS' ? 'PAID' : 'PENDING';

    return {
      providerReference: reference,
      status: status,
      paidAt: status === 'PAID' ? new Date().toISOString() : null,
      eventType: 'DANA_WEBHOOK_EVENT',
      isValid: true,
      rawPayload: payload,
    };
  }
}
