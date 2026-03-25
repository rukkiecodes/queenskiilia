import { Router, Request, Response } from 'express';
import { getIO } from '../socket';
import { env } from '../config/env';
import { emitTelemetry } from '../telemetry';

const router = Router();

// Internal auth guard — only other microservices may call these routes
function requireInternalSecret(req: Request, res: Response, next: () => void): void {
  const secret = req.headers['x-internal-secret'];
  if (secret !== env.INTERNAL_SECRET) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

// POST /internal/emit
// Body: { room: string, event: string, data: unknown }
// Called by any microservice to push a Socket.IO event to a specific room
router.post('/emit', requireInternalSecret, async (req: Request, res: Response) => {
  const start = Date.now();
  const { room, event, data } = req.body;

  if (!room || !event) {
    res.status(400).json({ error: 'room and event are required' });
    return;
  }

  try {
    const io = getIO();
    io.to(room).emit(event, data);

    await emitTelemetry({
      operationType: 'internal',
      operationName: 'POST /internal/emit',
      durationMs: Date.now() - start,
      status: 'success',
      meta: { room, event },
    });

    res.json({ ok: true });
  } catch (err: any) {
    await emitTelemetry({
      operationType: 'internal',
      operationName: 'POST /internal/emit',
      durationMs: Date.now() - start,
      status: 'error',
      errorMessage: err.message,
    });
    res.status(500).json({ error: 'Failed to emit event' });
  }
});

export { router as internalRouter };
