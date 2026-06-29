import { GraphQLError } from 'graphql';
import { db } from '../shared/db';
import { requireAdmin } from './helpers';
import { generateQuestions, answerQuestion } from '../internal/aiClient';

const OBJECTIVE = ['single', 'multiple', 'boolean'];

function iso(v: any): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function mapSkill(r: any) {
  return { id: r.id, name: r.name, slug: r.slug, category: r.category, isActive: r.is_active };
}

function mapExam(r: any) {
  return {
    id: r.id,
    skillId: r.skill_id,
    skillName: r.skill_name,
    level: r.level,
    title: r.title,
    description: r.description,
    passThreshold: r.pass_threshold,
    durationMinutes: r.duration_minutes,
    maxAttempts: r.max_attempts,
    questionCount: r.question_count,
    totalPoints: r.total_points,
    status: r.status,
    version: r.version,
    createdAt: iso(r.created_at),
    publishedAt: iso(r.published_at),
  };
}

function mapQuestion(r: any) {
  return {
    id: r.id,
    examId: r.exam_id,
    type: r.type,
    prompt: r.prompt,
    imageUrl: r.image_url,
    codeSnippet: r.code_snippet,
    codeLanguage: r.code_language,
    options: r.options ?? null, // JSONB → [{ id, text, imageUrl }]
    correctOptionIds: r.correct_option_ids ?? null,
    modelAnswer: r.model_answer,
    gradingRubric: r.grading_rubric,
    expectedLanguage: r.expected_language,
    explanation: r.explanation,
    points: r.points,
    position: r.position,
    aiGenerated: r.ai_generated,
  };
}

async function recompute(examId: string) {
  await db.query(
    `UPDATE skill_exams SET
       question_count = (SELECT COUNT(*) FROM exam_questions WHERE exam_id = $1),
       total_points   = (SELECT COALESCE(SUM(points),0) FROM exam_questions WHERE exam_id = $1)
     WHERE id = $1`,
    [examId],
  );
}

async function getExam(id: string) {
  const r = await db.query(`SELECT * FROM skill_exams WHERE id = $1`, [id]);
  if (!r.rows[0]) throw new GraphQLError('Exam not found', { extensions: { code: 'NOT_FOUND' } });
  return r.rows[0];
}

function optionsToJson(opts: any[] | undefined): string | null {
  if (!opts || !opts.length) return null;
  return JSON.stringify(
    opts.map((o, i) => ({ id: o.id ?? String(i), text: o.text ?? '', imageUrl: o.imageUrl ?? null })),
  );
}

