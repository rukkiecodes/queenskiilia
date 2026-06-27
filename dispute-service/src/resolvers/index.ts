import { disputeQueries, disputeMutations } from './dispute';
import { reportQueries, reportMutations } from './report';
import { adminQueries, adminMutations } from './admin';
import { db } from '../shared/db';

export const resolvers = {
  Query:    { ...disputeQueries, ...reportQueries, ...adminQueries },
  Mutation: { ...disputeMutations, ...reportMutations, ...adminMutations },

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

  Report: {
    async __resolveReference(ref: { id: string }) {
      const r = await db.query(`SELECT * FROM reports WHERE id = $1`, [ref.id]);
      if (!r.rowCount) return null;
      const row = r.rows[0];
      return {
        id: row.id, reporterId: row.reporter_id, targetType: row.target_type,
        targetId: row.target_id, reason: row.reason, details: row.details,
        status: row.status, adminNote: row.admin_note,
        createdAt: row.created_at, reviewedAt: row.reviewed_at,
      };
    },
  },
};
