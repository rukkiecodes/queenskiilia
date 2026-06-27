# QueenSkiilia — Web App Test Checklist

> Database was cleared on 2026-06-24 (all user/transactional data removed; `skill_categories` + `waitlist` kept). Start fresh: sign up as a **talent** account and a **business** account (use two emails / browsers) so you can test both sides.
>
> **2026-06-25:** Core end-to-end happy path verified ✅ — sign up → login → post gig → talent sees listing → apply → select talent → submit work (with live URL) → request revision → approve → release escrow → talent sees completed job. Remaining items below are edge cases, payouts, and secondary features.

How to use: go top to bottom. Check a box when it works. When one **fails**, stop and we fix it before moving on. Add notes inline after any item (e.g. `— shows 500 on submit`).

---

## 1. Onboarding & Auth
- [x] `/onboarding` redirects to role selection (account-type)
- [x] Role selection: pick **I'm talent** → Continue
- [x] Email step: enter email → "Send code"
- [x] OTP email actually arrives
- [x] Verify step: enter the 6-digit code → proceeds
- [ ] Wrong/expired code shows an error (doesn't crash)
- [ ] Resend code works (countdown, then re-sends)
- [x] Profile setup: fill name/bio/skills + avatar upload → Continue
- [x] Avatar image upload succeeds (no 413 / "cloudinary not configured")
- [x] Lands on `/dashboard` after profile completion
- [x] Repeat the whole flow for a **business** account
- [ ] Log out (user menu) returns to a logged-out state
- [x] Log back in with the same email (existing user → straight to dashboard, no profile step)
- [ ] Visiting a protected page while logged out → redirected to `/login` (and back after login)

## 2. Navigation & Layout
- [x] Navbar spans full width; brand left, bell + avatar right
- [x] Sidebar shows the correct links for the role (talent vs business)
- [x] Active link is highlighted for the current page
- [x] Clicking sidebar links navigates without bouncing to onboarding
- [x] Main content area is white; navbar/sidebar use the grey frame colour _(flipped per design)_
- [ ] Mobile (narrow window): sidebar collapses; burger opens/closes the drawer
- [ ] Drawer closes after navigating on mobile

## 3. Dashboard
- [x] Talent dashboard loads (stats, earnings, empty states where no data)
- [x] Business dashboard loads
- [x] Empty states read correctly (no fake numbers from old seed data)

## 4. Projects
- [x] Business: create a project (title, description, budget, skills, etc.) → saves
- [x] Project appears in the browse/list
- [x] Project detail page opens and shows the right info
- [x] Talent: browse projects, open a detail page
- [x] Talent: apply to a project → application submitted
- [ ] Can't apply twice to the same project
- [x] Business: see applicants on the project
- [x] Business: accept/assign an applicant

## 5. Work Submission & Review
- [x] Talent: submit work on an assigned project (live URL required)
- [x] Business: see the submission
- [x] Business: approve the submission
- [x] Business: request changes / reject (revision flow)
- [x] Talent: completed job shows in their work list

## 6. Payments & Escrow
- [x] Business: fund escrow for a project
- [x] Escrow shows as "held"
- [x] Business: release funds on approval
- [x] Escrow shows as "released"
- [ ] Payment/transaction history reflects the activity
- [ ] Talent: set up payout account (bank + Paystack subaccount) in Settings → Payouts
- [ ] Bank account number resolves to an account name
- [ ] Released funds reflect in talent earnings

## 7. Ratings, Disputes, Reports
- [ ] Rate a completed project (talent ↔ business)
- [ ] Rating appears on the profile
- [ ] Open a dispute on a project
- [ ] Dispute shows in the disputes list ("No disputes" when empty)
- [ ] Report a user/project (report button) → submits

## 8. Skill Tests
- [ ] Skill tests page lists available tests (uses `skill_categories`)
- [ ] Start a test / assessment session
- [ ] Complete a test and see the result/score
- [ ] Passing updates the talent profile (verified skill)

## 9. Portfolio
- [ ] Talent: add a portfolio item (with image)
- [ ] Portfolio item appears on the talent profile
- [ ] Edit / delete a portfolio item

## 10. Chat / Messaging
- [ ] Open chat from a project/applicant
- [ ] Send a message → appears
- [ ] Other party receives it (second browser)
- [ ] Empty state when no chats

## 11. Notifications
- [ ] Notification bell shows count when there's activity
- [ ] Notifications list opens and shows items ("No notifications" when empty)
- [ ] Clicking a notification navigates to the relevant page

## 12. Talent Directory & Profiles
- [ ] Business: `/talent` directory lists talents
- [ ] Open a public talent profile `/talent/:id`
- [ ] Profile shows skills, portfolio, ratings
- [ ] Edit own profile (Settings/Profile) → changes persist

## 13. Leaderboard & Earnings
- [ ] Leaderboard page loads (empty/sparse with fresh data is OK)
- [ ] Earnings page loads for talent

## 14. Settings & Account
- [ ] Settings hub lists sections (Profile, Notifications, Payouts, About, Help, Delete account)
- [ ] Notification preferences toggle and persist
- [ ] About / Help pages load
- [ ] Delete account flow works (and actually removes the account)

## 15. Visual / Polish
- [x] Fonts render as Poppins (not serif) everywhere _(incl. dialogs — fixed in fusionui 0.7.5)_
- [x] No duplicated/overlapping navbars or sidebars
- [ ] Onboarding split layout looks right on desktop; collapses on mobile
- [ ] No console errors on the main pages

---

### Notes / Bugs found
_(jot issues here as you go — we'll take them one at a time)_

- ✅ **2026-06-25:** Full core loop confirmed working end-to-end (auth → post → apply → select → submit → revision → approve → release → completed).
- Fixed along the way: project duration model, employer on gig cards, Type-9 job cards, landing gig listings, apply→signup gate, client sub-profile detail page, dialog font, browser-alerts → dialogs, talent "active work" section, live-URL-required submission, status labels, workspace redesign, submissions status constraint.
1.
2.
3.
