# Microservices — Breakdown & Responsibilities

Each service is a standalone Node.js (or Python) app with its own Apollo Subgraph server, its own `.env`, and scoped access to Supabase.

---

## 1. User Service

**Port:** 4001
**Responsibility:** User profiles, onboarding, verification, badges

### Key GraphQL Operations
```graphql
type User @key(fields: "id") {
  id: ID!
  email: String!
  accountType: AccountType!
  fullName: String
  avatarUrl: String
  isVerified: Boolean!
  verifiedBadge: BadgeType
  country: String
  createdAt: String
}

# Student-specific
type StudentProfile {
  userId: ID!
  bio: String
  skills: [String]
  skillLevel: SkillLevel
  university: String
  portfolioUrl: String
  totalEarnings: Float
  averageRating: Float
}

# Business-specific
type BusinessProfile {
  userId: ID!
  companyName: String!
  website: String
  industry: String
  country: String
  totalProjectsPosted: Int
  averageRating: Float
}

type Query {
  me: User
  userProfile(userId: ID!): User
}

type Mutation {
  updateProfile(input: UpdateProfileInput!): User
  uploadAvatar(file: Upload!): String       # Cloudinary URL
  submitVerification(input: VerificationInput!): VerificationStatus
}
```

### Verification Logic
- Students: email (done at auth) → phone OTP → ID document upload (Cloudinary) → face match
- Businesses: email → phone OTP → company details → document upload
- Verification status stored in `user_verifications` table
- On full verification: set `verified_badge` on user record

---

## 2. Project Service

**Port:** 4002
**Responsibility:** Project marketplace — posting, browsing, applying, submitting work

### Key GraphQL Operations
```graphql
type Project @key(fields: "id") {
  id: ID!
  businessId: ID!
  title: String!
  description: String!
  requiredSkills: [String!]!
  skillLevel: SkillLevel!
  budget: Float!
  currency: String!
  deadline: String!
  status: ProjectStatus!
  applicantsCount: Int
  createdAt: String
}

type Application {
  id: ID!
  projectId: ID!
  studentId: ID!
  coverNote: String
  status: ApplicationStatus!
  appliedAt: String
}

type Submission {
  id: ID!
  projectId: ID!
  studentId: ID!
  fileUrls: [String!]!   # Cloudinary URLs
  notes: String
  submittedAt: String
  status: SubmissionStatus!
}

type Query {
  projects(filter: ProjectFilter, page: Int, limit: Int): ProjectConnection!
  project(id: ID!): Project
  myApplications: [Application!]
  projectApplications(projectId: ID!): [Application!]  # Business only
}

type Mutation {
  postProject(input: PostProjectInput!): Project
  applyToProject(projectId: ID!, coverNote: String): Application
  selectApplicant(applicationId: ID!): Application      # Business only
  submitWork(projectId: ID!, files: [Upload!]!, notes: String): Submission
  approveSubmission(submissionId: ID!): Submission      # Business only → triggers payment release
  requestRevision(submissionId: ID!, feedback: String!): Submission
}
```

### Project Status Flow
```
OPEN → IN_PROGRESS → UNDER_REVIEW → COMPLETED | DISPUTED
```

---

## 3. Skills Service

**Port:** 4003
**Responsibility:** Skill categories, assessments, AI-powered project matching

### Key GraphQL Operations
```graphql
type SkillCategory {
  id: ID!
  name: String!
  parentCategory: String
  skills: [String!]!
}

type SkillAssessment {
  id: ID!
  studentId: ID!
  category: String!
  level: SkillLevel!
  score: Int
  completedAt: String
}

type Query {
  skillCategories: [SkillCategory!]!
  myAssessment(category: String!): SkillAssessment
  suggestedProjects(studentId: ID!): [Project!]  # Cross-service via federation
}

type Mutation {
  startAssessment(category: String!): AssessmentSession
  submitAssessment(sessionId: ID!, answers: [AnswerInput!]!): SkillAssessment
  updateSkills(skills: [String!]!): StudentProfile
}
```

### Skill Levels
- Beginner, Intermediate, Advanced, Expert
- Phase 1: static quiz-based assessment
- Phase 2: AI-evaluated assessments

---

## 4. Portfolio Service

**Port:** 4004
**Responsibility:** Auto-generate and display verified portfolios from completed projects

