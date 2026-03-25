import axios from 'axios';
import { env } from './config/env';

const client = axios.create({
  baseURL: env.PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

export interface InitializePaymentParams {
  email:     string;
  amount:    number;   // in kobo (NGN * 100)
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
}

export interface VerifyPaymentResult {
  reference: string;
  status:    string;     // 'success' | 'failed' | 'pending'
  amount:    number;     // in kobo
  currency:  string;
  paidAt:    string | null;
  gateway_response: string;
}

export interface TransferRecipientResult {
  recipientCode: string;
}

export interface TransferResult {
  transferCode: string;
  reference:    string;
  status:       string;
}

export const paystackClient = {
  async initializeTransaction(params: InitializePaymentParams) {
    const res = await client.post('/transaction/initialize', {
      email:        params.email,
      amount:       params.amount,
      reference:    params.reference,
      metadata:     params.metadata,
      callback_url: params.callback_url,
    });
    return res.data.data as { authorization_url: string; access_code: string; reference: string };
  },

  async verifyTransaction(reference: string): Promise<VerifyPaymentResult> {
    const res = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);
    const d   = res.data.data;
    return {
      reference:        d.reference,
      status:           d.status,
      amount:           d.amount,
      currency:         d.currency,
      paidAt:           d.paid_at,
      gateway_response: d.gateway_response,
    };
  },

  async createTransferRecipient(params: {
    name:          string;
    accountNumber: string;
    bankCode:      string;
    currency?:     string;
  }): Promise<TransferRecipientResult> {
    const res = await client.post('/transferrecipient', {
      type:           'nuban',
      name:           params.name,
      account_number: params.accountNumber,
      bank_code:      params.bankCode,
      currency:       params.currency ?? 'NGN',
    });
    return { recipientCode: res.data.data.recipient_code };
  },

  async initiateTransfer(params: {
    amount:        number;  // in kobo
    recipientCode: string;
    reference:     string;
    reason?:       string;
  }): Promise<TransferResult> {
    const res = await client.post('/transfer', {
      source:    'balance',
      amount:    params.amount,
      recipient: params.recipientCode,
      reference: params.reference,
      reason:    params.reason ?? 'QueenSkiilia project payment',
    });
    return {
      transferCode: res.data.data.transfer_code,
      reference:    res.data.data.reference,
      status:       res.data.data.status,
    };
  },

  async listBanks() {
    const res = await client.get('/bank?currency=NGN&per_page=100');
    return res.data.data as Array<{ name: string; code: string; slug: string }>;
  },
};
