import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { renderTemplate } from '../templates';
import { emitTelemetry } from '../telemetry';

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

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

    await transporter.sendMail({
      to,
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      subject: rendered.subject,
      html:    rendered.html,
      text:    rendered.text,
    });

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