### Key GraphQL Operations
```graphql
type PortfolioItem {
  id: ID!
  studentId: ID!
  projectId: ID!
  projectTitle: String!
  businessName: String!
  description: String
  skills: [String!]!
  fileUrls: [String!]!
  clientRating: Float
  clientReview: String
  completedAt: String
  isPublic: Boolean!
}

type Portfolio {
  studentId: ID!
  items: [PortfolioItem!]!
  totalProjects: Int!
  averageRating: Float!
  topSkills: [String!]!
}

type Query {
  myPortfolio: Portfolio
  studentPortfolio(studentId: ID!): Portfolio   # Public view
}

type Mutation {
  togglePortfolioItemVisibility(itemId: ID!, isPublic: Boolean!): PortfolioItem
}
```

### Auto-Generation
- Triggered automatically when a submission is approved (event from Project Service)
- Pulls project data, submission files, and client review into a `portfolio_items` record
- No manual upload needed — fully automated

---

## 5. Payment Service

**Port:** 4005
**Responsibility:** Escrow management, payment releases, milestone payments, multi-currency

### Key GraphQL Operations
```graphql
type EscrowAccount {
  id: ID!
  projectId: ID!
  businessId: ID!
  studentId: ID!
  amount: Float!
  currency: String!
  status: EscrowStatus!
  milestones: [Milestone]
  createdAt: String
}

type Milestone {
  id: ID!
  escrowId: ID!
  label: String!
  amount: Float!
  status: MilestoneStatus!
  releasedAt: String
}

type Query {
  myEscrowAccounts: [EscrowAccount!]
  projectEscrow(projectId: ID!): EscrowAccount
  paymentHistory: [PaymentTransaction!]
}

type Mutation {
  depositEscrow(projectId: ID!, amount: Float!, currency: String!, gateway: PaymentGateway!): EscrowAccount
  releasePayment(escrowId: ID!): EscrowAccount
  releaseMilestone(milestoneId: ID!): Milestone
  initiateRefund(escrowId: ID!, reason: String!): RefundRequest   # Dispute path
}
```

### Escrow Flow
1. Business calls `depositEscrow` → payment processed via **Stripe** (USD/EUR/GBP)
2. Funds held in escrow record (`status: HELD`)
3. On submission approval → `releasePayment` called → student receives funds (`status: RELEASED`)
4. Platform fee (10–15%) deducted automatically at release
5. Disputes freeze the escrow (`status: DISPUTED`) until admin resolves

### Supported Currencies
- USD, EUR, GBP via Stripe

> NGN and other African currencies are handled by the dedicated **Paystack Service** (see below).

---

## 5b. Paystack Service

**Port:** 4010
**Responsibility:** Paystack-specific escrow management, payment initiation, verification, and releases for NGN and African currencies

### Key GraphQL Operations
```graphql
type PaystackEscrow {
  id: ID!
  projectId: ID!
  businessId: ID!
  studentId: ID!
  amount: Float!
  currency: String!        # NGN, GHS, ZAR, KES, etc.
  paystackRef: String!     # Paystack payment reference
  paystackTransferId: String  # Recipient transfer ID for payout
  status: EscrowStatus!
  createdAt: String
  releasedAt: String
}

type PaystackRecipient {
  id: ID!
  userId: ID!
  recipientCode: String!   # Paystack transfer recipient code
  bankName: String!
  accountNumber: String!
  accountName: String!
  currency: String!
  createdAt: String
}

type Query {
  myPaystackEscrows: [PaystackEscrow!]!
  projectPaystackEscrow(projectId: ID!): PaystackEscrow
  myPaystackRecipient: PaystackRecipient
}

type Mutation {
  initializePaystackDeposit(projectId: ID!, amount: Float!, currency: String!): PaystackInitResponse
  # Called via webhook after Paystack confirms payment
  verifyPaystackDeposit(reference: String!): PaystackEscrow

  registerPayoutRecipient(input: RecipientInput!): PaystackRecipient
  releasePaystackPayment(escrowId: ID!): PaystackEscrow
}
```

