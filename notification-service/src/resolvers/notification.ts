import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { requireAuth } from './helpers';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapNotification(row: any) {
  return {
    id:        row.id,
    userId:    row.user_id,
    type:      row.type,
    title:     row.title,
    body:      row.body,
    isRead:    row.is_read,
    metadata:  row.metadata != null ? JSON.stringify(row.metadata) : null,
    createdAt: row.created_at,
  };
}

// ── Query resolvers ───────────────────────────────────────────────────────────

export const notificationQueries = {
  async myNotifications(
    _: unknown,
    { unreadOnly = false, limit = 20, offset = 0 }: { unreadOnly?: boolean; limit?: number; offset?: number },
    ctx: any
  ) {
    const userId = requireAuth(ctx);
    const safeLimit = Math.min(limit, 100);

    const baseQuery = unreadOnly
      ? `SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC LIMIT $2 OFFSET $3`
      : `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;

    const result = await db.query(baseQuery, [userId, safeLimit, offset]);

    return result.rows.map(mapNotification);
  },

  async unreadCount(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return result.rows[0].count as number;
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const notificationMutations = {
  async markAsRead(_: unknown, { id }: { id: string }, ctx: any) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new GraphQLError('Notification not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return mapNotification(result.rows[0]);
  },

  async markAllAsRead(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    const count = result.rowCount ?? 0;

    return count;
  },

  async deleteNotification(_: unknown, { id }: { id: string }, ctx: any) {
    const userId = requireAuth(ctx);

    const result = await db.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new GraphQLError('Notification not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return true;
  },
};

// ── Federation __resolveReference ────────────────────────────────────────────

export const notificationReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM notifications WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapNotification(result.rows[0]) : null;
  },
};
