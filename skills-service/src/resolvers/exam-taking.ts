import { GraphQLError } from 'graphql';
import { randomBytes } from 'crypto';
import { db } from '../shared/db';
import { requireAuth } from './helpers';
import { gradeAnswer } from '../internal/aiClient';

const OBJECTIVE = ['single', 'multiple', 'boolean'];

function iso(v: any): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Answer-SECRET projection — never leaks correct answers / model answers.
function mapTakingQuestion(r: any) {
  return {
    id: r.id,
    type: r.type,
    prompt: r.prompt,
    imageUrl: r.image_url,
    codeSnippet: r.code_snippet,
    codeLanguage: r.code_language,
    options: (r.options ?? []).map((o: any) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl ?? null })),
    points: r.points,
  };
}

function mapAttempt(r: any) {
  return {
    id: r.id,
    examId: r.exam_id,
    status: r.status,
    scorePct: r.score_pct != null ? Number(r.score_pct) : null,
    passed: r.passed,
    grade: r.grade,
    scorePoints: r.score_points,
    totalPoints: r.total_points,
    submittedAt: iso(r.submitted_at),
    attemptNumber: r.attempt_number,
  };
}

async function questionsInOrder(examId: string, order: string[]) {
  const r = await db.query(`SELECT * FROM exam_questions WHERE exam_id = $1`, [examId]);
  const byId = new Map(r.rows.map((q: any) => [q.id, q]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean);
  // include any not in the saved order (e.g. added later) at the end
  for (const q of r.rows) if (!order.includes(q.id)) ordered.push(q);
  return ordered as any[];
}

async function loadInProgress(attemptId: string) {
  const a = (await db.query(`SELECT * FROM exam_attempts WHERE id = $1`, [attemptId])).rows[0];
  const exam = (await db.query(`SELECT title, duration_minutes FROM skill_exams WHERE id = $1`, [a.exam_id])).rows[0];
  const order: string[] = a.question_order ?? [];
  const questions = await questionsInOrder(a.exam_id, order);
  const saved = await db.query(
    `SELECT question_id, selected_option_ids, text_answer FROM exam_answers WHERE attempt_id = $1`,
    [attemptId],
  );
  return {
    id: a.id,
    examId: a.exam_id,
    examTitle: exam?.title,
    expiresAt: iso(a.expires_at),
    durationMinutes: exam?.duration_minutes,
    attemptNumber: a.attempt_number,
    questions: questions.map(mapTakingQuestion),
    savedAnswers: saved.rows.map((s: any) => ({
      questionId: s.question_id,
      selectedOptionIds: s.selected_option_ids ?? [],
      textAnswer: s.text_answer,
    })),
  };
}

async function loadResult(attemptId: string) {
  const a = (await db.query(`SELECT * FROM exam_attempts WHERE id = $1`, [attemptId])).rows[0];
  const exam = (await db.query(`SELECT title, skill_name, level FROM skill_exams WHERE id = $1`, [a.exam_id])).rows[0];
  const cert = (await db.query(`SELECT certificate_code FROM certificates WHERE attempt_id = $1`, [attemptId])).rows[0];
  const qs = await db.query(`SELECT * FROM exam_questions WHERE exam_id = $1`, [a.exam_id]);
  const ans = await db.query(`SELECT * FROM exam_answers WHERE attempt_id = $1`, [attemptId]);
  const ansByQ = new Map(ans.rows.map((r: any) => [r.question_id, r]));
  const order: string[] = a.question_order ?? qs.rows.map((q: any) => q.id);
  const ordered = await questionsInOrder(a.exam_id, order);
  return {
    id: a.id,
    examId: a.exam_id,
    examTitle: exam?.title,
    skillName: exam?.skill_name,
    level: exam?.level,
    scorePct: a.score_pct != null ? Number(a.score_pct) : null,
    passed: a.passed,
    grade: a.grade,
    scorePoints: a.score_points,
    totalPoints: a.total_points,
    submittedAt: iso(a.submitted_at),
    certificateCode: cert?.certificate_code ?? null,
    answers: ordered.map((q: any) => {
      const av = ansByQ.get(q.id);
      return {
        questionId: q.id,
        type: q.type,
        prompt: q.prompt,
        options: (q.options ?? []).map((o: any) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl ?? null })),
        selectedOptionIds: av?.selected_option_ids ?? [],
        textAnswer: av?.text_answer ?? null,
        correctOptionIds: q.correct_option_ids ?? [],
        isCorrect: av?.is_correct ?? false,
        awardedPoints: av?.awarded_points ?? 0,
        points: q.points,
        feedback: av?.ai_feedback ?? null,
        explanation: q.explanation,
      };
    }),
  };
}