export const examQueries = {
  async adminSkills(_: unknown, __: unknown, ctx: any) {
    requireAdmin(ctx);
    const r = await db.query(`SELECT * FROM skills_catalog WHERE is_active = TRUE ORDER BY category, name`);
    return r.rows.map(mapSkill);
  },

  async adminExams(
    _: unknown,
    args: { skillId?: string; level?: string; status?: string },
    ctx: any,
  ) {
    requireAdmin(ctx);
    const where: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (args.skillId) { where.push(`skill_id = $${i++}`); params.push(args.skillId); }
    if (args.level) { where.push(`level = $${i++}`); params.push(args.level); }
    if (args.status) { where.push(`status = $${i++}`); params.push(args.status); }
    const sql = `SELECT * FROM skill_exams ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
    const r = await db.query(sql, params);
    return r.rows.map(mapExam);
  },

  async adminExam(_: unknown, { id }: { id: string }, ctx: any) {
    requireAdmin(ctx);
    const r = await db.query(`SELECT * FROM skill_exams WHERE id = $1`, [id]);
    return r.rows[0] ? mapExam(r.rows[0]) : null;
  },
};

export const examTypeResolvers = {
  async questions(parent: any) {
    const r = await db.query(
      `SELECT * FROM exam_questions WHERE exam_id = $1 ORDER BY position ASC`,
      [parent.id],
    );
    return r.rows.map(mapQuestion);
  },
};

export const examMutations = {
  async createSkill(_: unknown, { name, category }: { name: string; category?: string }, ctx: any) {
    requireAdmin(ctx);
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const r = await db.query(
      `INSERT INTO skills_catalog (name, slug, category) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, is_active = TRUE
       RETURNING *`,
      [name.trim(), slug, category ?? null],
    );
    return mapSkill(r.rows[0]);
  },

  async createExam(_: unknown, { input }: any, ctx: any) {
    requireAdmin(ctx);
    const skill = await db.query(`SELECT name FROM skills_catalog WHERE id = $1`, [input.skillId]);
    if (!skill.rows[0]) throw new GraphQLError('Skill not found', { extensions: { code: 'BAD_USER_INPUT' } });
    const r = await db.query(
      `INSERT INTO skill_exams (skill_id, skill_name, level, title, description, pass_threshold, duration_minutes, max_attempts, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        input.skillId, skill.rows[0].name, input.level, input.title, input.description ?? null,
        input.passThreshold ?? 70, input.durationMinutes ?? 30, input.maxAttempts ?? 3, ctx.userId ?? null,
      ],
    );
    return mapExam(r.rows[0]);
  },

  async updateExam(_: unknown, { id, input }: any, ctx: any) {
    requireAdmin(ctx);
    await getExam(id);
    const r = await db.query(
      `UPDATE skill_exams SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         pass_threshold = COALESCE($4, pass_threshold),
         duration_minutes = COALESCE($5, duration_minutes),
         max_attempts = COALESCE($6, max_attempts)
       WHERE id = $1 RETURNING *`,
      [id, input.title ?? null, input.description ?? null, input.passThreshold ?? null, input.durationMinutes ?? null, input.maxAttempts ?? null],
    );
    return mapExam(r.rows[0]);
  },

  async generateExamQuestions(
    _: unknown,
    { examId, count, types }: { examId: string; count: number; types?: string[] },
    ctx: any,
  ) {
    requireAdmin(ctx);
    const exam = await getExam(examId);
    const generated = await generateQuestions(
      exam.skill_name,
      exam.level,
      Math.min(Math.max(count ?? 10, 1), 20),
      types,
    );
    const posRes = await db.query(
      `SELECT COALESCE(MAX(position), -1) AS maxpos FROM exam_questions WHERE exam_id = $1`,
      [examId],
    );
    let pos = Number(posRes.rows[0].maxpos);
    const inserted: any[] = [];
    for (const q of generated) {
      pos++;
      const isObjective = OBJECTIVE.includes(q.type);
      let optionsJson: string | null = null;
      let correctJson: string | null = null;
      if (isObjective) {
        let opts = q.options ?? [];
        if (q.type === 'boolean' && opts.length === 0) opts = ['True', 'False'];
        optionsJson = JSON.stringify(opts.map((text, i) => ({ id: String(i), text, imageUrl: null })));
        correctJson = JSON.stringify((q.correctIndexes ?? []).map(String));
      }
      const row = await db.query(
        `INSERT INTO exam_questions
           (exam_id, type, prompt, options, correct_option_ids, model_answer, grading_rubric, expected_language, explanation, points, position, ai_generated)
         VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,TRUE) RETURNING *`,
        [
          examId, q.type, q.prompt, optionsJson, correctJson,
          q.modelAnswer ?? null, q.gradingRubric ?? null, q.expectedLanguage ?? null,
          q.explanation ?? null, q.points ?? 1, pos,
        ],
      );
      inserted.push(mapQuestion(row.rows[0]));
    }
    await recompute(examId);
    return inserted;
  },

  // Use AI to fill in any missing answer keys on objective questions.
  async fixExamAnswers(_: unknown, { examId }: { examId: string }, ctx: any) {
    requireAdmin(ctx);
    await getExam(examId);
    const qs = await db.query(
      `SELECT * FROM exam_questions WHERE exam_id = $1 AND type IN ('single','multiple','boolean')`,
      [examId],
    );
    for (const q of qs.rows) {
      const correct = q.correct_option_ids ?? [];
      if (Array.isArray(correct) && correct.length > 0) continue;
      const opts = q.options ?? [];
      if (!Array.isArray(opts) || opts.length < 2) continue;
      try {
        const idx = await answerQuestion(q.type, q.prompt, opts.map((o: any) => o.text));
        const ids = idx.map((i: number) => opts[i]?.id).filter((x: any) => x != null);
        if (ids.length === 0) continue;
        await db.query(`UPDATE exam_questions SET correct_option_ids = $1::jsonb WHERE id = $2`, [
          JSON.stringify(ids),
          q.id,
        ]);
      } catch {
        // Skip this one (transient AI error) — re-running fixExamAnswers retries it.
        // Each successful fix is already committed, so progress isn't lost.
      }
    }
    return mapExam(await getExam(examId));
  },

  async addQuestion(_: unknown, { examId, input }: any, ctx: any) {
    requireAdmin(ctx);
    await getExam(examId);
    const posRes = await db.query(
      `SELECT COALESCE(MAX(position), -1) AS maxpos FROM exam_questions WHERE exam_id = $1`,
      [examId],
    );
    const pos = Number(posRes.rows[0].maxpos) + 1;
    const row = await db.query(
      `INSERT INTO exam_questions
         (exam_id, type, prompt, image_url, code_snippet, code_language, options, correct_option_ids, model_answer, grading_rubric, expected_language, explanation, points, position, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,FALSE) RETURNING *`,
      [
        examId, input.type, input.prompt, input.imageUrl ?? null, input.codeSnippet ?? null, input.codeLanguage ?? null,
        optionsToJson(input.options), input.correctOptionIds ? JSON.stringify(input.correctOptionIds) : null,
        input.modelAnswer ?? null, input.gradingRubric ?? null, input.expectedLanguage ?? null,
        input.explanation ?? null, input.points ?? 1, pos,
      ],
    );
    await recompute(examId);
    return mapQuestion(row.rows[0]);
  },

  async updateQuestion(_: unknown, { id, input }: any, ctx: any) {
    requireAdmin(ctx);
    const row = await db.query(
      `UPDATE exam_questions SET
         type = COALESCE($2, type),
         prompt = COALESCE($3, prompt),
         image_url = $4,
         code_snippet = $5,
         code_language = $6,
         options = COALESCE($7::jsonb, options),
         correct_option_ids = COALESCE($8::jsonb, correct_option_ids),
         model_answer = $9,
         grading_rubric = $10,
         expected_language = $11,
         explanation = $12,
         points = COALESCE($13, points)
       WHERE id = $1 RETURNING *`,
      [
        id, input.type ?? null, input.prompt ?? null, input.imageUrl ?? null, input.codeSnippet ?? null, input.codeLanguage ?? null,
        optionsToJson(input.options), input.correctOptionIds ? JSON.stringify(input.correctOptionIds) : null,
        input.modelAnswer ?? null, input.gradingRubric ?? null, input.expectedLanguage ?? null,
        input.explanation ?? null, input.points ?? null,
      ],
    );
    if (!row.rows[0]) throw new GraphQLError('Question not found', { extensions: { code: 'NOT_FOUND' } });
    await recompute(row.rows[0].exam_id);
    return mapQuestion(row.rows[0]);
  },

  async deleteQuestion(_: unknown, { id }: { id: string }, ctx: any) {
    requireAdmin(ctx);
    const r = await db.query(`DELETE FROM exam_questions WHERE id = $1 RETURNING exam_id`, [id]);
    if (r.rows[0]) await recompute(r.rows[0].exam_id);
    return r.rowCount! > 0;
  },

  async reorderQuestions(_: unknown, { examId, questionIds }: { examId: string; questionIds: string[] }, ctx: any) {
    requireAdmin(ctx);
    for (let i = 0; i < questionIds.length; i++) {
      await db.query(`UPDATE exam_questions SET position = $1 WHERE id = $2 AND exam_id = $3`, [i, questionIds[i], examId]);
    }
    return true;
  },

  async publishExam(_: unknown, { id }: { id: string }, ctx: any) {
    requireAdmin(ctx);
    await getExam(id);
    const qs = await db.query(
      `SELECT type, correct_option_ids, model_answer FROM exam_questions WHERE exam_id = $1`,
      [id],
    );
    if (qs.rows.length === 0) {
      throw new GraphQLError('Add at least one question before publishing', { extensions: { code: 'BAD_USER_INPUT' } });
    }
    for (const q of qs.rows) {
      const objective = OBJECTIVE.includes(q.type);
      if (objective && (!q.correct_option_ids || q.correct_option_ids.length === 0)) {
        throw new GraphQLError('Every multiple-choice question needs a correct answer', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!objective && !q.model_answer) {
        throw new GraphQLError('Every short-answer/code question needs a model answer', { extensions: { code: 'BAD_USER_INPUT' } });
      }
    }
    const r = await db.query(
      `UPDATE skill_exams SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return mapExam(r.rows[0]);
  },

  async archiveExam(_: unknown, { id }: { id: string }, ctx: any) {
    requireAdmin(ctx);
    const r = await db.query(`UPDATE skill_exams SET status = 'archived' WHERE id = $1 RETURNING *`, [id]);
    if (!r.rows[0]) throw new GraphQLError('Exam not found', { extensions: { code: 'NOT_FOUND' } });
    return mapExam(r.rows[0]);
  },
};