### Paystack Escrow Flow
1. Business calls `initializePaystackDeposit` → returns a Paystack payment link/authorization URL
2. Business completes payment on Paystack checkout
3. Paystack sends webhook to `POST /webhooks/paystack` → service verifies and sets escrow to `HELD`
4. On submission approval → `releasePaystackPayment` → service initiates a Paystack Transfer to the student's registered bank account
5. Platform fee deducted before transfer
6. Disputes freeze escrow until admin resolves

### Webhook Endpoint
```
POST /webhooks/paystack
Header: x-paystack-signature (HMAC-SHA512 verified)
```
Events handled:
- `charge.success` → mark escrow as `HELD`
- `transfer.success` → mark escrow as `RELEASED`
- `transfer.failed` → flag escrow, notify admin

### Student Payout Setup
- Student must register a bank account as a Paystack Transfer Recipient before they can receive payouts
- Stored in `paystack_recipients` table with the `recipient_code` from Paystack

---

## 6. Notification Service

**Port:** 4006
**Responsibility:** In-app notifications, deadline reminders, system alerts

### Key GraphQL Operations
```graphql
type Notification {
  id: ID!
  userId: ID!
  type: NotificationType!
  title: String!
  body: String!
  isRead: Boolean!
  metadata: JSON        # e.g., { projectId, applicationId }
  createdAt: String
}

type Query {
  myNotifications(unreadOnly: Boolean): [Notification!]!
  unreadCount: Int!
}

type Mutation {
  markAsRead(notificationId: ID!): Notification
  markAllAsRead: Boolean
}
```

### Notification Types
```
PROJECT_APPLIED, APPLICANT_SELECTED, WORK_SUBMITTED,
SUBMISSION_APPROVED, REVISION_REQUESTED, PAYMENT_RELEASED,
DEADLINE_REMINDER, DISPUTE_OPENED, DISPUTE_RESOLVED,
NEW_RATING, VERIFICATION_APPROVED, VERIFICATION_REJECTED
```

### Delivery
- Stored in Supabase `notifications` table
- Real-time delivery via Socket.IO (main server emits `notification:new` to `user:<userId>` room)
- Deadline reminders triggered by a cron job inside this service (every hour, checks project deadlines)
- When a notification is created, this service also calls the **Email Service** to send the corresponding email (if the user has email alerts enabled)

---

## 6b. Email Service

**Port:** 4011
**Responsibility:** All transactional email delivery — OTP codes, notification emails, payment receipts, verification updates. No GraphQL schema (client-facing queries not needed). Exposed only via internal HTTP endpoints called by other services.

### Why a Separate Service
- Email sending is I/O-heavy and can slow down the calling service if done inline
- A dedicated service allows retry logic, rate limiting, and email provider swapping in one place
- The main server no longer needs email credentials — only the Email Service does
- Any service (auth, notification, payment, admin) can trigger an email without knowing the provider

### Internal HTTP Endpoints
```
POST /internal/send
Header: X-Internal-Secret: <shared_secret>
Body:
{
  "to": "user@example.com",
  "template": "otp | welcome | project_applied | submission_approved | payment_released | dispute_opened | dispute_resolved | deadline_reminder | verification_approved | verification_rejected | payment_receipt",
  "data": { ...template variables }
}
```

### Email Templates

| Template | Trigger | Key Variables |
|---|---|---|
| `otp` | Auth — OTP requested | `otp`, `expiresInMinutes` |
| `welcome` | New user verified | `fullName`, `accountType` |
| `project_applied` | Business: new applicant | `businessName`, `projectTitle`, `studentName` |
| `applicant_selected` | Student: selected for project | `studentName`, `projectTitle`, `businessName` |
| `work_submitted` | Business: student submitted | `businessName`, `projectTitle` |
| `submission_approved` | Student: work approved | `studentName`, `projectTitle`, `amount` |
| `revision_requested` | Student: revision needed | `studentName`, `projectTitle`, `feedback` |
| `payment_released` | Student: funds released | `studentName`, `amount`, `currency` |
| `payment_receipt` | Business: deposit confirmed | `businessName`, `amount`, `currency`, `projectTitle` |
| `dispute_opened` | Both parties | `fullName`, `projectTitle` |
| `dispute_resolved` | Both parties | `fullName`, `resolution`, `adminNote` |
| `deadline_reminder` | Student + Business | `fullName`, `projectTitle`, `hoursLeft` |
| `verification_approved` | User | `fullName` |
| `verification_rejected` | User | `fullName`, `reason` |

