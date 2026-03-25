/**
 * Main Application Database Seed
 * Target: qmchnooeuskhepbvxofk (primary Supabase instance)
 *
 * Run: npx tsx seed-main.ts
 *
 * Idempotent — safe to run multiple times (uses ON CONFLICT DO NOTHING).
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

config({ path: resolve(__dirname, '../main-server/.env') });

// Use individual params to avoid URL-parsing issues with special chars in password
const DB_CONFIG = {
  host:     process.env.SUPERBASE_POOL_HOST     || '',
  port:     parseInt(process.env.SUPERBASE_POOL_PORT || '5432'),
  database: process.env.SUPERBASE_POOL_DATABASE || 'postgres',
  user:     process.env.SUPERBASE_POOL_USER     || '',
  password: process.env.SUPERBASE_DB_PASSWORD   || '',
};

if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password) {
  console.error('Missing Supabase connection vars in main-server/.env');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// DROP  (reverse FK order — ensures clean re-seed every run)
// ─────────────────────────────────────────────────────────────────────────────

const DROP = `
DROP TABLE IF EXISTS messages             CASCADE;
DROP TABLE IF EXISTS chats                CASCADE;
DROP TABLE IF EXISTS disputes             CASCADE;
DROP TABLE IF EXISTS notifications        CASCADE;
DROP TABLE IF EXISTS ratings              CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS milestones           CASCADE;
DROP TABLE IF EXISTS escrow_accounts      CASCADE;
DROP TABLE IF EXISTS portfolio_items      CASCADE;
DROP TABLE IF EXISTS submissions          CASCADE;
DROP TABLE IF EXISTS applications         CASCADE;
DROP TABLE IF EXISTS projects             CASCADE;
DROP TABLE IF EXISTS assessment_sessions  CASCADE;
DROP TABLE IF EXISTS skill_assessments    CASCADE;
DROP TABLE IF EXISTS skill_categories     CASCADE;
DROP TABLE IF EXISTS user_verifications   CASCADE;
DROP TABLE IF EXISTS business_profiles    CASCADE;
DROP TABLE IF EXISTS student_profiles     CASCADE;
DROP TABLE IF EXISTS refresh_tokens       CASCADE;
DROP TABLE IF EXISTS otp_tokens           CASCADE;
DROP TABLE IF EXISTS users                CASCADE;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const SCHEMA = `
-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        UNIQUE NOT NULL,
  account_type   TEXT        NOT NULL CHECK (account_type IN ('student', 'business')),
  full_name      TEXT,
  avatar_url     TEXT,
  country        TEXT,
  email_verified BOOLEAN     DEFAULT FALSE,
  phone_verified BOOLEAN     DEFAULT FALSE,
  is_verified    BOOLEAN     DEFAULT FALSE,
  verified_badge TEXT,
  is_active      BOOLEAN     DEFAULT TRUE,
  is_flagged     BOOLEAN     DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auth ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  otp_hash   TEXT        NOT NULL,
  used       BOOLEAN     DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id         UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  university      TEXT,
  graduation_year INT,
  skills          TEXT[],
  skill_level     TEXT         CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  total_earnings  DECIMAL(12,2) DEFAULT 0,
  average_rating  DECIMAL(3,2),
  portfolio_url   TEXT,
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_profiles (
  user_id               UUID         PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name          TEXT         NOT NULL,
  website               TEXT,
  industry              TEXT,
  country               TEXT,
  description           TEXT,
  total_projects_posted INT          DEFAULT 0,
  average_rating        DECIMAL(3,2),
  updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_verifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_url TEXT,
  admin_note   TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

-- ── Skills ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_categories (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT    NOT NULL UNIQUE,
  parent_category TEXT,
  skills          TEXT[]
);

CREATE TABLE IF NOT EXISTS skill_assessments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL,
  level        TEXT        NOT NULL,
  score        INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, category)
);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        REFERENCES users(id) ON DELETE CASCADE,
  category   TEXT        NOT NULL,
  questions  JSONB       NOT NULL,
  answers    JSONB,
  status     TEXT        DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID         REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT         NOT NULL,
  description      TEXT         NOT NULL,
  required_skills  TEXT[],
  skill_level      TEXT         NOT NULL,
  budget           DECIMAL(12,2) NOT NULL,
  currency         TEXT         NOT NULL DEFAULT 'NGN',
  deadline         TIMESTAMPTZ  NOT NULL,
  status           TEXT         DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_review', 'completed', 'disputed', 'cancelled')),
  selected_student UUID         REFERENCES users(id),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_skills ON projects USING GIN(required_skills);

CREATE TABLE IF NOT EXISTS applications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID        REFERENCES users(id) ON DELETE CASCADE,
  cover_note TEXT,
  status     TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_project ON applications(project_id, status);

CREATE TABLE IF NOT EXISTS submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        REFERENCES projects(id) ON DELETE CASCADE,
  student_id   UUID        REFERENCES users(id) ON DELETE CASCADE,
  file_urls    TEXT[],
  notes        TEXT,
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested')),
  feedback     TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

-- ── Portfolio ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_items (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID         REFERENCES users(id) ON DELETE CASCADE,
  project_id    UUID         REFERENCES projects(id) ON DELETE CASCADE,
  project_title TEXT         NOT NULL,
  business_name TEXT         NOT NULL,
  description   TEXT,
  skills        TEXT[],
  file_urls     TEXT[],
  client_rating DECIMAL(3,2),
  client_review TEXT,
  is_public     BOOLEAN      DEFAULT TRUE,
  completed_at  TIMESTAMPTZ  NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_student ON portfolio_items(student_id);

-- ── Payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID         REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  business_id  UUID         REFERENCES users(id),
  student_id   UUID         REFERENCES users(id),
  amount       DECIMAL(12,2) NOT NULL,
  currency     TEXT         NOT NULL DEFAULT 'NGN',
  gateway      TEXT         NOT NULL,
  gateway_ref  TEXT,
  status       TEXT         DEFAULT 'held' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  platform_fee DECIMAL(12,2),
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  released_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS milestones (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id   UUID         REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  label       TEXT         NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  percentage  INT,
  status      TEXT         DEFAULT 'pending' CHECK (status IN ('pending', 'released')),
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         REFERENCES users(id),
  escrow_id   UUID         REFERENCES escrow_accounts(id),
  type        TEXT         NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  currency    TEXT         NOT NULL,
  gateway_ref TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Ratings & Reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id      UUID        REFERENCES users(id),
  reviewee_id      UUID        REFERENCES users(id),
  reviewer_type    TEXT        NOT NULL CHECK (reviewer_type IN ('student', 'business')),
  quality          INT         CHECK (quality BETWEEN 1 AND 5),
  communication    INT         CHECK (communication BETWEEN 1 AND 5),
  speed            INT         CHECK (speed BETWEEN 1 AND 5),
  professionalism  INT         CHECK (professionalism BETWEEN 1 AND 5),
  payment_fairness INT         CHECK (payment_fairness BETWEEN 1 AND 5),
  clarity          INT         CHECK (clarity BETWEEN 1 AND 5),
  respect          INT         CHECK (respect BETWEEN 1 AND 5),
  comment          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id)
);

-- Ensure column exists on pre-existing tables (idempotent migration)
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS reviewee_id UUID REFERENCES users(id);
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS reviewer_type TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS quality INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS communication INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS speed INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS professionalism INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS payment_fairness INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS clarity INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS respect INT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS comment TEXT;

CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON ratings(reviewee_id);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ── Disputes ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  raised_by   UUID        REFERENCES users(id),
  reason      TEXT        NOT NULL,
  evidence    TEXT[],
  status      TEXT        DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  resolution  TEXT        CHECK (resolution IN ('release_to_student', 'refund_to_business', 'split')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ── Chat ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  student_id  UUID        REFERENCES users(id),
  business_id UUID        REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         UUID        REFERENCES chats(id) ON DELETE CASCADE,
  sender_id       UUID        REFERENCES users(id),
  content         TEXT,
  attachment_urls TEXT[],
  is_read         BOOLEAN     DEFAULT FALSE,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, sent_at DESC);
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEED — SKILL CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

const SKILL_CATEGORIES = `
INSERT INTO skill_categories (name, parent_category, skills) VALUES

-- Technology
('Technology', NULL, ARRAY[
  'Software Development', 'Web Development', 'Mobile App Development',
  'AI & Machine Learning', 'Blockchain', 'Cybersecurity',
  'Cloud Computing', 'DevOps', 'Data Engineering'
]),
('Software Development', 'Technology', ARRAY[
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift'
]),
('Web Development', 'Technology', ARRAY[
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django',
  'Laravel', 'HTML/CSS', 'Tailwind CSS', 'GraphQL', 'REST APIs'
]),
('Mobile App Development', 'Technology', ARRAY[
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Expo'
]),
('AI & Machine Learning', 'Technology', ARRAY[
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'LLM Fine-tuning'
]),
('Blockchain', 'Technology', ARRAY[
  'Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js', 'DeFi', 'NFT Development'
]),
('Cybersecurity', 'Technology', ARRAY[
  'Penetration Testing', 'Network Security', 'SIEM', 'Ethical Hacking',
  'Vulnerability Assessment', 'SOC Analysis'
]),
('Cloud Computing', 'Technology', ARRAY[
  'AWS', 'Google Cloud', 'Azure', 'Terraform', 'Kubernetes', 'Docker'
]),
('DevOps', 'Technology', ARRAY[
  'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible', 'Monitoring', 'Linux'
]),
('Data Engineering', 'Technology', ARRAY[
  'Apache Spark', 'Kafka', 'Airflow', 'dbt', 'SQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'ETL Pipelines'
]),

-- Design
('Design', NULL, ARRAY[
  'Graphic Design', 'UI/UX Design', 'Animation', 'Motion Graphics',
  '3D Design', 'Illustration', 'Branding'
]),
('Graphic Design', 'Design', ARRAY[
  'Photoshop', 'Illustrator', 'InDesign', 'Canva', 'Logo Design',
  'Print Design', 'Social Media Graphics'
]),
('UI/UX Design', 'Design', ARRAY[
  'Figma', 'Sketch', 'Adobe XD', 'Wireframing', 'Prototyping',
  'User Research', 'Usability Testing', 'Design Systems'
]),
('Animation', 'Design', ARRAY[
  'After Effects', 'Lottie', 'CSS Animation', 'Spine 2D', 'GIF Animation'
]),
('Motion Graphics', 'Design', ARRAY[
  'After Effects', 'Cinema 4D', 'DaVinci Resolve', 'Motion Design'
]),
('3D Design', 'Design', ARRAY[
  'Blender', 'Cinema 4D', '3ds Max', 'Maya', 'ZBrush', 'Unreal Engine'
]),
('Illustration', 'Design', ARRAY[
  'Digital Illustration', 'Character Design', 'Procreate', 'Comic Art',
  'Children''s Book Illustration'
]),
('Branding', 'Design', ARRAY[
  'Brand Identity', 'Brand Strategy', 'Style Guides', 'Packaging Design'
]),

-- Marketing
('Marketing', NULL, ARRAY[
  'Social Media Marketing', 'SEO', 'Paid Advertising',
  'Email Marketing', 'Influencer Marketing', 'Affiliate Marketing'
]),
('Social Media Marketing', 'Marketing', ARRAY[
  'Instagram Marketing', 'TikTok Marketing', 'Twitter/X Marketing',
  'LinkedIn Marketing', 'Community Management', 'Content Strategy'
]),
('SEO', 'Marketing', ARRAY[
  'On-page SEO', 'Technical SEO', 'Link Building', 'Keyword Research',
  'SEMrush', 'Ahrefs', 'Google Analytics'
]),
('Paid Advertising', 'Marketing', ARRAY[
  'Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads',
  'Ad Copywriting', 'A/B Testing', 'Conversion Optimization'
]),
('Email Marketing', 'Marketing', ARRAY[
  'Mailchimp', 'Klaviyo', 'Email Copywriting', 'Drip Campaigns',
  'List Building', 'Newsletter Design'
]),

-- Content Creation
('Content Creation', NULL, ARRAY[
  'Blogging', 'Copywriting', 'Scriptwriting', 'Ghostwriting',
  'Technical Writing', 'Podcast Editing'
]),
('Copywriting', 'Content Creation', ARRAY[
  'Sales Copy', 'Website Copy', 'Ad Copy', 'Product Descriptions',
  'Email Copy', 'Landing Pages'
]),
('Technical Writing', 'Content Creation', ARRAY[
  'API Documentation', 'User Manuals', 'White Papers',
  'Case Studies', 'Developer Guides'
]),

-- Video & Media
('Video & Media', NULL, ARRAY[
  'Video Editing', 'YouTube Editing', 'Cinematography',
  'Sound Design', 'Voice-over'
]),
('Video Editing', 'Video & Media', ARRAY[
  'Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'CapCut',
  'Color Grading', 'Motion Graphics'
]),
('Voice-over', 'Video & Media', ARRAY[
  'Commercial Voice-over', 'E-learning Narration', 'Audiobook Recording',
  'Character Voices', 'Podcast Hosting'
]),

-- Data & Analytics
('Data & Analytics', NULL, ARRAY[
  'Data Analysis', 'Business Intelligence', 'Financial Modeling', 'Statistics'
]),
('Data Analysis', 'Data & Analytics', ARRAY[
  'Excel', 'Python (Pandas)', 'R', 'SQL', 'Tableau', 'Power BI',
  'Google Data Studio', 'Statistical Analysis'
]),
('Business Intelligence', 'Data & Analytics', ARRAY[
  'Power BI', 'Tableau', 'Looker', 'Data Warehousing',
  'KPI Dashboards', 'Reporting'
]),

-- Business Services
('Business Services', NULL, ARRAY[
  'Virtual Assistance', 'Project Management', 'Research',
  'Customer Support', 'Bookkeeping'
]),
('Virtual Assistance', 'Business Services', ARRAY[
  'Email Management', 'Calendar Management', 'Data Entry',
  'Administrative Support', 'CRM Management'
]),
('Project Management', 'Business Services', ARRAY[
  'Agile', 'Scrum', 'Jira', 'Trello', 'Asana',
  'Risk Management', 'Stakeholder Communication'
]),

-- Trending Skills
('Trending Skills', NULL, ARRAY[
  'AI Prompt Engineering', 'AI Automation', 'No-code Development',
  'Web3', 'AR/VR Design', 'Game Development'
]),
('AI Prompt Engineering', 'Trending Skills', ARRAY[
  'ChatGPT', 'Claude', 'Midjourney', 'Stable Diffusion',
  'LangChain', 'RAG Systems', 'AI Workflow Automation'
]),
('No-code Development', 'Trending Skills', ARRAY[
  'Webflow', 'Bubble', 'Glide', 'Zapier', 'Make (Integromat)',
  'Notion', 'Airtable'
]),
('Game Development', 'Trending Skills', ARRAY[
  'Unity', 'Unreal Engine', 'Godot', 'Game Design',
  'Level Design', 'C# for Unity', 'Blueprints (Unreal)'
])

ON CONFLICT (name) DO NOTHING;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEED — TEST USERS (development only)
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USERS = `
-- Students
INSERT INTO users (id, email, account_type, full_name, country, email_verified, is_verified, verified_badge) VALUES
  ('00000000-0000-0000-0000-000000000001', 'ada.okafor@dev.test',    'student',  'Ada Okafor',       'Nigeria',     TRUE, TRUE, 'verified_talent'),
  ('00000000-0000-0000-0000-000000000002', 'carlos.mendez@dev.test', 'student',  'Carlos Mendez',    'Spain',       TRUE, TRUE, 'verified_talent'),
  ('00000000-0000-0000-0000-000000000003', 'priya.sharma@dev.test',  'student',  'Priya Sharma',     'India',       TRUE, FALSE, NULL),
-- Businesses
  ('00000000-0000-0000-0000-000000000004', 'techcorp@dev.test',      'business', 'TechCorp Lagos',   'Nigeria',     TRUE, TRUE, 'verified_business'),
  ('00000000-0000-0000-0000-000000000005', 'startuphub@dev.test',    'business', 'StartupHub London','United Kingdom',TRUE, TRUE, 'verified_business')
ON CONFLICT (email) DO NOTHING;

-- Student profiles
INSERT INTO student_profiles (user_id, bio, university, graduation_year, skills, skill_level, total_earnings, average_rating) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Full-stack developer passionate about building products that solve real African problems.',
    'University of Lagos', 2024,
    ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    'advanced', 185000.00, 4.80
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'UI/UX designer with 2 years of freelance experience. Love clean, accessible interfaces.',
    'Universidad Complutense de Madrid', 2023,
    ARRAY['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    'intermediate', 95000.00, 4.60
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Data science student exploring analytics and machine learning.',
    'IIT Bombay', 2025,
    ARRAY['Python', 'Pandas', 'SQL', 'Tableau'],
    'beginner', 0.00, NULL
  )
ON CONFLICT (user_id) DO NOTHING;

-- Business profiles
INSERT INTO business_profiles (user_id, company_name, website, industry, country, description, total_projects_posted, average_rating) VALUES
  (
    '00000000-0000-0000-0000-000000000004',
    'TechCorp Lagos', 'https://techcorp.ng', 'Software & Technology', 'Nigeria',
    'Fast-growing Lagos tech company building fintech and logistics solutions across West Africa.',
    3, 4.70
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'StartupHub London', 'https://startuphub.co.uk', 'Startup Ecosystem', 'United Kingdom',
    'London-based startup studio that co-builds early-stage SaaS products.',
    1, 4.90
  )
ON CONFLICT (user_id) DO NOTHING;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEED — SAMPLE PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

const TEST_PROJECTS = `
-- Open projects
INSERT INTO projects (id, business_id, title, description, required_skills, skill_level, budget, currency, deadline, status) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'Build a responsive landing page for our fintech product',
  'We need a clean, modern landing page for our new mobile money product. Must be fully responsive, fast-loading, and have a working contact form. Design will be provided in Figma.',
  ARRAY['React', 'Next.js', 'Tailwind CSS', 'HTML/CSS'],
  'intermediate', 75000.00, 'NGN',
  NOW() + INTERVAL '14 days', 'open'
),
(
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000004',
  'Design a mobile app UI for our logistics tracker',
  'Create a full UI/UX design for an iOS/Android logistics tracking app. Deliverables include wireframes, high-fidelity Figma screens, and a basic prototype. 15 screens total.',
  ARRAY['Figma', 'UI/UX Design', 'Prototyping', 'Mobile App Development'],
  'intermediate', 120000.00, 'NGN',
  NOW() + INTERVAL '21 days', 'open'
),
(
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000004',
  'Data analysis report on our user retention metrics',
  'Analyse 6 months of user retention data exported from our database (CSV provided). Identify drop-off patterns, produce visualisations, and write a 5-page insights report.',
  ARRAY['Python', 'Pandas', 'Data Analysis', 'Tableau', 'Excel'],
  'beginner', 35000.00, 'NGN',
  NOW() + INTERVAL '10 days', 'open'
),
(
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0000-000000000005',
  'SEO audit and content strategy for our SaaS blog',
  'Complete SEO audit of our existing blog (50 posts), identify top opportunities, and produce a 3-month content calendar with 12 topic ideas and keyword targets.',
  ARRAY['SEO', 'Keyword Research', 'Content Strategy', 'Ahrefs'],
  'intermediate', 95000.00, 'NGN',
  NOW() + INTERVAL '18 days', 'open'
)
ON CONFLICT (id) DO NOTHING;
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEED — COMPLETED PROJECT (full lifecycle example)
// ─────────────────────────────────────────────────────────────────────────────

const COMPLETED_LIFECYCLE = `
-- A completed project showing the full flow: project → application → submission → approval → portfolio + ratings
INSERT INTO projects (id, business_id, title, description, required_skills, skill_level, budget, currency, deadline, status, selected_student) VALUES
(
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000005',
  'Build a full-stack task management web app',
  'Create a simple Kanban-style task manager with user auth, drag-and-drop boards, and a REST API backend.',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  'advanced', 200000.00, 'NGN',
  NOW() - INTERVAL '5 days', 'completed',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Application
INSERT INTO applications (id, project_id, student_id, cover_note, status) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'I have built several similar applications using React, TypeScript and PostgreSQL. I can deliver this in 2 weeks with full test coverage.',
  'accepted'
)
ON CONFLICT (project_id, student_id) DO NOTHING;

-- Submission
INSERT INTO submissions (id, project_id, student_id, file_urls, notes, status, reviewed_at) VALUES
(
  '00000000-0000-0000-0003-000000000001',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000001',
  ARRAY['https://github.com/dev/task-manager', 'https://task-manager-demo.vercel.app'],
  'Completed ahead of schedule. Includes full auth, Kanban boards with drag-and-drop, PostgreSQL backend, and a test suite with 80% coverage.',
  'approved',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- Escrow account
INSERT INTO escrow_accounts (id, project_id, business_id, student_id, amount, currency, gateway, gateway_ref, status, platform_fee, released_at) VALUES
(
  '00000000-0000-0000-0004-000000000001',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  200000.00, 'NGN', 'paystack', 'PAY_TEST_REF_001',
  'released', 24000.00,
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (project_id) DO NOTHING;

-- Payment transactions
INSERT INTO payment_transactions (user_id, escrow_id, type, amount, currency, gateway_ref) VALUES
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0004-000000000001',
  'deposit', 200000.00, 'NGN', 'PAY_TEST_REF_001'
),
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0004-000000000001',
  'release', 176000.00, 'NGN', 'PAY_TEST_REF_002'
),
(
  NULL,
  '00000000-0000-0000-0004-000000000001',
  'fee', 24000.00, 'NGN', NULL
);

-- Ratings
INSERT INTO ratings (project_id, reviewer_id, reviewee_id, reviewer_type, quality, communication, speed, professionalism, comment) VALUES
(
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'business', 5, 5, 5, 5,
  'Ada delivered outstanding work — ahead of schedule, clean code, and great communication throughout. Highly recommended.'
)
ON CONFLICT (project_id, reviewer_id) DO NOTHING;

INSERT INTO ratings (project_id, reviewer_id, reviewee_id, reviewer_type, payment_fairness, clarity, respect, comment) VALUES
(
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  'student', 5, 5, 5,
  'StartupHub are amazing to work with — clear brief, fast escrow deposit, and instant payment on approval.'
)
ON CONFLICT (project_id, reviewer_id) DO NOTHING;

-- Auto-generated portfolio item
INSERT INTO portfolio_items (student_id, project_id, project_title, business_name, description, skills, file_urls, client_rating, client_review, is_public, completed_at) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000005',
  'Full-stack task management web app',
  'StartupHub London',
  'Built a production-grade Kanban task manager with React, TypeScript, Node.js, and PostgreSQL. Features real-time drag-and-drop, JWT auth, and 80% test coverage.',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  ARRAY['https://github.com/dev/task-manager', 'https://task-manager-demo.vercel.app'],
  5.00,
  'Ada delivered outstanding work — ahead of schedule, clean code, and great communication throughout. Highly recommended.',
  TRUE,
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- Chat for the completed project
INSERT INTO chats (id, project_id, student_id, business_id) VALUES
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005'
)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO messages (chat_id, sender_id, content, is_read, sent_at) VALUES
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0000-000000000005',
  'Hi Ada! Really excited to have you on this project. Let me know if you need anything from our side.',
  TRUE, NOW() - INTERVAL '15 days'
),
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Thank you! I will start with the database schema and auth today. Will share a progress update by end of week.',
  TRUE, NOW() - INTERVAL '15 days'
),
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Week 1 done — auth and board CRUD are complete. Here is a quick demo link: https://task-preview.vercel.app',
  TRUE, NOW() - INTERVAL '8 days'
),
(
  '00000000-0000-0000-0005-000000000001',
  '00000000-0000-0000-0000-000000000005',
  'This looks great! Please go ahead and submit the final version.',
  TRUE, NOW() - INTERVAL '6 days'
);

-- Open project applications
INSERT INTO applications (project_id, student_id, cover_note, status) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'I specialise in React/Next.js and have built 3 landing pages for fintech startups. I can start immediately.',
  'pending'
),
(
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'I can handle both the design polish and implementation of this landing page.',
  'pending'
),
(
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'UI/UX is my core strength. I can deliver all 15 screens with an interactive Figma prototype within 2 weeks.',
  'pending'
),
(
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'I am currently studying data science and have done similar retention analysis projects for my university capstone.',
  'pending'
)
ON CONFLICT (project_id, student_id) DO NOTHING;

-- Notification examples
INSERT INTO notifications (user_id, type, title, body, is_read, metadata) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'PAYMENT_RELEASED',
  'Payment Released!',
  'You have received ₦176,000 for "Build a full-stack task management web app". Funds are on their way to your account.',
  TRUE,
  '{"projectId": "00000000-0000-0000-0001-000000000005", "amount": 176000, "currency": "NGN"}'
),
(
  '00000000-0000-0000-0000-000000000001',
  'PROJECT_APPLIED',
  'New application on your project',
  'Carlos Mendez has applied to "Build a responsive landing page for our fintech product".',
  FALSE,
  '{"projectId": "00000000-0000-0000-0001-000000000001", "applicantId": "00000000-0000-0000-0000-000000000002"}'
),
(
  '00000000-0000-0000-0000-000000000003',
  'PROJECT_APPLIED',
  'Application sent!',
  'Your application to "Data analysis report on our user retention metrics" has been submitted.',
  FALSE,
  '{"projectId": "00000000-0000-0000-0001-000000000003"}'
);
`;

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  const client = new Client({ ...DB_CONFIG, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('\n[Main DB] Connected\n');

    console.log('  Dropping existing tables...');
    await client.query(DROP);
    console.log('  ✓ Dropped\n');

    console.log('  Creating schema...');
    await client.query(SCHEMA);
    console.log('  ✓ users, otp_tokens, refresh_tokens');
    console.log('  ✓ student_profiles, business_profiles, user_verifications');
    console.log('  ✓ skill_categories, skill_assessments, assessment_sessions');
    console.log('  ✓ projects, applications, submissions');
    console.log('  ✓ portfolio_items');
    console.log('  ✓ escrow_accounts, milestones, payment_transactions');
    console.log('  ✓ ratings, notifications, disputes');
    console.log('  ✓ chats, messages');

    console.log('\n  Seeding skill categories...');
    await client.query(SKILL_CATEGORIES);
    console.log('  ✓ 8 parent categories + sub-categories');

    console.log('\n  Seeding test users...');
    await client.query(TEST_USERS);
    console.log('  ✓ 3 students, 2 businesses');

    console.log('\n  Seeding open projects...');
    await client.query(TEST_PROJECTS);
    console.log('  ✓ 4 open projects');

    console.log('\n  Seeding completed project lifecycle...');
    await client.query(COMPLETED_LIFECYCLE);
    console.log('  ✓ Completed project with escrow, payments, ratings, portfolio, chat');

    console.log('\n[Main DB] Done.\n');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('[Main DB] Error:', err.message);
  process.exit(1);
});