async function issueCertificate(attemptId: string, talentId: string, exam: any, scorePct: number, grade: string) {
  const exists = await db.query(`SELECT id FROM certificates WHERE attempt_id = $1`, [attemptId]);
  if (exists.rows[0]) return;
  const u = (await db.query(`SELECT full_name FROM users WHERE id = $1`, [talentId])).rows[0];
  const code = `QS-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  await db.query(
    `INSERT INTO certificates (certificate_code, attempt_id, talent_id, exam_id, skill_name, level, score_pct, grade, talent_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [code, attemptId, talentId, exam.id, exam.skill_name, exam.level, scorePct, grade, u?.full_name ?? null],
  );
}

export const takingQueries = {
  async publishedExams(_: unknown, args: { skillId?: string; level?: string }, ctx: any) {
    requireAuth(ctx);
    const where = [`status = 'published'`];
    const params: any[] = [];
    let i = 1;
    if (args.skillId) { where.push(`skill_id = $${i++}`); params.push(args.skillId); }
    if (args.level) { where.push(`level = $${i++}`); params.push(args.level); }
    const r = await db.query(
      `SELECT * FROM skill_exams WHERE ${where.join(' AND ')} ORDER BY skill_name, level`,
      params,
    );
    return r.rows.map((e: any) => ({
      id: e.id, skillName: e.skill_name, level: e.level, title: e.title, description: e.description,
      passThreshold: e.pass_threshold, durationMinutes: e.duration_minutes, maxAttempts: e.max_attempts,
      questionCount: e.question_count, totalPoints: e.total_points,
    }));
  },

  async myExamAttempts(_: unknown, { examId }: { examId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(
      `SELECT * FROM exam_attempts WHERE exam_id = $1 AND talent_id = $2 ORDER BY started_at DESC`,
      [examId, userId],
    );
    return r.rows.map(mapAttempt);
  },

  async activeAttempt(_: unknown, { examId }: { examId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(
      `SELECT id FROM exam_attempts WHERE exam_id = $1 AND talent_id = $2 AND status = 'in_progress' AND expires_at > NOW() LIMIT 1`,
      [examId, userId],
    );
    return r.rows[0] ? loadInProgress(r.rows[0].id) : null;
  },

  async attemptResult(_: unknown, { attemptId }: { attemptId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    const a = (await db.query(`SELECT talent_id, status FROM exam_attempts WHERE id = $1`, [attemptId])).rows[0];
    if (!a || a.talent_id !== userId) throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } });
    return loadResult(attemptId);
  },

  // PUBLIC — no auth. Anyone can verify a certificate by its code.
  async certificate(_: unknown, { code }: { code: string }) {
    const r = await db.query(`SELECT * FROM certificates WHERE certificate_code = $1`, [code]);
    return r.rows[0] ? mapCert(r.rows[0]) : null;
  },

  async myCertificates(_: unknown, __: unknown, ctx: any) {
    const userId = requireAuth(ctx);
    const r = await db.query(
      `SELECT * FROM certificates WHERE talent_id = $1 AND is_revoked = FALSE ORDER BY issued_at DESC`,
      [userId],
    );
    return r.rows.map(mapCert);
  },
};

function mapCert(r: any) {
  return {
    id: r.id,
    certificateCode: r.certificate_code,
    skillName: r.skill_name,
    level: r.level,
    scorePct: r.score_pct != null ? Number(r.score_pct) : null,
    grade: r.grade,
    talentName: r.talent_name,
    issuedAt: iso(r.issued_at),
    isRevoked: r.is_revoked,
  };
}

