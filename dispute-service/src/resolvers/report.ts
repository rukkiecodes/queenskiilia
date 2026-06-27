import { GraphQLError } from 'graphql';
import { db } from '../shared/db';

function requireAuth(ctx: any): string {
  if (!ctx.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}

// ── Allow-lists kept in lock-step with the mobile UI dropdowns. New options
// must be added here AND in client/mobile/lib/reports-api.ts. The validators
// are explicit (vs. CHECK constraints in SQL) so we can return a clean
// BAD_USER_INPUT error instead of a Postgres exception.
const TARGET_TYPES = ['user', 'project', 'message'] as const;
const REASONS = ['spam', 'harassment', 'inappropriate', 'scam', 'other'] as const;

function mapReport(r: any) {
  return {
    id:         r.id,
    reporterId: r.reporter_id,
    targetType: r.target_type,
    targetId:   r.target_id,
    reason:     r.reason,
    details:    r.details,
    status:     r.status,
    adminNote:  r.admin_note,
    createdAt:  r.created_at,
    reviewedAt: r.reviewed_at,
  };
}

export const reportQueries = {
  async myReports(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(
      `SELECT * FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [userId]
    );
    return r.rows.map(mapReport);
  },
};

export const reportMutations = {
  async submitReport(
    _: unknown,
    {
      input,
    }: {
      input: {
        targetType: string;
        targetId: string;
        reason: string;
        details?: string;
      };
    },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (!TARGET_TYPES.includes(input.targetType as (typeof TARGET_TYPES)[number])) {
      throw new GraphQLError(
        `targetType must be one of: ${TARGET_TYPES.join(', ')}`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }
    if (!REASONS.includes(input.reason as (typeof REASONS)[number])) {
      throw new GraphQLError(`reason must be one of: ${REASONS.join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (input.targetType === 'user' && input.targetId === userId) {
      throw new GraphQLError('You cannot report yourself', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Idempotency: short-circuit if this reporter already has an OPEN report
    // for this target. We return the existing row instead of throwing so the
    // client can treat the success/already-reported cases identically.
    const existing = await db.query(
      `SELECT * FROM reports
       WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status = 'open'
       LIMIT 1`,
      [userId, input.targetType, input.targetId]
    );
    if (existing.rowCount) {
      return mapReport(existing.rows[0]);
    }

    const result = await db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, input.targetType, input.targetId, input.reason, input.details ?? null]
    );

    // Cross-service write (matches the Feature 11/12 pattern): on a user
    // report, flip is_flagged so admin tooling can triage. We don't unflag
    // automatically — dismissal of a report is a separate admin action.
    if (input.targetType === 'user') {
      await db.query(
        `UPDATE users SET is_flagged = TRUE, updated_at = NOW() WHERE id = $1`,
        [input.targetId]
      );
    }

    return mapReport(result.rows[0]);
  },
};
