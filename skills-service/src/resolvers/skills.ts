import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';
import { requireAuth } from './helpers';
import { pickQuestions } from './questionBank';

// ── Row → GQL shape ────────────────────────────────────────────────────────────

function mapCategory(row: any) {
  return {
    id:             row.id,
    name:           row.name,
    parentCategory: row.parent_category ?? null,
    skills:         row.skills ?? [],
  };
}

function mapAssessment(row: any) {
  return {
    id:          row.id,
    studentId:   row.student_id,
    category:    row.category,
    level:       row.level,
    score:       row.score ?? null,
    completedAt: row.completed_at,
  };
}

function mapSession(row: any) {
  // questions are stored as JSONB: [{index, text, options}]
  const rawQuestions: any[] = row.questions ?? [];
  const questions = rawQuestions.map((q: any) => ({
    index:   q.index,
    text:    q.text,
    options: q.options,
  }));

  return {
    id:         row.id,
    studentId:  row.student_id,
    category:   row.category,
    questions,
    status:     row.status,
    startedAt:  row.started_at,
    expiresAt:  row.expires_at,
  };
}

// ── Query resolvers ────────────────────────────────────────────────────────────

export const skillQueries = {
  async skillCategories(_: unknown, __: unknown, ctx: any) {
    const start = Date.now();

    try {
      const result = await db.query(
        `SELECT * FROM skill_categories ORDER BY name ASC`
      );

      emitTelemetry({
        operationType: 'query', operationName: 'skillCategories',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });

      return result.rows.map(mapCategory);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'skillCategories',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async skillCategory(_: unknown, { id }: { id: string }, ctx: any) {
    const start = Date.now();

    try {
      const result = await db.query(
        `SELECT * FROM skill_categories WHERE id = $1`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new GraphQLError('Skill category not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      emitTelemetry({
        operationType: 'query', operationName: 'skillCategory',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapCategory(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'skillCategory',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async myAssessments(_: unknown, __: unknown, ctx: any) {
    const start   = Date.now();
    const userId  = requireAuth(ctx);

    try {
      const result = await db.query(
        `SELECT * FROM skill_assessments WHERE student_id = $1 ORDER BY completed_at DESC`,
        [userId]
      );

      emitTelemetry({
        operationType: 'query', operationName: 'myAssessments',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return result.rows.map(mapAssessment);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'myAssessments',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async assessment(_: unknown, { id }: { id: string }, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const result = await db.query(
        `SELECT * FROM skill_assessments WHERE id = $1 AND student_id = $2`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new GraphQLError('Assessment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      emitTelemetry({
        operationType: 'query', operationName: 'assessment',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapAssessment(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'assessment',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async activeAssessmentSession(_: unknown, __: unknown, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const result = await db.query(
        `SELECT * FROM assessment_sessions
         WHERE student_id = $1
           AND status = 'in_progress'
           AND expires_at > NOW()
         ORDER BY started_at DESC
         LIMIT 1`,
        [userId]
      );

      emitTelemetry({
        operationType: 'query', operationName: 'activeAssessmentSession',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return result.rowCount ? mapSession(result.rows[0]) : null;
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'activeAssessmentSession',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Mutation resolvers ─────────────────────────────────────────────────────────

export const skillMutations = {
  async startAssessment(
    _: unknown,
    { category, level }: { category: string; level: string },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      // Return existing in_progress session for this student + category if one exists
      const existing = await db.query(
        `SELECT * FROM assessment_sessions
         WHERE student_id = $1
           AND category   = $2
           AND status     = 'in_progress'
           AND expires_at > NOW()
         LIMIT 1`,
        [userId, category]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        emitTelemetry({
          operationType: 'mutation', operationName: 'startAssessment',
          userId, durationMs: Date.now() - start, status: 'success',
          meta: { reused: true },
        });
        return mapSession(existing.rows[0]);
      }

      // Build 10 questions from the mock bank
      const templates = pickQuestions(category);
      const questions = templates.map((q, idx) => ({
        index:   idx,
        text:    q.text,
        options: q.options,
        // correctIndex is stored in the DB for scoring but NOT exposed via GQL
        correctIndex: q.correctIndex,
      }));

      const id        = randomUUID();
      const now       = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

      const result = await db.query(
        `INSERT INTO assessment_sessions
           (id, student_id, category, level, questions, status, started_at, expires_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, 'in_progress', $6, $7)
         RETURNING *`,
        [id, userId, category, level, JSON.stringify(questions), now.toISOString(), expiresAt.toISOString()]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'startAssessment',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { category, level },
      });

      return mapSession(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'startAssessment',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async submitAssessment(
    _: unknown,
    { sessionId, answers }: { sessionId: string; answers: { questionIndex: number; selectedOption: number }[] },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      // Fetch and validate the session
      const sessionResult = await db.query(
        `SELECT * FROM assessment_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rowCount === 0) {
        throw new GraphQLError('Assessment session not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const session = sessionResult.rows[0];

      if (session.student_id !== userId) {
        throw new GraphQLError('You do not own this assessment session', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (session.status !== 'in_progress') {
        throw new GraphQLError('This assessment session is already completed', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (new Date(session.expires_at) < new Date()) {
        throw new GraphQLError('This assessment session has expired', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Score: count correct answers
      const storedQuestions: any[] = session.questions ?? [];
      let score = 0;
      for (const answer of answers) {
        const q = storedQuestions.find((sq: any) => sq.index === answer.questionIndex);
        if (q && q.correctIndex === answer.selectedOption) {
          score++;
        }
      }

      // Mark session as completed
      await db.query(
        `UPDATE assessment_sessions SET status = 'completed' WHERE id = $1`,
        [sessionId]
      );

      const now = new Date().toISOString();

      // Upsert into skill_assessments (one record per student+category, keep latest)
      const assessmentResult = await db.query(
        `INSERT INTO skill_assessments
           (id, student_id, category, level, score, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (student_id, category) DO UPDATE SET
           level        = EXCLUDED.level,
           score        = EXCLUDED.score,
           completed_at = EXCLUDED.completed_at
         RETURNING *`,
        [randomUUID(), userId, session.category, session.level, score, now]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'submitAssessment',
        userId, durationMs: Date.now() - start, status: 'success',
        meta: { score, category: session.category },
      });

      return mapAssessment(assessmentResult.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'submitAssessment',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Federation __resolveReference ─────────────────────────────────────────────

export const skillCategoryReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM skill_categories WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapCategory(result.rows[0]) : null;
  },
};

export const skillAssessmentReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM skill_assessments WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapAssessment(result.rows[0]) : null;
  },
};

export const assessmentSessionReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(
      `SELECT * FROM assessment_sessions WHERE id = $1`,
      [ref.id]
    );
    return result.rowCount ? mapSession(result.rows[0]) : null;
  },
};
