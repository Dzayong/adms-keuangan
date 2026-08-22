import {
  PaymentProvider,
  CreatePaymentDTO,
  PaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from '../PaymentProvider.js';
import { ProviderError } from '../../utils/errors.js';
import { Dana } from 'dana-node';
import { PaymentGatewayApi, CreateOrderByApiRequest, QueryPaymentRequest, PayOptionDetailPayMethodEnum, PayOptionDetailPayOptionEnum } from 'dana-node/payment_gateway/v1';
import { WebhookParser } from 'dana-node/webhook/v1';
import crypto from 'crypto';

export interface DanaConfig {
  merchantId: string;
  partnerId: string;
  privateKey: string;
  publicKey: string;
  origin: string;
  environment: string;
  externalStoreId: string;
}

export class DanaPaymentProvider implements PaymentProvider {
  code = 'dana';
  name = 'DANA Gapura QRIS';

  private config: DanaConfig;
  public danaClient: Dana;
  public paymentGateway: PaymentGatewayApi;

  constructor(config: DanaConfig) {
    this.config = config;

    // Explicit environment mapping to SDK constructor
    this.danaClient = new Dana({
      partnerId: this.config.partnerId,
      privateKey: this.config.privateKey,
      origin: this.config.origin,
      env: this.config.environment
    });
    this.paymentGateway = this.danaClient.paymentGatewayApi;
  }

  private validateConfig() {
    if (this.config.environment !== 'sandbox') {
      throw new ProviderError(this.code, 'Only sandbox environment is supported in Phase 3.3', 400);
    }

    if (!this.config.partnerId || !this.config.privateKey || !this.config.merchantId) {
      throw new ProviderError(this.code, 'DANA Provider SNAP credentials not configured', 500);
    }

    if (!this.config.externalStoreId) {
      throw new ProviderError(this.code, 'DANA externalStoreId is mandatory for QRIS', 500);
    }
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    this.validateConfig();

    try {
      // ADMS controls idempotency. Max 25 chars for QRIS.
      const txIdStr = String(data.transactionId);
      const hashPart = crypto.createHash('sha256').update(txIdStr).digest('hex').substring(0, 20);
      const partnerReferenceNo = `ADMS-${hashPart}`;

      // Custom Checkout QRIS payload mapping
      const payload: CreateOrderByApiRequest = {
        partnerReferenceNo,
        merchantId: this.config.merchantId,
        externalStoreId: this.config.externalStoreId, // Top level field
        amount: {
          value: data.amount.toFixed(2),
          currency: "IDR"
        },
        validUpTo: (() => {
          const d = new Date(Date.now() + 30 * 60000);
          const jakarta = new Date(d.getTime() + 7 * 3600 * 1000);
          return jakarta.toISOString().slice(0, 19) + '+07:00';
        })(),
        urlParams: [
          {
            url: `${this.config.origin}/api/payments/webhook/dana`,
            type: 'NOTIFICATION',
            isDeeplink: 'FALSE'
          },
          {
            url: `${this.config.origin}/payments/success`,
            type: 'PAY_RETURN',
            isDeeplink: 'FALSE'
          }
        ],
        additionalInfo: {
          mcc: '5499',
          envInfo: {
            terminalType: 'SYSTEM'
          },
          order: {
            orderTitle: data.description || `Payment ${partnerReferenceNo}`,
            scenario: 'API'
          }
        },
        payOptionDetails: [
          {
            payMethod: PayOptionDetailPayMethodEnum.NetworkPay,
            payOption: PayOptionDetailPayOptionEnum.NetworkPayPgQris,
            transAmount: {
              value: data.amount.toFixed(2),
              currency: "IDR"
            }
          }
        ]
      };

      const response = await this.paymentGateway.createOrder(payload);

      return {
        providerId: 2,
        providerReference: partnerReferenceNo, // deterministic
        qrContent: response.additionalInfo?.paymentCode || 'MOCK_QR_CONTENT_OR_MISSING',
        paymentMethod: 'DANA_QRIS',
        status: 'PENDING',
        rawPayload: response
      };
    } catch (error: any) {
      this.handleSdkError(error);
    }
  }

  async checkPayment(providerReference: string): Promise<PaymentStatusResult> {
    this.validateConfig();

    try {
      const payload: QueryPaymentRequest = {
        merchantId: this.config.merchantId,
        originalPartnerReferenceNo: providerReference,
        serviceCode: '54',
        externalStoreId: this.config.externalStoreId
      };

      const response = await this.paymentGateway.queryPayment(payload);

      const statusMap: Record<string, 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED' | 'REFUNDED'> = {
        '00': 'PAID',
        '01': 'PENDING',
        '02': 'PENDING',
        '05': 'FAILED',
        '07': 'FAILED'
      };

      return {
        providerReference,
        status: statusMap[response.latestTransactionStatus] || 'PENDING',
        rawPayload: response,
      };
    } catch (error: any) {
      this.handleSdkError(error);
    }
  }

  async cancelPayment(providerReference: string): Promise<{ success: boolean; message: string }> {
    this.validateConfig();
    return {
      success: true,
      message: `DANA Placeholder: Pembatalan transaksi ${providerReference} diproses.`,
    };
  }

  async refundPayment(providerReference: string, amount?: number): Promise<{ success: boolean; message: string }> {
    this.validateConfig();
    return {
      success: true,
      message: `DANA Placeholder: Pengembalian dana transaksi ${providerReference} diproses.`,
    };
  }

  async handleWebhook(payload: any, headers?: any, rawBody?: string): Promise<WebhookResult> {
    if (!this.config.publicKey) {
      throw new ProviderError(this.code, 'DANA Public Key is missing for webhook verification', 500);
    }

    try {
      // DANA WebhookParser needs method, relative path, headers and raw JSON body
      const parser = new WebhookParser(this.config.publicKey);
      const parsedRequest = parser.parseWebhook('POST', '/v1.0/debit/notify', headers || {}, rawBody || JSON.stringify(payload));

      const reference = parsedRequest.originalPartnerReferenceNo || parsedRequest.originalReferenceNo || 'DANA-UNKNOWN';
      const status = parsedRequest.latestTransactionStatus === '00' ? 'PAID' : 'PENDING';

      return {
        providerReference: reference,
        status: status,
        paidAt: status === 'PAID' ? new Date().toISOString() : null,
        eventType: 'DANA_WEBHOOK_EVENT',
        isValid: true,
        rawPayload: parsedRequest,
      };
    } catch (error: any) {
      throw new ProviderError(this.code, `VALIDATION_ERROR: Invalid DANA Webhook Signature. ${error.message}`, 400);
    }
  }

  private handleSdkError(error: any): never {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.name === 'TimeoutError') {
      throw new ProviderError('dana', 'DANA Provider network timeout', 504);
    }

    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401 || status === 403) {
      throw new ProviderError('dana', 'AUTHENTICATION_ERROR: Invalid DANA credentials', 401);
    }

    if (status === 400 || status === 422 || error.name === 'ValidationError') {
      throw new ProviderError('dana', `VALIDATION_ERROR: ${data?.message || error.message || 'Invalid request payload'}`, 400);
    }

    if (status === 429) {
      throw new ProviderError('dana', 'RATE_LIMITED: DANA API rate limit exceeded', 429);
    }

    if (status >= 500) {
      throw new ProviderError('dana', 'PROVIDER_UNAVAILABLE: DANA API is currently unavailable', 502);
    }

    throw new ProviderError('dana', `UNKNOWN_PROVIDER_ERROR: An unknown error occurred with DANA API. ${error.message || ''}`, 500);
  }
}
