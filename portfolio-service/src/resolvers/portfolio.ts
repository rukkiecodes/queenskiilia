import { GraphQLError } from 'graphql';
import { db } from '../shared/db';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

function mapItem(r: any) {
  return {
    id:           r.id,
    studentId:    r.student_id,
    projectId:    r.project_id,
    projectTitle: r.project_title,
    businessName: r.business_name,
    description:  r.description ?? null,
    skills:       r.skills ?? [],
    fileUrls:     r.file_urls ?? [],
    imageUrls:    r.image_urls ?? [],
    videoUrl:     r.video_url ?? null,
    liveUrl:      r.live_url ?? null,
    clientRating: r.client_rating ?? null,
    clientReview: r.client_review ?? null,
    isPublic:     r.is_public,
    completedAt:  r.completed_at,
    createdAt:    r.created_at,
  };
}

export const portfolioQueries = {
  async myPortfolio(_: any, __: any, ctx: any) {
    const userId = requireAuth(ctx);
    const result = await db.query(
      `SELECT * FROM portfolio_items WHERE student_id = $1 ORDER BY completed_at DESC`,
      [userId]
    );
    return result.rows.map(mapItem);
  },

  async studentPortfolio(_: any, { studentId }: any, _ctx: any) {
    const result = await db.query(
      `SELECT * FROM portfolio_items WHERE student_id = $1 AND is_public = TRUE ORDER BY completed_at DESC`,
      [studentId]
    );
    return result.rows.map(mapItem);
  },

  async portfolioItem(_: any, { id }: any, ctx: any) {
    const result = await db.query(
      `SELECT * FROM portfolio_items WHERE id = $1`,
      [id]
    );
    if (!result.rowCount) {
      return null;
    }
    const row = result.rows[0];
    // Return item only if it is public or the caller is the owner
    if (!row.is_public && row.student_id !== ctx.userId) {
      throw new GraphQLError('Not authorised to view this portfolio item', { extensions: { code: 'FORBIDDEN' } });
    }
    return mapItem(row);
  },
};

export const portfolioMutations = {
  async updatePortfolioItemVisibility(_: any, { id, isPublic }: any, ctx: any) {
    const userId = requireAuth(ctx);
    // Verify ownership
    const existing = await db.query(
      `SELECT id, student_id FROM portfolio_items WHERE id = $1`,
      [id]
    );
    if (!existing.rowCount) {
      throw new GraphQLError('Portfolio item not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (existing.rows[0].student_id !== userId) {
      throw new GraphQLError('You can only update your own portfolio items', { extensions: { code: 'FORBIDDEN' } });
    }

    const result = await db.query(
      `UPDATE portfolio_items SET is_public = $1 WHERE id = $2 RETURNING *`,
      [isPublic, id]
    );
    return mapItem(result.rows[0]);
  },

  async updatePortfolioItem(_: any, { id, input }: any, ctx: any) {
    const userId = requireAuth(ctx);
    const existing = await db.query(`SELECT student_id FROM portfolio_items WHERE id = $1`, [id]);
    if (!existing.rowCount) {
      throw new GraphQLError('Portfolio item not found', { extensions: { code: 'NOT_FOUND' } });
    }
    if (existing.rows[0].student_id !== userId) {
      throw new GraphQLError('You can only update your own portfolio items', { extensions: { code: 'FORBIDDEN' } });
    }
    const result = await db.query(
      `UPDATE portfolio_items SET
         description = COALESCE($2, description),
         image_urls  = COALESCE($3, image_urls),
         video_url   = COALESCE($4, video_url),
         live_url    = COALESCE($5, live_url)
       WHERE id = $1 RETURNING *`,
      [id, input.description ?? null, input.imageUrls ?? null, input.videoUrl ?? null, input.liveUrl ?? null]
    );
    return mapItem(result.rows[0]);
  },

  async likePortfolioItem(_: any, { id }: any, ctx: any) {
    const userId = requireAuth(ctx);
    const existing = await db.query(`SELECT * FROM portfolio_items WHERE id = $1`, [id]);
    if (!existing.rowCount) {
      throw new GraphQLError('Portfolio item not found', { extensions: { code: 'NOT_FOUND' } });
    }
    await db.query(
      `INSERT INTO portfolio_likes (item_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, userId]
    );
    return mapItem(existing.rows[0]);
  },

  async unlikePortfolioItem(_: any, { id }: any, ctx: any) {
    const userId = requireAuth(ctx);
    const existing = await db.query(`SELECT * FROM portfolio_items WHERE id = $1`, [id]);
    if (!existing.rowCount) {
      throw new GraphQLError('Portfolio item not found', { extensions: { code: 'NOT_FOUND' } });
    }
    await db.query(`DELETE FROM portfolio_likes WHERE item_id = $1 AND user_id = $2`, [id, userId]);
    return mapItem(existing.rows[0]);
  },
};
