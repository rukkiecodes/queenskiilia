import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import { env } from './config/env';
import { examRouter } from './routes/exam';

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    service: env.SERVICE_NAME,
    status: 'ok',
    model: env.GEMINI_MODEL,
    endpoints: { health: '/health', exam: ['/exam/generate-questions', '/exam/grade-answer'] },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: env.SERVICE_NAME, model: env.GEMINI_MODEL });
});

// Internal-only guard: /exam/* requires the shared secret when one is configured.
app.use(
  '/exam',
  (req, res, next) => {
    if (env.INTERNAL_API_KEY && req.headers['x-internal-key'] !== env.INTERNAL_API_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  },
  examRouter,
);

httpServer.listen(env.PORT, () => {
  console.log(`\n  [${env.SERVICE_NAME}] Running on http://localhost:${env.PORT} (model: ${env.GEMINI_MODEL})\n`);
});

export default app;
