# All Screens — Layout, Purpose, Components Used

---

## AUTH SCREENS

### 1. Splash Screen (`app/(auth)/index.tsx`)
- QueenSkiilia logo centered with gold glow animation
- Dark background fade-in
- Auto-redirects after 2s (after hydration check)
- No user interaction

### 2. Onboarding Screen (`app/(auth)/onboarding.tsx`)
- 3-slide horizontal carousel (Reanimated FlatList)
- Slide 1: "Prove Your Skills" — skill test illustration
- Slide 2: "Work on Real Projects" — marketplace illustration
- Slide 3: "Build Your Portfolio" — portfolio illustration
- Dot pagination indicator (gold active dot)
- "Get Started" CTA button (primary) → account-type
- "Skip" top-right link for returning users

### 3. Account Type Screen (`app/(auth)/account-type.tsx`)
- Heading: "I am a..."
- Two large selection cards:
  - Student card: graduation cap icon, description
  - Business card: briefcase icon, description
- Selected card: gold border + glow shadow
- "Continue" button (disabled until selection made)

### 4. Email Screen (`app/(auth)/email.tsx`)
- "Enter your email" heading
- Email TextInput with keyboard type email
- Inline validation (red border + message)
- "Send OTP" primary button
- Loading spinner during API call
- Shows accountType selection above (editable — back button)

### 5. OTP Screen (`app/(auth)/otp.tsx`)
- "We sent a code to {email}"
- 6 OTP input boxes (auto-advance)
- 10-min countdown timer
- "Resend OTP" (60s cooldown → then active)
- "Verify" button (active once 6 digits entered)
- Shake animation on error
- "Wrong email? Go back" link

### 6. Profile Setup Screen (`app/(auth)/profile-setup.tsx`)
- Full name input (required)
- Avatar picker (optional — Cloudinary upload)
- Country picker (dropdown)
- **Student extras:** bio, university, graduation year
- **Business extras:** company name, website, industry
- "Complete Profile" button
- Skip option (can complete later from settings)

---

## STUDENT SCREENS

### 7. Student Dashboard (`app/(student)/dashboard.tsx`)
- Header: avatar + name + verified badge + notification bell
- Stats row: skill level badge, active projects, total earnings, avg rating
- "Complete Your Profile" banner (if incomplete)
- "Take Skill Test" banner (if no assessment)
- Section: Available Projects (filtered by skill level, 5 cards)
- Section: My Active Projects (in-progress, max 3)
- Section: Notifications preview (unread count badge)
- Bottom tab bar

### 8. Project Marketplace (`app/(student)/projects/index.tsx`)
- Search bar (debounced)
- Filter chips: All, My Skill Level, Budget Range, Deadline
- Sort by: Latest, Budget (high-low), Deadline
- FlatList of ProjectCards
- Pull-to-refresh
- Infinite scroll (pagination)
- Empty state illustration

### 9. Project Detail — Student View (`app/(student)/projects/[id].tsx`)
- Business name + avatar + verified badge
- Project title, description
- Required skills (badge chips)
- Skill level required, budget, deadline countdown
- "Apply" button (disabled if already applied)
- "Application Pending" chip if applied
- Chat section (visible if selected as student)

### 10. Application Form (`app/(student)/projects/apply.tsx`)
- Project summary card at top
- Cover note textarea
- "Submit Application" button
- Confirmation sheet on submit

### 11. Active Project — Submission (`app/(student)/projects/[id].tsx` — selected state)
- Project brief recap
- Submission status (pending / revision_requested / approved)
- Upload work: file picker (PDF, images, zip)
- Notes field
- Chat with business button
- Deadline countdown (warning color at < 24h)

### 12. Skill Test Index (`app/(student)/skill-test/index.tsx`)
- My assessments list (category, level achieved, score, date)
- "Start New Assessment" button
- Category selector grid (Technology, Design, Marketing, etc.)
- Level selector (Beginner → Expert)

### 13. Skill Test Session (`app/(student)/skill-test/session.tsx`)
- Question index / total (e.g. "Question 3 of 10")
- Progress bar
- Question text
- 4 option radio buttons
- Timer (1 hour total)
- "Next" / "Submit" button
- Cannot go back once answered
- Results screen: score, level awarded, skill badge animation

