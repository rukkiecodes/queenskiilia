import axios from 'axios';
import { env } from '../config/env';

export interface EmailPayload {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await axios.post(`${env.EMAIL_SERVICE_URL}/internal/send`, payload, {
    headers: {
      'X-Internal-Secret': env.INTERNAL_SECRET,
      'Content-Type': 'application/json',
    },
    timeout: 8_000,
  });
}
