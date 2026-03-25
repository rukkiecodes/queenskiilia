import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { env } from './config/env';
import { internalRouter } from './routes/internal';

function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-internal-secret'] !== env.INTERNAL_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

async function bootstrap() {
  const app        = express();
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '10mb' })); // allow base64 images in data

  app.use('/internal', requireInternalSecret, internalRouter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: env.SERVICE_NAME }));

  httpServer.listen(env.PORT, () => {
    console.log(`\n  [${env.SERVICE_NAME}] Running on http://localhost:${env.PORT}\n`);
    if (!env.SENDGRID_API_KEY) {
      console.log('  ⚠  SENDGRID_API_KEY not set — emails will be logged to console only\n');
    }
  });
}

bootstrap().catch((err) => { console.error('Fatal:', err); process.exit(1); });