### 14. Portfolio (`app/(student)/portfolio.tsx`)
- Grid or list toggle
- PortfolioItemCard: project title, business, skills, rating, date
- Tap to expand full detail
- Public/Private toggle per item
- Share portfolio link button

### 15. Leaderboard (`app/(student)/leaderboard.tsx`)
- Global ranking list
- Filter by: Category, Country
- My rank highlighted (sticky at bottom if not in top 10)
- Top 3 have gold/silver/bronze badges
- Avatar, name, skill level, rating per row

### 16. Earnings (`app/(student)/earnings.tsx`)
- Total earnings (large display)
- Held in escrow amount
- Transaction history list (date, project, amount, status)
- Withdrawal button (future)
- Currency display

---

## BUSINESS SCREENS

### 17. Business Dashboard (`app/(business)/dashboard.tsx`)
- Header: company name + verified badge + notification bell
- Stats: posted projects, active projects, total spent, top rated talent
- "Post a Project" CTA (gold button)
- Section: Active Projects (with applicant counts)
- Section: Talent Suggestions (AI-matched to past projects)

### 18. Create Project (`app/(business)/projects/create.tsx`)
- Title input
- Description (rich textarea)
- Required skills (tag input — add/remove chips)
- Skill level dropdown (beginner/intermediate/advanced/expert)
- Budget input + currency picker
- Deadline date picker
- Preview → Confirm → Post
- Validation on all fields (Zod)

### 19. My Projects (`app/(business)/projects/index.tsx`)
- Filter tabs: All, Open, In Progress, Completed
- ProjectCard (business view): title, applicant count, status, deadline
- Swipe to cancel (open projects only)

### 20. Project Applicants (`app/(business)/projects/applicants/[id].tsx`)
- Project summary at top
- List of applicants: avatar, name, skill level, rating, cover note
- Tap to view full profile
- "Select" button per applicant
- Confirm selection sheet → triggers escrow deposit prompt

### 21. Talent Search (`app/(business)/talent.tsx`)
- Search by skill, name
- Filter: skill level, category, country, rating min
- UserCard: avatar, name, skills, level, rating, verified badge
- Tap → view student portfolio

### 22. Payments & Escrow (`app/(business)/payments.tsx`)
- Active escrow accounts: project, amount, status
- "Deposit" button (initiates Paystack payment)
- "Release Funds" button (project completed)
- "Dispute" button (problem with submission)
- Transaction history

---

## SHARED SCREENS

### 23. Chat List (`app/(shared)/chat/index.tsx`)
- List of active project chats
- Last message preview + timestamp
- Unread count badge per chat
- Sorted by latest message

### 24. Chat Room (`app/(shared)/chat/[id].tsx`)
- Project name in header
- Bubble messages (sent/received)
- Attachment support (images, files)
- Real-time via Socket.IO
- Message read indicators
- Typing indicator
- Attachment picker button

### 25. Notifications (`app/(shared)/notifications.tsx`)
- List of notifications (newest first)
- Unread indicator (gold dot)
- Type icons: project update, payment, message, system
- Tap → navigate to relevant screen
- "Mark all read" button
- Pull-to-refresh

### 26. Settings (`app/(shared)/settings.tsx`)
- Profile section: avatar, name, email (non-editable)
- Account type badge
- Sections: Notifications, Security, Language, Appearance, Help, About
- Logout button (red, at bottom)
- App version footer

### 27. Verification (`app/(shared)/verification.tsx`)
- Verification steps tracker (progress stepper)
- Step 1: Email ✓ (always done after OTP)
- Step 2: Phone (SMS OTP — future)
- Step 3: ID Document (upload via camera/gallery → Cloudinary)
- Step 4 Student: Face Match
- Step 4 Business: Business Document upload
- Status per step: pending / approved / rejected + admin note

### 28. Rate & Review (`app/(shared)/ratings/[projectId].tsx`)
- Project summary
- **Business rating student:** Quality, Communication, Speed, Professionalism (1–5 stars each)
- **Student rating business:** Payment Fairness, Clarity, Communication, Respect (1–5 stars each)
- Comment textarea
- Submit button

### 29. Dispute (`app/(shared)/dispute/[projectId].tsx`)
- Project info card
- Reason textarea (required)
- Evidence upload (files/images)
- Existing dispute status (if already raised)
- Admin decision display (resolution + admin note)
