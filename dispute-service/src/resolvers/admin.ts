import { GraphQLError } from 'graphql';
import { db } from '../shared/db';

// Admin-only dispute + report queues (gated by ctx.isAdmin via x-user-admin).

export function requireAdmin(ctx: any) {
  if (!ctx.isAdmin) {
    throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
  }
}

function iso(v: any): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapDispute(row: any) {
  return {
    id: row.id,
    projectId: row.project_id,
    raisedBy: row.raised_by,
    reason: row.reason,
    evidence: row.evidence ?? [],
    status: row.status,
    resolution: row.resolution,
    adminNote: row.admin_note,
    createdAt: iso(row.created_at),
    resolvedAt: iso(row.resolved_at),
    // Enriched context (populated by the admin join query; null elsewhere).
    projectTitle: row.project_title ?? null,
    raiserName: row.raiser_name ?? null,
    businessName: row.business_name ?? null,
    studentName: row.student_name ?? null,
  };
}

function mapReport(row: any) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: iso(row.created_at),
    reviewedAt: iso(row.reviewed_at),
    // Enriched context (populated by the admin join query; null elsewhere).
    reporterName: row.reporter_name ?? null,
    targetLabel: row.target_label ?? null,
  };
}

export const adminQueries = {
  async adminDisputes(
    _: unknown,
    args: { status?: string; limit?: number; offset?: number },
    ctx: any
  ) {
    requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const { rows } = await db.query(
      `SELECT d.*,
              p.title       AS project_title,
              ru.full_name  AS raiser_name,
              bu.full_name  AS business_name,
              su.full_name  AS student_name
       FROM disputes d
       LEFT JOIN projects p ON p.id = d.project_id
       LEFT JOIN users ru ON ru.id = d.raised_by
       LEFT JOIN users bu ON bu.id = p.business_id
       LEFT JOIN users su ON su.id = p.selected_student
       WHERE ($1::text IS NULL OR d.status = $1)
       ORDER BY (d.status IN ('open','under_review')) DESC, d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [args.status ?? null, limit, offset]
    );
    return rows.map(mapDispute);
  },

  async adminReports(
    _: unknown,
    args: { status?: string; limit?: number; offset?: number },
    ctx: any
  ) {
    requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const { rows } = await db.query(
      `SELECT r.*,
              ru.full_name AS reporter_name,
              CASE r.target_type
                WHEN 'user'    THEN tu.full_name
                WHEN 'project' THEN tp.title
                ELSE NULL
              END AS target_label
       FROM reports r
       LEFT JOIN users ru ON ru.id = r.reporter_id
       LEFT JOIN users tu ON tu.id = r.target_id AND r.target_type = 'user'
       LEFT JOIN projects tp ON tp.id = r.target_id AND r.target_type = 'project'
       WHERE ($1::text IS NULL OR r.status = $1)
       ORDER BY (r.status = 'open') DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [args.status ?? null, limit, offset]
    );
    return rows.map(mapReport);
  },
};

export const adminMutations = {
  // Action or dismiss a content report.
  async reviewReport(
    _: unknown,
    { id, action, adminNote }: { id: string; action: string; adminNote?: string },
    ctx: any
  ) {
    requireAdmin(ctx);
    const valid = ['reviewed', 'dismissed', 'actioned'];
    if (!valid.includes(action)) {
      throw new GraphQLError(`action must be one of: ${valid.join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    const { rows } = await db.query(
      `UPDATE reports SET status = $1, admin_note = $2, reviewed_at = NOW()
       WHERE id = $3 RETURNING *`,
      [action, adminNote ?? null, id]
    );
    if (!rows[0]) {
      throw new GraphQLError('Report not found', { extensions: { code: 'NOT_FOUND' } });
    }
    return mapReport(rows[0]);
  },
};
