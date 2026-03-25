# Database Schema — Supabase (PostgreSQL)

All services share one Supabase project. Each service accesses only its relevant tables. Row Level Security (RLS) is enabled on all tables.

---

## Tables

### `users`
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  account_type    TEXT NOT NULL CHECK (account_type IN ('student', 'business')),
  full_name       TEXT,
  avatar_url      TEXT,
  country         TEXT,
  email_verified  BOOLEAN DEFAULT FALSE,
  phone_verified  BOOLEAN DEFAULT FALSE,
  is_verified     BOOLEAN DEFAULT FALSE,    -- full verification complete
  verified_badge  TEXT,                     -- 'verified_talent' | 'verified_business'
  is_active       BOOLEAN DEFAULT TRUE,
  is_flagged      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `otp_tokens`
```sql
CREATE TABLE otp_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  otp_hash    TEXT NOT NULL,       -- bcrypt hash of the 6-digit OTP
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-delete expired tokens via pg_cron or Supabase Edge Function
```

### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `student_profiles`
```sql
CREATE TABLE student_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio             TEXT,
  university      TEXT,
  graduation_year INT,
  skills          TEXT[],
  skill_level     TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  total_earnings  DECIMAL(12,2) DEFAULT 0,
  average_rating  DECIMAL(3,2),
  portfolio_url   TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `business_profiles`
```sql
CREATE TABLE business_profiles (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name         TEXT NOT NULL,
  website              TEXT,
  industry             TEXT,
  country              TEXT,
  description          TEXT,
  total_projects_posted INT DEFAULT 0,
  average_rating       DECIMAL(3,2),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_verifications`
```sql
CREATE TABLE user_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,   -- 'phone', 'id_document', 'face', 'business_doc'
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_url    TEXT,            -- Cloudinary URL
  admin_note      TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);
```

### `projects`
```sql
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  required_skills  TEXT[],
  skill_level      TEXT NOT NULL,
  budget           DECIMAL(12,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'USD',
  deadline         TIMESTAMPTZ NOT NULL,
  status           TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'under_review', 'completed', 'disputed', 'cancelled')),
  selected_student UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### `applications`
```sql
CREATE TABLE applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  cover_note   TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  applied_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, student_id)
);
```

### `submissions`
```sql
CREATE TABLE submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  student_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  file_urls     TEXT[],
  notes         TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested')),
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);
```

### `skill_categories`
```sql
CREATE TABLE skill_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  parent_category TEXT,
  skills          TEXT[]
);
```

### `skill_assessments`
```sql
CREATE TABLE skill_assessments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  level        TEXT NOT NULL,
  score        INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, category)
);
```

### `assessment_sessions`
```sql
CREATE TABLE assessment_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  questions   JSONB NOT NULL,   -- array of question objects
  answers     JSONB,            -- submitted answers
  status      TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'expired')),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL   -- 1 hour from start
);
```

### `portfolio_items`
```sql
CREATE TABLE portfolio_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description   TEXT,
  skills        TEXT[],
  file_urls     TEXT[],
  client_rating DECIMAL(3,2),
  client_review TEXT,
  is_public     BOOLEAN DEFAULT TRUE,
  completed_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `escrow_accounts`
```sql
CREATE TABLE escrow_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  business_id  UUID REFERENCES users(id),
  student_id   UUID REFERENCES users(id),
  amount       DECIMAL(12,2) NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'USD',
  gateway      TEXT NOT NULL,   -- 'stripe' | 'flutterwave' | 'paypal' | 'paystack'
  gateway_ref  TEXT,            -- external payment reference
  status       TEXT DEFAULT 'held' CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  platform_fee DECIMAL(12,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  released_at  TIMESTAMPTZ
);
```

### `milestones`
```sql
CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id   UUID REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  percentage  INT,
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'released')),
  released_at TIMESTAMPTZ
);
```

### `payment_transactions`
```sql
CREATE TABLE payment_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  escrow_id   UUID REFERENCES escrow_accounts(id),
  type        TEXT NOT NULL,   -- 'deposit' | 'release' | 'refund' | 'fee'
  amount      DECIMAL(12,2) NOT NULL,
  currency    TEXT NOT NULL,
  gateway_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `notifications`
```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
```

### `ratings`
```sql
CREATE TABLE ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id      UUID REFERENCES users(id),
  reviewee_id      UUID REFERENCES users(id),
  reviewer_type    TEXT NOT NULL CHECK (reviewer_type IN ('student', 'business')),
  -- Business rating a student
  quality          INT CHECK (quality BETWEEN 1 AND 5),
  communication    INT CHECK (communication BETWEEN 1 AND 5),
  speed            INT CHECK (speed BETWEEN 1 AND 5),
  professionalism  INT CHECK (professionalism BETWEEN 1 AND 5),
  -- Student rating a business
  payment_fairness INT CHECK (payment_fairness BETWEEN 1 AND 5),
  clarity          INT CHECK (clarity BETWEEN 1 AND 5),
  respect          INT CHECK (respect BETWEEN 1 AND 5),
  comment          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id)
);
```

### `disputes`
```sql
CREATE TABLE disputes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  raised_by    UUID REFERENCES users(id),
  reason       TEXT NOT NULL,
  evidence     TEXT[],
  status       TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved')),
  resolution   TEXT CHECK (resolution IN ('release_to_student', 'refund_to_business', 'split', NULL)),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);
```

### `chats`
```sql
CREATE TABLE chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  student_id  UUID REFERENCES users(id),
  business_id UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `messages`
```sql
CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id          UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES users(id),
  content          TEXT,
  attachment_urls  TEXT[],
  is_read          BOOLEAN DEFAULT FALSE,
  sent_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_chat ON messages(chat_id, sent_at DESC);
```

---

## Row Level Security (RLS) — Key Policies

```sql
-- Users can read their own data
CREATE POLICY "users_own_read" ON users
  FOR SELECT USING (auth.uid() = id);

-- Students can only see their own portfolio items
CREATE POLICY "portfolio_own" ON portfolio_items
  FOR ALL USING (student_id = auth.uid());

-- Public portfolio items visible to all
CREATE POLICY "portfolio_public_read" ON portfolio_items
  FOR SELECT USING (is_public = TRUE);

-- Only project participants can read messages
CREATE POLICY "chat_participants" ON messages
  FOR SELECT USING (
    chat_id IN (
      SELECT id FROM chats
      WHERE student_id = auth.uid() OR business_id = auth.uid()
    )
  );
```

---

## Indexes (Performance)

```sql
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_skills ON projects USING GIN(required_skills);
CREATE INDEX idx_applications_project ON applications(project_id, status);
CREATE INDEX idx_portfolio_student ON portfolio_items(student_id);
CREATE INDEX idx_ratings_reviewee ON ratings(reviewee_id);
```
