import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from './config/env';
import { db } from './shared/db';

const router = Router();

// POST /webhook/paystack
// Paystack sends events here after payment/transfer state changes
router.post('/', async (req: Request, res: Response) => {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    res.status(401).send('Unauthorized');
    return;
  }

  const event = req.body;
  res.sendStatus(200); // Acknowledge immediately

  // Process asynchronously — don't block the response
  setImmediate(async () => {
    try {
      switch (event.event) {
        case 'charge.success': {
          const reference = event.data?.reference as string;
          if (!reference) break;

          // Update escrow gateway_ref if this reference matches a pending escrow
          await db.query(
            `UPDATE escrow_accounts
             SET gateway_ref = $1
             WHERE gateway_ref IS NULL
               AND status = 'pending'
             LIMIT 1`,
            [reference]
          );
          break;
        }

        case 'transfer.success': {
          break;
        }

        case 'transfer.failed': {
          break;
        }
      }
    } catch (err: any) {
      console.error('[Paystack Webhook] Processing error:', err.message);
    }
  });
});

export { router as webhookRouter };
