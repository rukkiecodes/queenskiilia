import { portfolioQueries, portfolioMutations } from './portfolio';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';

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

export const resolvers = {
  Query:    portfolioQueries,
  Mutation: portfolioMutations,
  PortfolioItem: {
    async __resolveReference(ref: { id: string }) {
      const start = Date.now();
      const result = await db.query(
        `SELECT * FROM portfolio_items WHERE id = $1`,
        [ref.id]
      );
      emitTelemetry({
        operationType: 'query', operationName: '__resolveReference:PortfolioItem',
        durationMs: Date.now() - start, status: result.rowCount ? 'success' : 'error',
      });
      if (!result.rowCount) return null;
      return mapItem(result.rows[0]);
    },
  },
};
