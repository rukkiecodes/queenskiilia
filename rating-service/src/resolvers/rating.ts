import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';

function requireAuth(ctx: any): string {
  if (!ctx.userId) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.userId;
}

function mapRating(r: any) {
  return {
    id: r.id, projectId: r.project_id,
    reviewerId: r.reviewer_id, revieweeId: r.reviewee_id,
    reviewerType: r.reviewer_type,
    quality: r.quality, communication: r.communication,
    speed: r.speed, professionalism: r.professionalism,
    paymentFairness: r.payment_fairness, clarity: r.clarity, respect: r.respect,
    comment: r.comment, createdAt: r.created_at,
  };
}

export const ratingQueries = {
  async rating(_: any, { id }: any) {
    const r = await db.query(`SELECT * FROM ratings WHERE id = $1`, [id]);
    return r.rowCount ? mapRating(r.rows[0]) : null;
  },

  async projectRatings(_: any, { projectId }: any) {
    const r = await db.query(`SELECT * FROM ratings WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]);
    return r.rows.map(mapRating);
  },

  async userRatings(_: any, { userId }: any) {
    const r = await db.query(`SELECT * FROM ratings WHERE reviewee_id = $1 ORDER BY created_at DESC`, [userId]);
    return r.rows.map(mapRating);
  },

  async myRatings(_: any, __: any, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(
      `SELECT * FROM ratings WHERE reviewer_id = $1 OR reviewee_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return r.rows.map(mapRating);
  },
};

export const ratingMutations = {
  async submitRating(_: any, { input }: any, ctx: any) {
    const start    = Date.now();
    const userId   = requireAuth(ctx);

    const validReviewerTypes = ['student', 'business'];
    if (!validReviewerTypes.includes(input.reviewerType)) {
      throw new GraphQLError('reviewerType must be student or business', { extensions: { code: 'BAD_USER_INPUT' } });
    }

    // Verify the project exists and the caller participated in it
    const project = await db.query(
      `SELECT id, business_id, selected_student, status FROM projects WHERE id = $1`,
      [input.projectId]
    );
    if (!project.rowCount) {
      throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
    }

    const p = project.rows[0];
    if (!['under_review', 'completed'].includes(p.status)) {
      throw new GraphQLError('Ratings can only be submitted for completed projects', { extensions: { code: 'FORBIDDEN' } });
    }

    const isParticipant = p.business_id === userId || p.selected_student === userId;
    if (!isParticipant) {
      throw new GraphQLError('You did not participate in this project', { extensions: { code: 'FORBIDDEN' } });
    }

    try {
      const result = await db.query(
        `INSERT INTO ratings
           (project_id, reviewer_id, reviewee_id, reviewer_type,
            quality, communication, speed, professionalism,
            payment_fairness, clarity, respect, comment)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (project_id, reviewer_id) DO UPDATE SET
           comment = EXCLUDED.comment
         RETURNING *`,
        [
          input.projectId, userId, input.revieweeId, input.reviewerType,
          input.quality         ?? null,
          input.communication   ?? null,
          input.speed           ?? null,
          input.professionalism ?? null,
          input.paymentFairness ?? null,
          input.clarity         ?? null,
          input.respect         ?? null,
          input.comment         ?? null,
        ]
      );

      // Update average rating on the reviewee's profile
      if (input.reviewerType === 'business') {
        await db.query(
          `UPDATE student_profiles
           SET average_rating = (
             SELECT AVG((quality + communication + speed + professionalism) / 4.0)
             FROM ratings WHERE reviewee_id = $1 AND reviewer_type = 'business'
               AND quality IS NOT NULL
           )
           WHERE user_id = $1`,
          [input.revieweeId]
        );
      } else {
        await db.query(
          `UPDATE business_profiles
           SET average_rating = (
             SELECT AVG((payment_fairness + clarity + respect) / 3.0)
             FROM ratings WHERE reviewee_id = $1 AND reviewer_type = 'student'
               AND payment_fairness IS NOT NULL
           )
           WHERE user_id = $1`,
          [input.revieweeId]
        );
      }

      emitTelemetry({
        operationType: 'mutation', operationName: 'submitRating',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapRating(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'submitRating',
        userId, durationMs: Date.now() - start, status: 'error', errorMessage: err.message,
      });
      throw err;
    }
  },
};
