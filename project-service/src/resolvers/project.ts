import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
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
    thumbnailUrl:    row.thumbnail_url ?? null,
    durationDays:    row.duration_days ?? null,
    deadline:        row.deadline instanceof Date ? row.deadline.toISOString() : (row.deadline ?? null),
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
    const result = await db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
    return result.rowCount ? mapProject(result.rows[0]) : null;
  },

  async projects(
    _: unknown,
    args: {
      status?: string;
      search?: string;
      skillLevel?: string;
      budgetMin?: number;
      budgetMax?: number;
      sortBy?: string;
      limit?: number;
      offset?: number;
    },
    ctx: any
  ) {
    const safeLimit = Math.min(args.limit ?? 20, 100);
    const offset = args.offset ?? 0;

    // Whitelist sort options to keep ORDER BY safe from injection.
    const ORDER: Record<string, string> = {
      latest:        'created_at DESC',
      budget_high:   'budget DESC, created_at DESC',
      budget_low:    'budget ASC, created_at DESC',
      deadline_soon: 'deadline ASC, created_at DESC',
    };
    const orderBy = ORDER[args.sortBy ?? 'latest'] ?? ORDER.latest;

    const where: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (args.status) {
      where.push(`status = $${i++}`);
      params.push(args.status);
    }
    if (args.search && args.search.trim()) {
      where.push(`(title ILIKE $${i} OR description ILIKE $${i})`);
      params.push(`%${args.search.trim()}%`);
      i++;
    }
    if (args.skillLevel) {
      where.push(`skill_level = $${i++}`);
      params.push(args.skillLevel);
    }
    if (args.budgetMin != null) {
      where.push(`budget >= $${i++}`);
      params.push(args.budgetMin);
    }
    if (args.budgetMax != null) {
      where.push(`budget <= $${i++}`);
      params.push(args.budgetMax);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(safeLimit, offset);

    const sql = `SELECT * FROM projects ${whereClause} ORDER BY ${orderBy} LIMIT $${i++} OFFSET $${i++}`;
    const result = await db.query(sql, params);
    return result.rows.map(mapProject);
  },

  async myProjects(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);
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
    return result.rows.map(mapProject);
  },

  async application(_: unknown, { id }: { id: string }, ctx: any) {
    requireAuth(ctx);
    const result = await db.query(`SELECT * FROM applications WHERE id = $1`, [id]);
    return result.rowCount ? mapApplication(result.rows[0]) : null;
  },

  async projectApplications(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    requireAuth(ctx);
    const result = await db.query(
      `SELECT * FROM applications WHERE project_id = $1 ORDER BY applied_at DESC`,
      [projectId]
    );
    return result.rows.map(mapApplication);
  },

  async myApplications(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);
    const result = await db.query(
      `SELECT * FROM applications WHERE student_id = $1 ORDER BY applied_at DESC`,
      [userId]
    );
    return result.rows.map(mapApplication);
  },

  async submission(_: unknown, { projectId }: { projectId: string }, ctx: any) {
    requireAuth(ctx);
    const result = await db.query(
      `SELECT * FROM submissions WHERE project_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [projectId]
    );
    return result.rowCount ? mapSubmission(result.rows[0]) : null;
  },
};

// ── Mutation resolvers ────────────────────────────────────────────────────────

export const projectMutations = {
  async createProject(
    _: unknown,
    { input }: { input: Record<string, any> },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'business') {
      throw new GraphQLError('Only business accounts can create projects', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const result = await db.query(
      `INSERT INTO projects
         (business_id, title, description, required_skills, skill_level, budget, currency, thumbnail_url, duration_days, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, 'open')
       RETURNING *`,
      [
        userId,
        input.title,
        input.description,
        input.requiredSkills,
        input.skillLevel,
        input.budget,
        input.currency ?? 'USD',
        input.thumbnailUrl ?? null,
        input.durationDays,
      ]
    );

    return mapProject(result.rows[0]);
  },

  async updateProject(
    _: unknown,
    { id, input }: { id: string; input: Record<string, any> },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

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
         duration_days   = COALESCE($7, duration_days),
         thumbnail_url   = COALESCE($8, thumbnail_url),
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
        input.durationDays    ?? null,
        input.thumbnailUrl    ?? null,
      ]
    );

    return mapProject(result.rows[0]);
  },

  async cancelProject(_: unknown, { id }: { id: string }, ctx: any) {
    const userId = requireAuth(ctx);

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

    return mapProject(result.rows[0]);
  },

  async applyToProject(
    _: unknown,
    { input }: { input: { projectId: string; coverNote?: string } },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

    if (ctx.accountType !== 'student') {
      throw new GraphQLError('Only student accounts can apply to projects', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

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

    return mapApplication(result.rows[0]);
  },

  async withdrawApplication(
    _: unknown,
    { applicationId }: { applicationId: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

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

    return mapApplication(result.rows[0]);
  },

  async selectStudent(
    _: unknown,
    { projectId, studentId }: { projectId: string; studentId: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

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

    // The delivery clock starts on selection: deadline = now + the duration in days.
    const result = await db.query(
      `UPDATE projects
       SET selected_student = $2,
           status = 'in_progress',
           deadline = NOW() + (COALESCE(duration_days, 0) * INTERVAL '1 day'),
           updated_at = NOW()
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

    // Start a chat between the business and the selected talent (idempotent).
    await db.query(
      `INSERT INTO chats (project_id, student_id, business_id)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM chats WHERE project_id = $1)`,
      [projectId, studentId, project.business_id]
    );

    return mapProject(result.rows[0]);
  },

  async submitWork(
    _: unknown,
    { input }: { input: { projectId: string; fileUrls: string[]; notes?: string } },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

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

    return mapSubmission(result.rows[0]);
  },

  async reviewSubmission(
    _: unknown,
    { projectId, approve, feedback }: { projectId: string; approve: boolean; feedback?: string },
    ctx: any
  ) {
    const userId = requireAuth(ctx);

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
    const newProjectStatus    = approve ? 'completed' : 'in_progress';

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

    // On approve, auto-create a portfolio entry for the student. This is a
    // cross-service write into portfolio_items (owned by portfolio-service);
    // we do it here in a single SQL statement that joins users for the
    // denormalised business name. Idempotent guard: skip if an entry for
    // this project already exists.
    if (approve) {
      const submission = result.rows[0];
      await db.query(
        `INSERT INTO portfolio_items
           (student_id, project_id, project_title, business_name,
            description, skills, file_urls, is_public, completed_at)
         SELECT
           $1,
           $2,
           p.title,
           COALESCE(u.full_name, 'Business'),
           p.description,
           p.required_skills,
           $3::text[],
           TRUE,
           NOW()
         FROM projects p
         JOIN users u ON u.id = p.business_id
         WHERE p.id = $2
           AND NOT EXISTS (
             SELECT 1 FROM portfolio_items
             WHERE project_id = $2 AND student_id = $1
           )`,
        [project.selected_student, projectId, submission.file_urls ?? []]
      );
    }

    return mapSubmission(result.rows[0]);
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
