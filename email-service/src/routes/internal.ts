import { Router, Request, Response } from 'express';
import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { renderTemplate } from '../templates';
import { emitTelemetry } from '../telemetry';

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

const router = Router();

// POST /internal/send
// Body: { to: string, template: string, data: object }
// Called only by other microservices via X-Internal-Secret header
router.post('/send', async (req: Request, res: Response) => {
  const start = Date.now();
  const { to, template, data } = req.body;

  if (!to || !template) {
    res.status(400).json({ error: 'to and template are required' });
    return;
  }

  try {
    const rendered = renderTemplate(template, data ?? {});

    if (!env.SENDGRID_API_KEY) {
      // Development mode — log to console instead of sending
      console.log(`\n[Email] TO: ${to}`);
      console.log(`[Email] SUBJECT: ${rendered.subject}`);
      console.log(`[Email] TEXT: ${rendered.text}\n`);
    } else {
      await sgMail.send({
        to,
        from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
        subject: rendered.subject,
        html:    rendered.html,
        text:    rendered.text,
      });
    }

    emitTelemetry({
      operationType: 'internal', operationName: 'POST /internal/send',
      durationMs: Date.now() - start, status: 'success',
      meta: { template, to },
    });

    res.json({ ok: true });
  } catch (err: any) {
    emitTelemetry({
      operationType: 'internal', operationName: 'POST /internal/send',
      durationMs: Date.now() - start, status: 'error', errorMessage: err.message,
    });
    console.error('[Email] Send error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export { router as internalRouter };
