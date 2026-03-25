import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';
import { env } from '../config/env';
import { requireAuth, requireAccountType } from './helpers';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapEscrow(row: any) {
  return {
    id:          row.id,
    projectId:   row.project_id,
    businessId:  row.business_id,
    studentId:   row.student_id,
    amount:      parseFloat(row.amount),
    currency:    row.currency,
    gateway:     row.gateway,
    gatewayRef:  row.gateway_ref ?? null,
    status:      row.status,
    platformFee: row.platform_fee != null ? parseFloat(row.platform_fee) : null,
    createdAt:   row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    releasedAt:  row.released_at
      ? (row.released_at instanceof Date ? row.released_at.toISOString() : String(row.released_at))
      : null,
  };
}

function mapMilestone(row: any) {
  return {
    id:         row.id,
    escrowId:   row.escrow_id,
    label:      row.label,
    amount:     parseFloat(row.amount),
    percentage: row.percentage != null ? parseInt(row.percentage, 10) : null,
    status:     row.status,
    releasedAt: row.released_at
      ? (row.released_at instanceof Date ? row.released_at.toISOString() : String(row.released_at))
      : null,
  };
}

function mapTransaction(row: any) {
  return {
    id:         row.id,
    userId:     row.user_id,
    escrowId:   row.escrow_id,
    type:       row.type,
    amount:     parseFloat(row.amount),
    currency:   row.currency,
    gatewayRef: row.gateway_ref ?? null,
    createdAt:  row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

// ── Query resolvers ───────────────────────────────────────────────────────────

export const paymentQueries = {
  async escrow(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const start = Date.now();
    try {
      const result = await db.query(
        `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
        [projectId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'escrow',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rowCount ? mapEscrow(result.rows[0]) : null;
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'escrow',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async myEscrows(_: unknown, __: unknown, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    try {
      const result = await db.query(
        `SELECT * FROM escrow_accounts WHERE business_id = $1 OR student_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'myEscrows',
        userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapEscrow);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'myEscrows',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async transactions(_: unknown, { escrowId }: { escrowId: string }, ctx: any) {
    const start = Date.now();
    try {
      const result = await db.query(
        `SELECT * FROM payment_transactions WHERE escrow_id = $1 ORDER BY created_at DESC`,
        [escrowId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'transactions',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapTransaction);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'transactions',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async milestones(_: unknown, { escrowId }: { escrowId: string }, ctx: any) {
    const start = Date.now();
    try {
      const result = await db.query(
        `SELECT * FROM milestones WHERE escrow_id = $1 ORDER BY created_at ASC`,
        [escrowId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'milestones',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapMilestone);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'milestones',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const paymentMutations = {
  async initiateEscrow(
    _: unknown,
    { input }: { input: {
      projectId: string;
      studentId: string;
      amount: number;
      currency?: string;
      gateway?: string;
      gatewayRef?: string;
    }},
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    try {
      // Check no existing escrow for this project
      const existing = await db.query(
        `SELECT id FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
        [input.projectId]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        throw new GraphQLError('An escrow account already exists for this project', {
          extensions: { code: 'CONFLICT' },
        });
      }

      const platformFee = input.amount * env.PLATFORM_FEE_PERCENT / 100;
      const currency    = input.currency ?? 'NGN';
      const gateway     = input.gateway  ?? 'paystack';
      const escrowId    = randomUUID();

      // Insert escrow with status='held'
      const escrowResult = await db.query(
        `INSERT INTO escrow_accounts
           (id, project_id, business_id, student_id, amount, currency, gateway, gateway_ref, status, platform_fee)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'held', $9)
         RETURNING *`,
        [
          escrowId,
          input.projectId,
          userId,
          input.studentId,
          input.amount,
          currency,
          gateway,
          input.gatewayRef ?? null,
          platformFee,
        ]
      );

      // Insert deposit transaction
      await db.query(
        `INSERT INTO payment_transactions
           (id, user_id, escrow_id, type, amount, currency, gateway_ref)
         VALUES ($1, $2, $3, 'deposit', $4, $5, $6)`,
        [
          randomUUID(),
          userId,
          escrowId,
          input.amount,
          currency,
          input.gatewayRef ?? null,
        ]
      );

      // Update project status to 'in_progress' if it's 'open'
      await db.query(
        `UPDATE projects SET status = 'in_progress', updated_at = NOW()
         WHERE id = $1 AND status = 'open'`,
        [input.projectId]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'initiateEscrow',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { projectId: input.projectId, amount: input.amount },
      });

      return mapEscrow(escrowResult.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'initiateEscrow',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async releaseFunds(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    try {
      // Fetch escrow and verify ownership + status
      const escrowResult = await db.query(
        `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
        [projectId]
      );
      if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
        throw new GraphQLError('Escrow not found for this project', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const escrow = escrowResult.rows[0];

      if (escrow.business_id !== userId) {
        throw new GraphQLError('Only the business owner can release funds', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (escrow.status !== 'held') {
        throw new GraphQLError(`Cannot release funds: escrow status is '${escrow.status}'`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const currency = escrow.currency as string;
      const amount   = parseFloat(escrow.amount);
      const fee      = escrow.platform_fee != null ? parseFloat(escrow.platform_fee) : 0;

      // Set escrow status='released', released_at=NOW()
      const updatedEscrow = await db.query(
        `UPDATE escrow_accounts
         SET status = 'released', released_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [escrow.id]
      );

      // Set project status='completed'
      await db.query(
        `UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );

      // Insert release transaction
      await db.query(
        `INSERT INTO payment_transactions
           (id, user_id, escrow_id, type, amount, currency, gateway_ref)
         VALUES ($1, $2, $3, 'release', $4, $5, $6)`,
        [
          randomUUID(),
          escrow.student_id,
          escrow.id,
          amount,
          currency,
          escrow.gateway_ref ?? null,
        ]
      );

      // Insert fee transaction for platform fee
      if (fee > 0) {
        await db.query(
          `INSERT INTO payment_transactions
             (id, user_id, escrow_id, type, amount, currency, gateway_ref)
           VALUES ($1, $2, $3, 'fee', $4, $5, $6)`,
          [
            randomUUID(),
            userId,
            escrow.id,
            fee,
            currency,
            escrow.gateway_ref ?? null,
          ]
        );
      }

      // Update student's total_earnings in student_profiles
      await db.query(
        `UPDATE student_profiles
         SET total_earnings = total_earnings + $2, updated_at = NOW()
         WHERE user_id = $1`,
        [escrow.student_id, amount - fee]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'releaseFunds',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { projectId, escrowId: escrow.id },
      });

      return mapEscrow(updatedEscrow.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'releaseFunds',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async refundEscrow(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    try {
      // Fetch escrow and verify ownership + status
      const escrowResult = await db.query(
        `SELECT * FROM escrow_accounts WHERE project_id = $1 LIMIT 1`,
        [projectId]
      );
      if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
        throw new GraphQLError('Escrow not found for this project', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const escrow = escrowResult.rows[0];

      if (escrow.business_id !== userId) {
        throw new GraphQLError('Only the business owner can refund this escrow', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (escrow.status !== 'held' && escrow.status !== 'disputed') {
        throw new GraphQLError(
          `Cannot refund: escrow status is '${escrow.status}'. Must be 'held' or 'disputed'`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Set escrow status='refunded'
      const updatedEscrow = await db.query(
        `UPDATE escrow_accounts SET status = 'refunded' WHERE id = $1 RETURNING *`,
        [escrow.id]
      );

      // Set project status='cancelled'
      await db.query(
        `UPDATE projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [projectId]
      );

      // Insert refund transaction
      await db.query(
        `INSERT INTO payment_transactions
           (id, user_id, escrow_id, type, amount, currency, gateway_ref)
         VALUES ($1, $2, $3, 'refund', $4, $5, $6)`,
        [
          randomUUID(),
          userId,
          escrow.id,
          parseFloat(escrow.amount),
          escrow.currency,
          escrow.gateway_ref ?? null,
        ]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'refundEscrow',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { projectId, escrowId: escrow.id },
      });

      return mapEscrow(updatedEscrow.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'refundEscrow',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async addMilestone(
    _: unknown,
    { input }: { input: {
      escrowId: string;
      label: string;
      amount: number;
      percentage?: number;
    }},
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    try {
      // Verify the escrow belongs to this business owner
      const escrowResult = await db.query(
        `SELECT * FROM escrow_accounts WHERE id = $1 LIMIT 1`,
        [input.escrowId]
      );
      if (!escrowResult.rowCount || escrowResult.rowCount === 0) {
        throw new GraphQLError('Escrow not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const escrow = escrowResult.rows[0];
      if (escrow.business_id !== userId) {
        throw new GraphQLError('Only the business owner can add milestones', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const result = await db.query(
        `INSERT INTO milestones (id, escrow_id, label, amount, percentage, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [
          randomUUID(),
          input.escrowId,
          input.label,
          input.amount,
          input.percentage ?? null,
        ]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'addMilestone',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { escrowId: input.escrowId },
      });

      return mapMilestone(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'addMilestone',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async releaseMilestone(_: unknown, { milestoneId }: { milestoneId: string }, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    requireAccountType(ctx, 'business');

    try {
      // Fetch milestone and verify ownership via escrow
      const milestoneResult = await db.query(
        `SELECT m.*, e.business_id FROM milestones m
         JOIN escrow_accounts e ON e.id = m.escrow_id
         WHERE m.id = $1 LIMIT 1`,
        [milestoneId]
      );
      if (!milestoneResult.rowCount || milestoneResult.rowCount === 0) {
        throw new GraphQLError('Milestone not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const milestone = milestoneResult.rows[0];

      if (milestone.business_id !== userId) {
        throw new GraphQLError('Only the business owner can release milestones', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const result = await db.query(
        `UPDATE milestones
         SET status = 'released', released_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [milestoneId]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'releaseMilestone',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { milestoneId },
      });

      return mapMilestone(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'releaseMilestone',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Federation __resolveReference ────────────────────────────────────────────

export const escrowReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM escrow_accounts WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapEscrow(result.rows[0]) : null;
  },
};

export const milestoneReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM milestones WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapMilestone(result.rows[0]) : null;
  },
};

export const transactionReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM payment_transactions WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapTransaction(result.rows[0]) : null;
  },
};
