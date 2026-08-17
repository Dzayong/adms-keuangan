import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  invoiceNumber: string;
  transactionId: number;
  paymentId: number;
  amount: number;
  customerName: string;
  customerPhone: string;
  description: string;
  status: string;
  paidAt: string | null;
  paymentMethod: string;
  sourceSystem: string | null;
  timestamp: string;
}

function signPayload(body: string): string {
  const secret = process.env.JWT_SECRET || 'adms_webhook_secret';
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export async function fireWebhook(callbackUrl: string, payload: WebhookPayload): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body);

  const attempt = async () => {
    const resp = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ADMS-Signature': signature,
        'X-ADMS-Event': payload.event,
        'User-Agent': 'ADMS-Payment-Gateway/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) throw new Error(`Webhook returned ${resp.status}`);
  };

  try {
    await attempt();
  } catch {
    // Retry once after 3 seconds
    await new Promise(r => setTimeout(r, 3000));
    try {
      await attempt();
    } catch (err: any) {
      console.error(`[Webhook] Failed to deliver to ${callbackUrl}: ${err.message}`);
    }
  }
}
