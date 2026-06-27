/**
 * Skill Certification Exams — Phase 0 schema (plans/skill-certification-exams.md).
 *
 * Creates the canonical skills catalog, exams, questions (objective + AI-graded
 * short_answer/code), attempts, answers and certificates. Seeds a starter
 * skills catalog. Idempotent — CREATE TABLE/INDEX IF NOT EXISTS + ON CONFLICT.
 *
 * Usage: npx tsx migrate-skill-exams.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

const DB_CONFIG = {
  host: process.env.SUPABASE_POOL_HOST || '',
  port: parseInt(process.env.SUPABASE_POOL_PORT || '5432'),
  database: process.env.SUPABASE_POOL_DATABASE || 'postgres',
  user: process.env.SUPABASE_POOL_USER || '',
  password: process.env.SUPABASE_DB_PASSWORD || '',
};

const SEED_SKILLS: Array<[string, string, string]> = [
  // name, slug, category
  ['JavaScript', 'javascript', 'Development'],
  ['TypeScript', 'typescript', 'Development'],
  ['Python', 'python', 'Development'],
  ['React', 'react', 'Development'],
  ['Node.js', 'nodejs', 'Development'],
  ['SQL & Databases', 'sql-databases', 'Development'],
  ['UI/UX Design', 'ui-ux-design', 'Design'],
  ['Graphic Design', 'graphic-design', 'Design'],
  ['Digital Marketing', 'digital-marketing', 'Marketing'],
  ['Copywriting', 'copywriting', 'Marketing'],
  ['SEO', 'seo', 'Marketing'],
  ['Data Analysis', 'data-analysis', 'Data'],
  ['Video Editing', 'video-editing', 'Media'],
  ['Photography', 'photography', 'Media'],
  ['Virtual Assistance', 'virtual-assistance', 'Business'],
];

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS skills_catalog (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        slug        TEXT        UNIQUE NOT NULL,
        category    TEXT,
        description TEXT,
        icon        TEXT,
        is_active   BOOLEAN     DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✓ skills_catalog');

    await client.query(`
      CREATE TABLE IF NOT EXISTS skill_exams (
        id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_id              UUID        REFERENCES skills_catalog(id) ON DELETE CASCADE,
        skill_name            TEXT        NOT NULL,
        level                 TEXT        NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
        title                 TEXT        NOT NULL,
        description           TEXT,
        pass_threshold        INT         NOT NULL DEFAULT 70,
        duration_minutes      INT         NOT NULL DEFAULT 30,
        max_attempts          INT         NOT NULL DEFAULT 3,
        retake_cooldown_hours INT         NOT NULL DEFAULT 24,
        question_count        INT         NOT NULL DEFAULT 0,
        total_points          INT         NOT NULL DEFAULT 0,
        status                TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
        version               INT         NOT NULL DEFAULT 1,
        created_by            UUID,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        published_at          TIMESTAMPTZ
      );
    `);
    console.log('  ✓ skill_exams');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id            UUID        REFERENCES skill_exams(id) ON DELETE CASCADE,
        type               TEXT        NOT NULL CHECK (type IN ('single','multiple','boolean','short_answer','code')),
        prompt             TEXT        NOT NULL,
        image_url          TEXT,
        code_snippet       TEXT,
        code_language      TEXT,
        options            JSONB,
        correct_option_ids JSONB,
        model_answer       TEXT,
        grading_rubric     TEXT,
        expected_language  TEXT,
        explanation        TEXT,
        points             INT         NOT NULL DEFAULT 1,
        position           INT         NOT NULL DEFAULT 0,
        ai_generated       BOOLEAN     DEFAULT FALSE,
        created_at         TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  ✓ exam_questions');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id        UUID         REFERENCES skill_exams(id) ON DELETE CASCADE,
        talent_id      UUID         REFERENCES users(id) ON DELETE CASCADE,
        status         TEXT         NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','graded','expired')),
        started_at     TIMESTAMPTZ  DEFAULT NOW(),
        expires_at     TIMESTAMPTZ  NOT NULL,
        submitted_at   TIMESTAMPTZ,
        score_points   INT,
        total_points   INT,
        score_pct      NUMERIC(5,2),
        passed         BOOLEAN,
        grade          TEXT,
        question_order JSONB,
        attempt_number INT          NOT NULL DEFAULT 1
      );
    `);
    console.log('  ✓ exam_attempts');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_answers (
        id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id          UUID    REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id         UUID    REFERENCES exam_questions(id) ON DELETE CASCADE,
        selected_option_ids JSONB,
        text_answer         TEXT,
        is_correct          BOOLEAN,
        awarded_points      INT     DEFAULT 0,
        ai_feedback         TEXT,
        grading_status      TEXT    DEFAULT 'auto' CHECK (grading_status IN ('auto','pending_ai','ai_graded')),
        UNIQUE(attempt_id, question_id)
      );
    `);
    console.log('  ✓ exam_answers');

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_code TEXT        UNIQUE NOT NULL,
        attempt_id       UUID        REFERENCES exam_attempts(id) ON DELETE CASCADE,
        talent_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
        exam_id          UUID        REFERENCES skill_exams(id) ON DELETE SET NULL,
        skill_name       TEXT        NOT NULL,
        level            TEXT        NOT NULL,
        score_pct        NUMERIC(5,2),
        grade            TEXT,
        talent_name      TEXT,
        pdf_url          TEXT,
        png_url          TEXT,
        issued_at        TIMESTAMPTZ DEFAULT NOW(),
        is_revoked       BOOLEAN     DEFAULT FALSE
      );
    `);
    console.log('  ✓ certificates');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id, position)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_exam_attempts_talent ON exam_attempts(talent_id, exam_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_skill_exams_lookup ON skill_exams(skill_id, level, status)`);
    console.log('  ✓ indices');

    for (const [name, slug, category] of SEED_SKILLS) {
      await client.query(
        `INSERT INTO skills_catalog (name, slug, category) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO NOTHING`,
        [name, slug, category]
      );
    }
    const { rows } = await client.query(`SELECT COUNT(*)::int AS n FROM skills_catalog`);
    console.log(`  ✓ skills catalog seeded (${rows[0].n} total)`);

    console.log('\nSkill-exams migration complete.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