export const takingMutations = {
  async startAttempt(_: unknown, { examId }: { examId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    const exam = (await db.query(`SELECT * FROM skill_exams WHERE id = $1 AND status = 'published'`, [examId])).rows[0];
    if (!exam) throw new GraphQLError('Exam not available', { extensions: { code: 'NOT_FOUND' } });

    const active = await db.query(
      `SELECT id FROM exam_attempts WHERE exam_id = $1 AND talent_id = $2 AND status = 'in_progress' AND expires_at > NOW() LIMIT 1`,
      [examId, userId],
    );
    if (active.rows[0]) return loadInProgress(active.rows[0].id);

    const prior = (await db.query(
      `SELECT COUNT(*)::int AS n, MAX(submitted_at) AS last FROM exam_attempts WHERE exam_id = $1 AND talent_id = $2 AND status IN ('submitted','graded')`,
      [examId, userId],
    )).rows[0];
    if (prior.n >= exam.max_attempts) {
      throw new GraphQLError('No attempts remaining for this exam', { extensions: { code: 'FORBIDDEN' } });
    }
    if (prior.last && exam.retake_cooldown_hours > 0) {
      const next = new Date(prior.last).getTime() + exam.retake_cooldown_hours * 3600_000;
      if (Date.now() < next) {
        throw new GraphQLError('Retake cooldown is still active', { extensions: { code: 'FORBIDDEN' } });
      }
    }

    const qids = (await db.query(`SELECT id FROM exam_questions WHERE exam_id = $1`, [examId])).rows.map((r: any) => r.id);
    if (qids.length === 0) throw new GraphQLError('Exam has no questions', { extensions: { code: 'BAD_USER_INPUT' } });
    const order = shuffle(qids);
    const expiresAt = new Date(Date.now() + exam.duration_minutes * 60_000);
    const att = await db.query(
      `INSERT INTO exam_attempts (exam_id, talent_id, expires_at, question_order, attempt_number)
       VALUES ($1,$2,$3,$4::jsonb,$5) RETURNING id`,
      [examId, userId, expiresAt.toISOString(), JSON.stringify(order), prior.n + 1],
    );
    return loadInProgress(att.rows[0].id);
  },

  async saveAnswer(
    _: unknown,
    { attemptId, questionId, optionIds, textAnswer }: any,
    ctx: any,
  ) {
    const userId = requireAuth(ctx);
    const a = (await db.query(`SELECT talent_id, status, expires_at FROM exam_attempts WHERE id = $1`, [attemptId])).rows[0];
    if (!a || a.talent_id !== userId) throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } });
    if (a.status !== 'in_progress' || new Date(a.expires_at).getTime() < Date.now()) {
      throw new GraphQLError('This attempt is no longer active', { extensions: { code: 'FORBIDDEN' } });
    }
    await db.query(
      `INSERT INTO exam_answers (attempt_id, question_id, selected_option_ids, text_answer)
       VALUES ($1,$2,$3::jsonb,$4)
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET selected_option_ids = EXCLUDED.selected_option_ids, text_answer = EXCLUDED.text_answer`,
      [attemptId, questionId, JSON.stringify(optionIds ?? []), textAnswer ?? null],
    );
    return true;
  },

  async submitAttempt(_: unknown, { attemptId }: { attemptId: string }, ctx: any) {
    const userId = requireAuth(ctx);
    const a = (await db.query(`SELECT * FROM exam_attempts WHERE id = $1`, [attemptId])).rows[0];
    if (!a || a.talent_id !== userId) throw new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } });
    if (a.status !== 'in_progress') return loadResult(attemptId);

    const exam = (await db.query(`SELECT * FROM skill_exams WHERE id = $1`, [a.exam_id])).rows[0];
    const questions = (await db.query(`SELECT * FROM exam_questions WHERE exam_id = $1`, [a.exam_id])).rows;
    const answers = (await db.query(`SELECT * FROM exam_answers WHERE attempt_id = $1`, [attemptId])).rows;
    const ansByQ = new Map(answers.map((r: any) => [r.question_id, r]));

    let scorePoints = 0;
    let totalPoints = 0;
    for (const q of questions) {
      totalPoints += q.points;
      const av: any = ansByQ.get(q.id);
      let awarded = 0;
      let isCorrect = false;
      let feedback: string | null = null;
      let gradingStatus = 'auto';

      if (OBJECTIVE.includes(q.type)) {
        const selected: string[] = av?.selected_option_ids ?? [];
        const correct: string[] = q.correct_option_ids ?? [];
        isCorrect = selected.length === correct.length && selected.every((s) => correct.includes(s)) && correct.length > 0;
        awarded = isCorrect ? q.points : 0;
      } else {
        gradingStatus = 'ai_graded';
        const text = (av?.text_answer ?? '').trim();
        if (text) {
          try {
            const res = await gradeAnswer({
              prompt: q.prompt,
              modelAnswer: q.model_answer ?? undefined,
              rubric: q.grading_rubric ?? undefined,
              language: q.expected_language ?? undefined,
              answer: text,
              maxPoints: q.points,
            });
            awarded = Math.round(Math.max(0, Math.min(res.awardedPoints, q.points)));
            isCorrect = res.isCorrect;
            feedback = res.feedback;
          } catch {
            feedback = 'Could not be graded automatically.';
          }
        }
      }
      scorePoints += awarded;
      await db.query(
        `INSERT INTO exam_answers (attempt_id, question_id, selected_option_ids, text_answer, is_correct, awarded_points, ai_feedback, grading_status)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8)
         ON CONFLICT (attempt_id, question_id)
         DO UPDATE SET is_correct = EXCLUDED.is_correct, awarded_points = EXCLUDED.awarded_points,
                       ai_feedback = EXCLUDED.ai_feedback, grading_status = EXCLUDED.grading_status`,
        [
          attemptId, q.id, JSON.stringify(av?.selected_option_ids ?? []), av?.text_answer ?? null,
          isCorrect, awarded, feedback, gradingStatus,
        ],
      );
    }

    const scorePct = totalPoints > 0 ? Math.round((scorePoints / totalPoints) * 10000) / 100 : 0;
    const passed = scorePct >= exam.pass_threshold;
    const grade = !passed ? 'fail' : scorePct >= 90 ? 'distinction' : scorePct >= 75 ? 'merit' : 'pass';

    await db.query(
      `UPDATE exam_attempts SET status = 'graded', submitted_at = NOW(),
         score_points = $2, total_points = $3, score_pct = $4, passed = $5, grade = $6
       WHERE id = $1`,
      [attemptId, scorePoints, totalPoints, scorePct, passed, grade],
    );
    if (passed) await issueCertificate(attemptId, userId, exam, scorePct, grade);
    return loadResult(attemptId);
  },
};
