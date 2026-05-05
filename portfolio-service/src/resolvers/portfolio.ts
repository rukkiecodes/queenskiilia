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
};
