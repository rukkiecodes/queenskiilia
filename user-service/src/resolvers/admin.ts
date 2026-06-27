import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { requireAdmin } from './helpers';

// Admin-only reads. All services share one Postgres, so the platform stats query
// reads other services' tables directly rather than federating four subgraphs.

export const adminQueries = {
  async adminStats(_: unknown, __: unknown, ctx: any) {
    requireAdmin(ctx);
    const { rows } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_users,
        (SELECT COUNT(*) FROM users WHERE account_type = 'student' AND is_active = TRUE) AS students,
        (SELECT COUNT(*) FROM users WHERE account_type = 'business' AND is_active = TRUE) AS businesses,
        (SELECT COUNT(*) FROM users WHERE is_verified = TRUE AND is_active = TRUE) AS verified_users,
        (SELECT COUNT(*) FROM user_verifications WHERE status = 'pending') AS pending_verifications,
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'open') AS open_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open','under_review')) AS open_disputes,
        (SELECT COUNT(*) FROM reports WHERE status = 'open') AS pending_reports,
        (SELECT COALESCE(SUM(amount),0) FROM escrow_accounts WHERE status = 'held') AS escrow_held,
        (SELECT COALESCE(SUM(amount),0) FROM escrow_accounts WHERE status = 'released') AS escrow_released
    `);
    const r = rows[0];
    return {
      totalUsers: Number(r.total_users),
      students: Number(r.students),
      businesses: Number(r.businesses),
      verifiedUsers: Number(r.verified_users),
      pendingVerifications: Number(r.pending_verifications),
      totalProjects: Number(r.total_projects),
      openProjects: Number(r.open_projects),
      completedProjects: Number(r.completed_projects),
      openDisputes: Number(r.open_disputes),
      pendingReports: Number(r.pending_reports),
      escrowHeld: Number(r.escrow_held),
      escrowReleased: Number(r.escrow_released),
    };
  },

  async adminVerifications(
    _: unknown,
    args: { status?: string; limit?: number; offset?: number },
    ctx: any
  ) {
    requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const { rows } = await db.query(
      `SELECT v.id, v.user_id, v.type, v.status, v.document_url, v.admin_note,
              v.submitted_at, v.reviewed_at,
              u.email, u.full_name, u.account_type, u.is_verified, u.is_active,
              u.country, u.created_at
       FROM user_verifications v
       JOIN users u ON u.id = v.user_id
       WHERE ($1::text IS NULL OR v.status = $1)
       ORDER BY (v.status = 'pending') DESC, v.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [args.status ?? null, limit, offset]
    );
    return rows.map(mapVerificationRow);
  },

  async adminUsers(
    _: unknown,
    args: { search?: string; accountType?: string; limit?: number; offset?: number },
    ctx: any
  ) {
    requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const offset = args.offset ?? 0;
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (args.accountType) {
      where.push(`account_type = $${i++}`);
      params.push(args.accountType);
    }
    if (args.search && args.search.trim()) {
      where.push(`(full_name ILIKE $${i} OR email ILIKE $${i})`);
      params.push(`%${args.search.trim()}%`);
      i++;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT id, email, full_name, account_type, is_verified, is_active, country, created_at
       FROM users ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      params
    );
    return rows.map(mapSummary);
  },
};

function mapSummary(r: any) {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    accountType: r.account_type,
    isVerified: r.is_verified,
    isActive: r.is_active,
    country: r.country,
    createdAt: iso(r.created_at),
  };
}

function mapVerificationRow(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    status: r.status,
    documentUrl: r.document_url,
    adminNote: r.admin_note,
    submittedAt: iso(r.submitted_at),
    reviewedAt: iso(r.reviewed_at),
    user: mapSummary(r),
  };
}

const USER_COLS =
  'id, email, full_name, account_type, is_verified, is_active, country, created_at';

export const adminMutations = {
  // Approve or reject an ID/document verification. Approving also flips the
  // user's is_verified flag.
  async reviewVerification(
    _: unknown,
    { id, decision, adminNote }: { id: string; decision: string; adminNote?: string },
    ctx: any
  ) {
    requireAdmin(ctx);
    if (decision !== 'approve' && decision !== 'reject') {
      throw new GraphQLError("decision must be 'approve' or 'reject'", {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    const status = decision === 'approve' ? 'approved' : 'rejected';
    const upd = await db.query(
      `UPDATE user_verifications SET status = $1, admin_note = $2, reviewed_at = NOW()
       WHERE id = $3 RETURNING user_id`,
      [status, adminNote ?? null, id]
    );
    if (!upd.rows[0]) {
      throw new GraphQLError('Verification not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (decision === 'approve') {
      await db.query(`UPDATE users SET is_verified = TRUE WHERE id = $1`, [upd.rows[0].user_id]);
    }
    const { rows } = await db.query(
      `SELECT v.*, u.email, u.full_name, u.account_type, u.is_verified, u.is_active,
              u.country, u.created_at
       FROM user_verifications v JOIN users u ON u.id = v.user_id WHERE v.id = $1`,
      [id]
    );
    return mapVerificationRow(rows[0]);
  },

  // Suspend / restore an account (ban toggle).
  async setUserActive(
    _: unknown,
    { id, isActive }: { id: string; isActive: boolean },
    ctx: any
  ) {
    requireAdmin(ctx);
    const { rows } = await db.query(
      `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING ${USER_COLS}`,
      [isActive, id]
    );
    if (!rows[0]) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    return mapSummary(rows[0]);
  },

  // Manually toggle a user's verified badge.
  async setUserVerified(
    _: unknown,
    { id, isVerified }: { id: string; isVerified: boolean },
    ctx: any
  ) {
    requireAdmin(ctx);
    const { rows } = await db.query(
      `UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING ${USER_COLS}`,
      [isVerified, id]
    );
    if (!rows[0]) throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    return mapSummary(rows[0]);
  },
};

// pg returns TIMESTAMPTZ as a Date; normalize to ISO for the GraphQL String field.
function iso(v: any): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
