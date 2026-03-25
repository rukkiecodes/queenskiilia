# Development Phases

## Phase 1 — Core Platform (MVP)

Goal: A working marketplace where students can apply to projects, get paid via escrow, and build a portfolio.

### Services to Build
- [ ] Telemetry module (shared `src/telemetry/` — built once, copied to all services)
- [ ] Email Service (transactional emails via Gmail SMTP — built first, called by Auth and all others)
- [ ] Main Server (Auth + Gateway + Socket.IO + telemetry middleware)
- [ ] User Service
- [ ] Project Service
- [ ] Paystack Service (primary payment gateway — NGN)
- [ ] Portfolio Service (auto-generate on approval)
- [ ] Rating Service (post-project ratings)
- [ ] Notification Service (in-app + real-time, triggers Email Service)
- [ ] Chat Service (project-scoped messaging)
- [ ] Admin Service (dispute resolution, user management)
- [ ] Super Admin Service (telemetry dashboard, system health — reads from Redis)

### Auth
- Passwordless email OTP
- JWT access + refresh tokens
- No 2FA in this phase

### Payment
- Stripe only (USD)
- Simple full-project escrow (no milestones yet)

### Skills
- Manual skill selection from predefined categories
- No AI assessment in this phase

---

## Phase 2 — Verification & Trust Layer

- Full identity verification (ID document + face match via 3rd party API)
- Business verification (document upload + admin review)
- Phone OTP verification (Twilio/Africa's Talking)
- Verified badge system
- 2FA for login
- Captcha on auth endpoints

---

## Phase 3 — AI & Smart Features

- AI skill assessment (quiz-based with AI grading)
- AI-powered project matching (match students to projects by skill level)
- AI mentor suggestions for students
- Fraud detection AI (plagiarism check on submissions)
- AI-generated portfolio descriptions

---

## Phase 4 — Global Expansion

- Multi-currency support (NGN, EUR, GBP, etc.)
- Flutterwave + Paystack integration
- Multi-language support (Spanish, French, Portuguese)
- Currency auto-conversion
- Milestone payments (staged escrow releases)
- Category leaderboards (global + regional)

---

## Build Order (Phase 1)

Start in this sequence to unblock dependencies:

1. **Database schema** — create all Supabase tables
2. **Telemetry module** — write once, copy `src/telemetry/` into every service before building
3. **Email Service** — built before Main Server; Auth calls it for OTP delivery
4. **Main Server** — auth (OTP + JWT) + gateway shell + Socket.IO + telemetry middleware
5. **User Service** — profiles (required by all other services)
6. **Project Service** — core marketplace
7. **Paystack Service** — primary escrow and payout (NGN)
8. **Chat Service** — messaging (needed while project is in progress)
9. **Notification Service** — in-app alerts + triggers Email Service
10. **Rating Service** — post-completion
11. **Portfolio Service** — triggered by project completion
12. **Dispute Service** — edge case handling
13. **Admin Service** — dispute resolution + verification review
14. **Super Admin Service** — telemetry dashboard + service health (built last; depends on all services emitting telemetry)
