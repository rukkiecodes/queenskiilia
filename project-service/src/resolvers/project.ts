import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { emitTelemetry } from '../telemetry';
import { requireAuth } from './helpers';

// ── Row → GQL shape ───────────────────────────────────────────────────────────

function mapProject(row: any) {
  return {
    id:              row.id,
    businessId:      row.business_id,
    title:           row.title,
    description:     row.description,
    requiredSkills:  row.required_skills ?? [],
    skillLevel:      row.skill_level,
    budget:          parseFloat(row.budget),
    currency:        row.currency ?? 'USD',
    deadline:        row.deadline instanceof Date ? row.deadline.toISOString() : row.deadline,
    status:          row.status,
    selectedStudent: row.selected_student ?? null,
    createdAt:       row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt:       row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function mapApplication(row: any) {
  return {
    id:        row.id,
    projectId: row.project_id,
    studentId: row.student_id,
    coverNote: row.cover_note ?? null,
    status:    row.status,
    appliedAt: row.applied_at instanceof Date ? row.applied_at.toISOString() : row.applied_at,
  };
}

function mapSubmission(row: any) {
  return {
    id:          row.id,
    projectId:   row.project_id,
    studentId:   row.student_id,
    fileUrls:    row.file_urls ?? [],
    notes:       row.notes ?? null,
    status:      row.status,
    feedback:    row.feedback ?? null,
    submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
    reviewedAt:  row.reviewed_at
      ? (row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : row.reviewed_at)
      : null,
  };
}

// ── Query resolvers ───────────────────────────────────────────────────────────

export const projectQueries = {
  async project(_: unknown, { id }: { id: string }, ctx: any) {
    const start = Date.now();
    try {
      const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
      emitTelemetry({
        operationType: 'query', operationName: 'project',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rowCount ? mapProject(result.rows[0]) : null;
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'project',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async projects(
    _: unknown,
    { status, limit = 20, offset = 0 }: { status?: string; limit?: number; offset?: number },
    ctx: any
  ) {
    const start = Date.now();
    const safeLimit = Math.min(limit, 100);
    try {
      let query: string;
      let params: any[];
      if (status) {
        query  = `SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
        params = [status, safeLimit, offset];
      } else {
        query  = `SELECT * FROM projects ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
        params = [safeLimit, offset];
      }
      const result = await db.query(query, params);
      emitTelemetry({
        operationType: 'query', operationName: 'projects',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapProject);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'projects',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async myProjects(_: unknown, __: unknown, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    try {
      let result;
      if (ctx.accountType === 'business') {
        result = await db.query(
          `SELECT * FROM projects WHERE business_id = $1 ORDER BY created_at DESC`,
          [userId]
        );
      } else {
        // student: projects they have applied to
        result = await db.query(
          `SELECT p.* FROM projects p
           INNER JOIN applications a ON a.project_id = p.id
           WHERE a.student_id = $1
           ORDER BY p.created_at DESC`,
          [userId]
        );
      }
      emitTelemetry({
        operationType: 'query', operationName: 'myProjects',
        userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapProject);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'myProjects',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async application(_: unknown, { id }: { id: string }, ctx: any) {
    const start = Date.now();
    requireAuth(ctx);
    try {
      const result = await db.query(`SELECT * FROM applications WHERE id = $1`, [id]);
      emitTelemetry({
        operationType: 'query', operationName: 'application',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rowCount ? mapApplication(result.rows[0]) : null;
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'application',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async projectApplications(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const start = Date.now();
    requireAuth(ctx);
    try {
      const result = await db.query(
        `SELECT * FROM applications WHERE project_id = $1 ORDER BY applied_at DESC`,
        [projectId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'projectApplications',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapApplication);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'projectApplications',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async myApplications(_: unknown, __: unknown, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);
    try {
      const result = await db.query(
        `SELECT * FROM applications WHERE student_id = $1 ORDER BY applied_at DESC`,
        [userId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'myApplications',
        userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rows.map(mapApplication);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'myApplications',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async submission(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    const start = Date.now();
    requireAuth(ctx);
    try {
      const result = await db.query(
        `SELECT * FROM submissions WHERE project_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
        [projectId]
      );
      emitTelemetry({
        operationType: 'query', operationName: 'submission',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'success',
      });
      return result.rowCount ? mapSubmission(result.rows[0]) : null;
    } catch (err: any) {
      emitTelemetry({
        operationType: 'query', operationName: 'submission',
        userId: ctx.userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const projectMutations = {
  async createProject(
    _: unknown,
    { input }: { input: Record<string, any> },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'business') {
      throw new GraphQLError('Only business accounts can create projects', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    try {
      const result = await db.query(
        `INSERT INTO projects
           (business_id, title, description, required_skills, skill_level, budget, currency, deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
         RETURNING *`,
        [
          userId,
          input.title,
          input.description,
          input.requiredSkills,
          input.skillLevel,
          input.budget,
          input.currency ?? 'USD',
          input.deadline,
        ]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'createProject',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapProject(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'createProject',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async updateProject(
    _: unknown,
    { id, input }: { id: string; input: Record<string, any> },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const project = projectRes.rows[0];
      if (project.business_id !== userId) {
        throw new GraphQLError('Only the project owner can update this project', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const result = await db.query(
        `UPDATE projects SET
           title           = COALESCE($2, title),
           description     = COALESCE($3, description),
           required_skills = COALESCE($4, required_skills),
           skill_level     = COALESCE($5, skill_level),
           budget          = COALESCE($6, budget),
           deadline        = COALESCE($7, deadline),
           updated_at      = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          id,
          input.title           ?? null,
          input.description     ?? null,
          input.requiredSkills  ?? null,
          input.skillLevel      ?? null,
          input.budget          ?? null,
          input.deadline        ?? null,
        ]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'updateProject',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapProject(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'updateProject',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async cancelProject(_: unknown, { id }: { id: string }, ctx: any) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const project = projectRes.rows[0];

      if (project.business_id !== userId) {
        throw new GraphQLError('Only the project owner can cancel this project', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      if (project.status !== 'open') {
        throw new GraphQLError('Only open projects can be cancelled', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const result = await db.query(
        `UPDATE projects SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'cancelProject',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapProject(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'cancelProject',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async applyToProject(
    _: unknown,
    { input }: { input: { projectId: string; coverNote?: string } },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'student') {
      throw new GraphQLError('Only student accounts can apply to projects', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [input.projectId]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      if (projectRes.rows[0].status !== 'open') {
        throw new GraphQLError('Project is not open for applications', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const existingRes = await db.query(
        `SELECT id FROM applications WHERE project_id = $1 AND student_id = $2`,
        [input.projectId, userId]
      );
      if (existingRes.rowCount) {
        throw new GraphQLError('You have already applied to this project', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const result = await db.query(
        `INSERT INTO applications (project_id, student_id, cover_note, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [input.projectId, userId, input.coverNote ?? null]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'applyToProject',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapApplication(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'applyToProject',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async withdrawApplication(
    _: unknown,
    { applicationId }: { applicationId: string },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const appRes = await db.query(`SELECT * FROM applications WHERE id = $1`, [applicationId]);
      if (!appRes.rowCount) {
        throw new GraphQLError('Application not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const app = appRes.rows[0];

      if (app.student_id !== userId) {
        throw new GraphQLError('Only the applicant can withdraw this application', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      if (app.status !== 'pending') {
        throw new GraphQLError('Only pending applications can be withdrawn', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const result = await db.query(
        `UPDATE applications SET status = 'withdrawn' WHERE id = $1 RETURNING *`,
        [applicationId]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'withdrawApplication',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapApplication(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'withdrawApplication',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async selectStudent(
    _: unknown,
    { projectId, studentId }: { projectId: string; studentId: string },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const project = projectRes.rows[0];

      if (project.business_id !== userId) {
        throw new GraphQLError('Only the project owner can select a student', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      if (project.status !== 'open') {
        throw new GraphQLError('Can only select a student for an open project', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const result = await db.query(
        `UPDATE projects
         SET selected_student = $2, status = 'in_progress', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [projectId, studentId]
      );

      // Mark the selected application as accepted, others as rejected
      await db.query(
        `UPDATE applications SET status = 'accepted'
         WHERE project_id = $1 AND student_id = $2 AND status = 'pending'`,
        [projectId, studentId]
      );
      await db.query(
        `UPDATE applications SET status = 'rejected'
         WHERE project_id = $1 AND student_id != $2 AND status = 'pending'`,
        [projectId, studentId]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'selectStudent',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapProject(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'selectStudent',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async submitWork(
    _: unknown,
    { input }: { input: { projectId: string; fileUrls: string[]; notes?: string } },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [input.projectId]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const project = projectRes.rows[0];

      if (project.status !== 'in_progress') {
        throw new GraphQLError('Project is not in progress', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (project.selected_student !== userId) {
        throw new GraphQLError('Only the selected student can submit work for this project', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const result = await db.query(
        `INSERT INTO submissions (project_id, student_id, file_urls, notes, status)
         VALUES ($1, $2, $3, $4, 'submitted')
         RETURNING *`,
        [input.projectId, userId, input.fileUrls, input.notes ?? null]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'submitWork',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapSubmission(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'submitWork',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },

  async reviewSubmission(
    _: unknown,
    { projectId, approve, feedback }: { projectId: string; approve: boolean; feedback?: string },
    ctx: any
  ) {
    const start  = Date.now();
    const userId = requireAuth(ctx);

    try {
      const projectRes = await db.query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
      if (!projectRes.rowCount) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      const project = projectRes.rows[0];

      if (project.business_id !== userId) {
        throw new GraphQLError('Only the project owner can review submissions', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const submissionRes = await db.query(
        `SELECT * FROM submissions WHERE project_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
        [projectId]
      );
      if (!submissionRes.rowCount) {
        throw new GraphQLError('No submission found for this project', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const newSubmissionStatus = approve ? 'approved' : 'revision_requested';
      const newProjectStatus    = approve ? 'under_review' : 'in_progress';

      const result = await db.query(
        `UPDATE submissions
         SET status = $2, feedback = $3, reviewed_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [submissionRes.rows[0].id, newSubmissionStatus, feedback ?? null]
      );

      await db.query(
        `UPDATE projects SET status = $2, updated_at = NOW() WHERE id = $1`,
        [projectId, newProjectStatus]
      );

      emitTelemetry({
        operationType: 'mutation', operationName: 'reviewSubmission',
        userId, durationMs: Date.now() - start, status: 'success',
      });

      return mapSubmission(result.rows[0]);
    } catch (err: any) {
      emitTelemetry({
        operationType: 'mutation', operationName: 'reviewSubmission',
        userId, durationMs: Date.now() - start, status: 'error',
        errorMessage: err.message,
      });
      throw err;
    }
  },
};

// ── Federation __resolveReference ─────────────────────────────────────────────

export const projectReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [ref.id]);
    return result.rowCount ? mapProject(result.rows[0]) : null;
  },
};

export const applicationReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(`SELECT * FROM applications WHERE id = $1`, [ref.id]);
    return result.rowCount ? mapApplication(result.rows[0]) : null;
  },
};

export const submissionReference = {
  async __resolveReference(ref: { id: string }) {
    const result = await db.query(`SELECT * FROM submissions WHERE id = $1`, [ref.id]);
    return result.rowCount ? mapSubmission(result.rows[0]) : null;
  },
};
