# 16 — Launch Prep & Google Play Compliance

**Goal:** Ship to Google Play (and optionally App Store). Cover all legal, store assets, EAS builds, and the compliance checklist from `mobile development plan/07-google-play-compliance.md`.

**Depends on:** all preceding features. EAS init must be complete (see `project_queenskilla_ota_updates.md` memory).

---

## Batches

### Batch 16.1 — Legal + privacy assets (2–3h)
- [ ] Write Privacy Policy (covers all data types in `mobile development plan/07-google-play-compliance.md` §2)
- [ ] Write Terms of Service (escrow disclaimer, content rules, user conduct)
- [ ] Host both on a public URL (Vercel project or static page on main-server)
- [ ] Update settings screen URLs
- [ ] Memory: add `project_queenskilla_legal_assets.md` with the URLs

### Batch 16.2 — Store listing assets (2h)
- [ ] App icon: 512×512 PNG (no alpha)
- [ ] Feature graphic: 1024×500 JPG/PNG
- [ ] 4–8 screenshots per device type (phone + tablet) — show real screens, no fabricated mockups
- [ ] Short description: ≤80 chars
- [ ] Full description: ≤4000 chars (no exaggerated claims like "#1 platform")
- [ ] Promotional video (30s–2min) — optional but boosts conversion

### Batch 16.3 — Compliance audit (1–2h)
Walk through each section of `mobile development plan/07-google-play-compliance.md` and tick:
- [ ] §1 Misrepresentation — name, icon, description honest
- [ ] §2 Data Safety form completed in Play Console with all data types declared
- [ ] §3 Financial disclaimer ("Not a bank, escrow via Paystack") visible on payment screens
- [ ] §4 Verified badge only shows for admin-approved users
- [ ] §5 Minimum functionality at launch (auth, marketplace, dashboard, profile, settings all functional)
- [ ] §6 Rating prompts only after project completion; no incentivized reviews
- [ ] §7 Permissions: only CAMERA, READ_EXTERNAL_STORAGE, NOTIFICATIONS, INTERNET, VIBRATE requested
- [ ] §8 Content moderation hooks live (report button on projects + profiles)
- [ ] §9 Target audience set to 13+ (Teen)
- [ ] §10 IARC content rating questionnaire completed

### Batch 16.4 — Build + internal testing (2h)
- [ ] `eas build --profile production --platform android` (after `eas init`)
- [ ] Download AAB from EAS dashboard
- [ ] Create app in Google Play Console
- [ ] Upload to Internal Testing track
- [ ] Add test users (10+) and verify install + signup flow
- **Done when:** test users complete full project lifecycle end-to-end.

### Batch 16.5 — Closed → Open → Production rollout (over weeks)
- [ ] Promote Internal → Closed Testing (50–100 testers)
- [ ] Promote Closed → Open Testing (public opt-in)
- [ ] Monitor Play Console crash reports + ANRs daily
- [ ] Promote Open → Production with staged rollout (5% → 20% → 50% → 100%)
- **Done when:** app is live on Play Store at 100% rollout with no critical issues.

### Batch 16.6 — Post-launch OTA workflow (ongoing)
- [ ] Verify `npm run update:production` works for hot-fix JS-only changes
- [ ] Document the rule: native module additions / app.json plugin changes require full build, not OTA
- [ ] Memory: ensure `project_queenskilla_ota_updates.md` is current

---

## Acceptance criteria
- [ ] App approved by Google Play review (typically 1–7 days)
- [ ] Privacy Policy URL accessible and complete
- [ ] Data Safety form approved
- [ ] Internal testers complete a project end-to-end without bugs
- [ ] Memory bank fully reflects launch state (URLs, build numbers, current rollout %)
