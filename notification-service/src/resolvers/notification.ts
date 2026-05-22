import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { requireAuth } from './helpers';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapPreferences(row: any) {
  return {
    userId:         row.user_id,
    projectUpdates: row.project_updates,
    messages:       row.messages,
    payments:       row.payments,
    system:         row.system,
    updatedAt:      row.updated_at,
  };
}

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

  async myNotificationPreferences(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);

    // Upsert with all column defaults so the row always exists. The DO UPDATE
    // is a no-op assignment so we still get a RETURNING row when the user
    // already has prefs — saves a follow-up SELECT.
    const result = await db.query(
      `INSERT INTO notification_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [userId]
    );

    return mapPreferences(result.rows[0]);
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

  async updateNotificationPreferences(
    _: unknown,
    {
      input,
    }: {
      input: {
        projectUpdates?: boolean;
        messages?: boolean;
        payments?: boolean;
        system?: boolean;
      };
    },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    // Single UPSERT covers both first-write (defaults applied) and update.
    // COALESCE keeps the existing column when the input field is null/omitted.
    const result = await db.query(
      `INSERT INTO notification_preferences
         (user_id, project_updates, messages, payments, system)
       VALUES (
         $1,
         COALESCE($2, TRUE),
         COALESCE($3, TRUE),
         COALESCE($4, TRUE),
         COALESCE($5, TRUE)
       )
       ON CONFLICT (user_id) DO UPDATE SET
         project_updates = COALESCE($2, notification_preferences.project_updates),
         messages        = COALESCE($3, notification_preferences.messages),
         payments        = COALESCE($4, notification_preferences.payments),
         system          = COALESCE($5, notification_preferences.system),
         updated_at      = NOW()
       RETURNING *`,
      [
        userId,
        input.projectUpdates ?? null,
        input.messages       ?? null,
        input.payments       ?? null,
        input.system         ?? null,
      ]
    );

    return mapPreferences(result.rows[0]);
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