### Directory Structure
```
email-service/
├── src/
│   ├── templates/
│   │   ├── otp.ts
│   │   ├── welcome.ts
│   │   ├── project_applied.ts
│   │   └── ... (one file per template)
│   ├── providers/
│   │   └── smtp.ts            # Nodemailer Gmail SMTP transport
│   ├── queue/
│   │   └── emailQueue.ts      # In-memory retry queue (Phase 1)
│   ├── telemetry/             # Standard telemetry module
│   ├── routes/
│   │   └── internal.ts        # POST /internal/send
│   └── index.ts
├── .env
└── package.json
```

### SMTP Setup (Gmail)
```ts
// providers/smtp.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // smtp.gmail.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.MAILING_EMAIL,
    pass: process.env.MAILING_PASSWORD,  // Gmail app password
  },
});
```

### Retry Logic (Phase 1)
- On send failure: retry up to 3 times with exponential backoff (1s, 3s, 9s)
- After 3 failures: log to `email_failures` Supabase table for monitoring
- Phase 2: replace in-memory queue with BullMQ + Redis

---

## 7. Rating Service

**Port:** 4007
**Responsibility:** Reviews, ratings, leaderboards

### Key GraphQL Operations
```graphql
type Rating {
  id: ID!
  projectId: ID!
  reviewerId: ID!
  revieweeId: ID!
  reviewerType: AccountType!
  quality: Int          # 1-5 (student ratings)
  communication: Int
  speed: Int
  professionalism: Int
  paymentFairness: Int  # business ratings
  clarity: Int
  respect: Int
  comment: String
  createdAt: String
}

type LeaderboardEntry {
  rank: Int!
  studentId: ID!
  fullName: String!
  avatarUrl: String
  averageRating: Float!
  totalProjects: Int!
  topSkill: String
  country: String
}

type Query {
  userRatings(userId: ID!): [Rating!]!
  averageRating(userId: ID!): Float
  leaderboard(category: String, country: String, limit: Int): [LeaderboardEntry!]!
}

type Mutation {
  submitRating(projectId: ID!, input: RatingInput!): Rating
}
```

### Rules
- Both parties can only rate after project `COMPLETED`
- One rating per user per project
- Ratings are immutable after submission

---

## 8. Dispute Service

**Port:** 4008
**Responsibility:** Dispute raising, evidence submission, admin resolution

### Key GraphQL Operations
```graphql
type Dispute {
  id: ID!
  projectId: ID!
  raisedBy: ID!
  reason: String!
  evidence: [String!]   # Cloudinary URLs
  status: DisputeStatus!
  adminNote: String
  resolution: DisputeResolution
  createdAt: String
  resolvedAt: String
}

type Query {
  myDisputes: [Dispute!]!
  dispute(id: ID!): Dispute
}

type Mutation {
  raiseDispute(projectId: ID!, reason: String!, evidence: [Upload!]): Dispute
  addEvidence(disputeId: ID!, files: [Upload!]!): Dispute
}
```

### Dispute Flow
1. Student or Business raises dispute on a project
2. Escrow frozen by Payment Service (event-driven)
3. Both parties can submit evidence
4. Admin (Python service) reviews and resolves
5. Resolution: release to student, refund to business, or split

---

## 9. Chat Service

**Port:** 4009
**Responsibility:** Project-scoped messaging between student and business

### Key GraphQL Operations
```graphql
type Message {
  id: ID!
  chatId: ID!
  senderId: ID!
  content: String
  attachmentUrls: [String]   # Cloudinary
  sentAt: String
  isRead: Boolean!
}

type Chat {
  id: ID!
  projectId: ID!
  studentId: ID!
  businessId: ID!
  messages(limit: Int, before: String): [Message!]!
  lastMessage: Message
}

type Query {
  projectChat(projectId: ID!): Chat
  myChats: [Chat!]!
}

type Mutation {
  sendMessage(chatId: ID!, content: String, attachment: Upload): Message
  markMessagesRead(chatId: ID!): Boolean
}
```

### Real-time
- Messages stored in Supabase, also emitted via Socket.IO
- Typing indicators sent directly over Socket.IO (not persisted)
- Rooms: `chat:<chatId>`
