import { env } from './config/env';

// Minimal Paystack transfer client (escrow payout to talents). Kept local to
// payment-service so releaseFunds can move money in one place; mirrors the
// transfer helpers in paystack-service.
async function paystack(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${env.PAYSTACK_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.status === false) {
    throw new Error(json?.message ?? `Paystack request failed (${res.status})`);
  }
  return json.data;
}

export const paystackTransfers = {
  /** Create (or reuse) an NGN transfer recipient from bank details. */
  async createRecipient(params: {
    name: string;
    accountNumber: string;
    bankCode: string;
    currency?: string;
  }): Promise<string> {
    const data = await paystack('/transferrecipient', {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: params.currency ?? 'NGN',
    });
    return data.recipient_code as string;
  },

  /** Initiate a transfer from the platform balance to a recipient. */
  async transfer(params: {
    amountKobo: number;
    recipientCode: string;
    reference: string;
    reason?: string;
  }): Promise<{ transferCode: string; status: string; reference: string }> {
    const data = await paystack('/transfer', {
      source: 'balance',
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason ?? 'QueenSkiilia project payout',
    });
    return {
      transferCode: data.transfer_code,
      status: data.status,
      reference: data.reference,
    };
  },
};
