import { ratingQueries, ratingMutations } from './rating';
import { db } from '../shared/db';

export const resolvers = {
  Query:    ratingQueries,
  Mutation: ratingMutations,
  Rating: {
    async __resolveReference(ref: { id: string }) {
      const r = await db.query(`SELECT * FROM ratings WHERE id = $1`, [ref.id]);
      if (!r.rowCount) return null;
      const row = r.rows[0];
      return {
        id: row.id, projectId: row.project_id,
        reviewerId: row.reviewer_id, revieweeId: row.reviewee_id,
        reviewerType: row.reviewer_type,
        quality: row.quality, communication: row.communication,
        speed: row.speed, professionalism: row.professionalism,
        paymentFairness: row.payment_fairness, clarity: row.clarity, respect: row.respect,
        comment: row.comment, createdAt: row.created_at,
      };
    },
  },
};
