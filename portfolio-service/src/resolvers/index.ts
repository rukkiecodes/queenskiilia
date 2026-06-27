import { portfolioQueries, portfolioMutations } from './portfolio';
import { db } from '../shared/db';

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

export const resolvers = {
  Query:    portfolioQueries,
  Mutation: portfolioMutations,
  PortfolioItem: {
    async __resolveReference(ref: { id: string }) {
      const result = await db.query(
        `SELECT * FROM portfolio_items WHERE id = $1`,
        [ref.id]
      );
      if (!result.rowCount) return null;
      return mapItem(result.rows[0]);
    },
    async likeCount(parent: { id: string }) {
      const r = await db.query(
        `SELECT COUNT(*)::int AS c FROM portfolio_likes WHERE item_id = $1`,
        [parent.id]
      );
      return r.rows[0]?.c ?? 0;
    },
    async likedByMe(parent: { id: string }, _args: any, ctx: any) {
      if (!ctx?.userId) return false;
      const r = await db.query(
        `SELECT 1 FROM portfolio_likes WHERE item_id = $1 AND user_id = $2`,
        [parent.id, ctx.userId]
      );
      return (r.rowCount ?? 0) > 0;
    },
  },
};
