import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

function mapDispute(r: any) {
  return {
    id: r.id, projectId: r.project_id, raisedBy: r.raised_by,
    reason: r.reason, evidence: r.evidence ?? [],
    status: r.status, resolution: r.resolution,
    adminNote: r.admin_note, createdAt: r.created_at, resolvedAt: r.resolved_at,
  };
}

export const disputeQueries = {
  async dispute(_: any, { id }: any) {
    const r = await db.query(`SELECT * FROM disputes WHERE id = $1`, [id]);
    return r.rowCount ? mapDispute(r.rows[0]) : null;
  },

  async projectDispute(_: any, { projectId }: any) {
    const r = await db.query(`SELECT * FROM disputes WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`, [projectId]);
    return r.rowCount ? mapDispute(r.rows[0]) : null;
  },

  async myDisputes(_: any, __: any, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(`SELECT * FROM disputes WHERE raised_by = $1 ORDER BY created_at DESC`, [userId]);
    return r.rows.map(mapDispute);
  },
};

export const disputeMutations = {
  async raiseDispute(_: any, { input }: any, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    const project = await db.query(
      `SELECT id, business_id, selected_student, status FROM projects WHERE id = $1`,
      [input.projectId]
    );
    if (!project.rowCount) {
      throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
    }

    const p = project.rows[0];
    const isParticipant = p.business_id === userId || p.selected_student === userId;
    if (!isParticipant) {
      throw new GraphQLError('You did not participate in this project', { extensions: { code: 'FORBIDDEN' } });
    }

    if (!['in_progress', 'under_review'].includes(p.status)) {
      throw new GraphQLError('Disputes can only be raised on active projects', { extensions: { code: 'FORBIDDEN' } });
    }

    try {
      // Update project status to disputed
      await db.query(
        `UPDATE projects SET status = 'disputed', updated_at = NOW() WHERE id = $1`,
        [input.projectId]
      );

      // Update escrow status to disputed
      await db.query(
        `UPDATE escrow_accounts SET status = 'disputed' WHERE project_id = $1`,
        [input.projectId]
      );

      const result = await db.query(
        `INSERT INTO disputes (project_id, raised_by, reason, evidence)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.projectId, userId, input.reason, input.evidence ?? []]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'raiseDispute',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapDispute(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'raiseDispute',
        userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message,
      });
      throw err;
    }
  },

  async resolveDispute(_: any, { id, resolution, adminNote }: any, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    const validResolutions = ['release_to_student', 'refund_to_business', 'split'];
    if (!validResolutions.includes(resolution)) {
      throw new GraphQLError(`resolution must be one of: ${validResolutions.join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    try {
      const result = await db.query(
        `UPDATE disputes
         SET status = 'resolved', resolution = $2, admin_note = $3, resolved_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, resolution, adminNote ?? null]
      );

      if (!result.rowCount) {
        throw new GraphQLError('Dispute not found', { extensions: { code: 'NOT_FOUND' } });
      }

      const dispute = result.rows[0];

      // Update project and escrow based on resolution
      if (resolution === 'release_to_student') {
        await db.query(
          `UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [dispute.project_id]
        );
        await db.query(
          `UPDATE escrow_accounts SET status = 'released', released_at = NOW() WHERE project_id = $1`,
          [dispute.project_id]
        );
      } else if (resolution === 'refund_to_business') {
        await db.query(
          `UPDATE projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
          [dispute.project_id]
        );
        await db.query(
          `UPDATE escrow_accounts SET status = 'refunded' WHERE project_id = $1`,
          [dispute.project_id]
        );
      }

      emitTelemetry({
        operationType: 'mutation', operationName: 'resolveDispute',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapDispute(dispute);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'resolveDispute',
        userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message,
      });
      throw err;
    }
  },
};
