import { TransactionStatus } from '../models/types.js';

export interface CreatePaymentDTO {
  transactionId: number;
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  description: string;
  expiryMinutes?: number;
}

export interface PaymentResult {
  providerId: number;
  providerReference: string;
  qrContent: string;
  paymentMethod: string;
  status: TransactionStatus;
  rawPayload?: any;
}

export interface PaymentStatusResult {
  providerReference: string;
  status: TransactionStatus;
  paidAt?: string | null;
  rawPayload?: any;
}

export interface WebhookResult {
  providerReference: string;
  status: TransactionStatus;
  paidAt?: string | null;
  eventType: string;
  isValid: boolean;
  rawPayload: any;
}

export interface PaymentProvider {
  code: string;
  name: string;

  createPayment(data: CreatePaymentDTO): Promise<PaymentResult>;
  checkPayment(providerReference: string): Promise<PaymentStatusResult>;
  cancelPayment(providerReference: string): Promise<{ success: boolean; message: string }>;
  refundPayment(providerReference: string, amount?: number): Promise<{ success: boolean; message: string }>;
  handleWebhook(payload: any, headers?: any): Promise<WebhookResult>;
}
