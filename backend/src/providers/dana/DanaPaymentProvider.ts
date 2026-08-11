import {
  PaymentProvider,
  CreatePaymentDTO,
  PaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from '../PaymentProvider.js';
import { ProviderError } from '../../utils/errors.js';
import { DanaHttpClient } from './DanaHttpClient.js';
import crypto from 'crypto';

export interface DanaConfig {
  merchantId: string;
  partnerId: string;
  privateKey: string;
  origin: string;
  environment: string;
  externalStoreId: string;
}

export class DanaPaymentProvider implements PaymentProvider {
  code = 'dana';
  name = 'DANA Gapura QRIS';

  private config: DanaConfig;
  public httpClient: DanaHttpClient;

  constructor(config: DanaConfig) {
    this.config = config;
    this.httpClient = new DanaHttpClient();
  }

  private validateConfig() {
    if (this.config.environment !== 'sandbox') {
      throw new ProviderError(this.code, 'Only sandbox environment is supported in Phase 3.2', 400);
    }

    if (!this.config.partnerId || !this.config.privateKey || !this.config.merchantId) {
      throw new ProviderError(this.code, 'DANA Provider SNAP credentials not configured', 500);
    }

    if (!this.config.externalStoreId) {
      throw new ProviderError(this.code, 'DANA externalStoreId is mandatory for QRIS', 500);
    }
  }

  private async generateSnapAsymmetricSignature(token: string, payload: any, timestamp: string): Promise<string> {
    // NOT PRODUCTION READY
    // Placeholder for official Asymmetric Signature method.
    // The official DANA Create Order API (/payment-gateway/v1.0/debit/payment-host-to-host.htm)
    // requires X-SIGNATURE to be generated using the asymmetricSignature method.
    // In production (Phase 3.3), we will strictly use `dana-node` SDK to generate this securely.
    if (!this.config.privateKey) {
      throw new ProviderError(this.code, 'Private key required for Asymmetric Signature', 500);
    }
    return 'MOCK_ASYMMETRIC_SIGNATURE_TO_BE_REPLACED_BY_DANA_NODE';
  }

  private async authenticate(): Promise<string> {
    try {
      // B2B Access Token API mapping placeholder (SNAP /access-token/b2b)
      // Uses Asymmetric RSA-SHA256 signature for authentication.
      const timestamp = new Date().toISOString();
      const headers = {
        'X-TIMESTAMP': timestamp,
        'X-CLIENT-KEY': this.config.partnerId,
        'X-SIGNATURE': await this.generateSnapAsymmetricSignature('', {}, timestamp)
      };

      const response = await this.httpClient.post('/v1.0/access-token/b2b', {
        grantType: 'client_credentials'
      }, headers);

      return response.data.accessToken || 'mock_token';
    } catch (error: any) {
      this.httpClient.handleNetworkError(error);
    }
  }

  async createPayment(data: CreatePaymentDTO): Promise<PaymentResult> {
    this.validateConfig();
    const token = await this.authenticate();
    const timestamp = new Date().toISOString();

    try {
      // Internal Idempotency mapped to DANA partnerReferenceNo (Max 25 chars for QRIS)
      const txIdStr = String(data.transactionId);
      const hashPart = crypto.createHash('sha256').update(txIdStr).digest('hex').substring(0, 20);
      const partnerReferenceNo = `ADMS-${hashPart}`;

      // Gapura Create Order URL
      const payload = {
        partnerReferenceNo,
        merchantId: this.config.merchantId,
        externalStoreId: this.config.externalStoreId, // MANDATORY for QRIS
        amount: {
          value: data.amount.toFixed(2),
          currency: "IDR"
        },
        validUpTo: new Date(Date.now() + 30 * 60000).toISOString(), // <= 30 mins
        payOptionDetails: [
          {
            payMethod: "NETWORK_PAY",
            payOption: "NETWORK_PAY_PG_QRIS",
            transAmount: {
              value: data.amount.toFixed(2),
              currency: "IDR"
            }
          }
        ]
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        'X-TIMESTAMP': timestamp,
        'X-PARTNER-ID': this.config.partnerId,
        'X-EXTERNAL-ID': data.invoiceNumber,
        'X-SIGNATURE': await this.generateSnapAsymmetricSignature(token, payload, timestamp),
        'ORIGIN': this.config.origin
      };

      const response = await this.httpClient.post('/payment-gateway/v1.0/debit/payment-host-to-host.htm', payload, headers);

      return {
        providerId: 2,
        providerReference: partnerReferenceNo, // Used response.data.partnerReferenceNo normally
        qrContent: response.data.qrContent || 'MOCK_QR_CONTENT',
        paymentMethod: 'DANA_QRIS',
        status: 'PENDING',
        rawPayload: response.data
      };
    } catch (error: any) {
      this.httpClient.handleNetworkError(error);
    }
  }

  async checkPayment(providerReference: string): Promise<PaymentStatusResult> {
    this.validateConfig();
    const token = await this.authenticate();
    const timestamp = new Date().toISOString();

    try {
      const payload = {
        merchantId: this.config.merchantId,
        partnerReferenceNo: providerReference
      };

      const headers = {
        Authorization: `Bearer ${token}`,
        'X-TIMESTAMP': timestamp,
        'X-PARTNER-ID': this.config.partnerId,
        'X-EXTERNAL-ID': providerReference,
        'X-SIGNATURE': await this.generateSnapAsymmetricSignature(token, payload, timestamp),
        'ORIGIN': this.config.origin
      };

      const response = await this.httpClient.post('/payment-gateway/v1.0/debit/payment-host-to-host.htm', payload, headers);

      const statusMap: Record<string, any> = {
        'SUCCESS': 'PAID',
        'PENDING': 'PENDING',
        'FAILED': 'FAILED'
      };

      return {
        providerReference,
        status: statusMap[response.data.status] || 'PENDING',
        rawPayload: response.data,
      };
    } catch (error: any) {
      this.httpClient.handleNetworkError(error);
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

  async handleWebhook(payload: any, headers?: any): Promise<WebhookResult> {
    // NOT PRODUCTION READY
    // DANA Finish Notify Verification Placeholder
    // The official Finish Notify webhook requires verification using the DANA Public Key.
    // The official dana-node SDK must be used to perform this signature verification.
    const isValidSignature = headers?.['x-signature'] ? true : false;

    if (!isValidSignature) {
       throw new ProviderError(this.code, 'VALIDATION_ERROR: Invalid DANA Webhook Signature', 400);
    }

    const reference = payload?.partnerReferenceNo || payload?.reference || 'DANA-UNKNOWN';
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
