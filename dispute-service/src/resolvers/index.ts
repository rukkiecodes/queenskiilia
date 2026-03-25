import { disputeQueries, disputeMutations } from './dispute';
import { db } from '../shared/db';

export const resolvers = {
  Query:    disputeQueries,
  Mutation: disputeMutations,
  Dispute: {
    async __resolveReference(ref: { id: string }) {
      const r = await db.query(`SELECT * FROM disputes WHERE id = $1`, [ref.id]);
      if (!r.rowCount) return null;
      const row = r.rows[0];
      return {
        id: row.id, projectId: row.project_id, raisedBy: row.raised_by,
        reason: row.reason, evidence: row.evidence ?? [],
        status: row.status, resolution: row.resolution,
        adminNote: row.admin_note, createdAt: row.created_at, resolvedAt: row.resolved_at,
      };
    },
  },
};
