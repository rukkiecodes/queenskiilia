# Launch Runbook

End-to-end checklist for taking QueenSkiilia from a clean repo to a live
Google Play listing. The mobile code is feature-complete after Feature 15
plus the compliance work in Feature 16; this document sequences the
remaining operational steps.

Anything wrapped in `[INSERT ...]` is a placeholder you need to fill in
before running the step.

---

## 1. Prerequisites

- Expo / EAS account with write access to the `queenskilla-mobile`
  project (`projectId 3d8d8ca4-b1e6-4e2d-b685-2d80eb3646c6` per `app.json`).
- Google Play Console developer account ($25 one-time).
- A registered Apple developer account ($99/yr) — only if shipping to iOS
  at launch.
- A Google Cloud project + service-account JSON for Play submission via
  EAS (optional; you can also upload AAB by hand).
- A domain and email host for `queenskilla.app` so the Privacy Policy
  URL, support email, and store contact email all resolve.

---

## 2. Pre-flight code audit (already done)

Confirmed in Feature 16:

- `client/mobile/app.json`
  - `version: 1.0.0` (semver). Bump for each store submission.
  - `android.package: com.rukkiecodes2.queenskillamobile`. **Action item:** confirm this is the package you want on the Play Console — once a listing is created it can't be changed. Consider `com.queenskilla.mobile` for the production identity.
  - `runtimeVersion.policy: "appVersion"` — runtime is pinned to app version, so OTAs only target the matching build.
  - Plugins declare camera + image-picker permission strings consistent with the privacy policy.
  - No rogue permissions (no contacts, location, audio).
- `client/mobile/eas.json`
  - `appVersionSource: "remote"` — EAS owns versionCode. Don't bump locally.
  - `production` profile has `autoIncrement: true` and `channel: "production"`. Builds AAB by default.
  - `submit.production: {}` is empty — needs Play credentials before `eas submit` works (see step 6).
- Reports table + endpoints (`submitReport`, `myReports`) shipped in dispute-service. Apply with `npx tsx database/feature-16-setup.ts` before the listing goes live.

---

## 3. Stand up the legal site (one-off)

The Privacy Policy URL is mandatory for the Play Console listing form.

```bash
cd legal
npx vercel --prod
```

Pick the project name `queenskilla-legal`. After deploy, update
`client/mobile/constants/legal.ts`:

```ts
export const LEGAL_URLS = {
  terms:   'https://queenskilla-legal.vercel.app/terms.html',
  privacy: 'https://queenskilla-legal.vercel.app/privacy.html',
} as const;
```

Commit and rebuild the app so the in-app WebView screens hit the live URLs.

Replace every `[INSERT …]` placeholder in `legal/markdown/*.md` and
`legal/public/*.html` (legal entity name, country, effective date) before
you publish. Have a lawyer review.

---

## 4. Apply DB migrations to live Supabase

```bash
cd database
npx tsx feature-15-setup.ts   # deletion_requested_at + notification_preferences
npx tsx feature-16-setup.ts   # reports table
```

Each script is idempotent. Run from a machine that has the Supabase pool
credentials in `main-server/.env`.

---

## 5. Stale-env redeploys

After any backend schema or env change, each Vercel-hosted subgraph
needs a redeploy to flush its warm-lambda env cache. See
`session_queenskilla_session.md` and
`session_queenskilla_mobile_development.md` for context.

Pending for launch:

- user-service (Feature 15 deleteAccount + Feature 16 nothing new — but
  redeploy if not already done since 15).
- notification-service (Feature 15 preferences resolvers).
- dispute-service (Feature 16 reports resolvers + new table).
- paystack-service (only if switching off the mock-payment path; see
  `session_queenskilla_mobile_development.md`).

---

## 6. EAS init + first build

If `eas init` has never been run on this machine, do it once (interactive):

```bash
cd client/mobile
eas init
```

Confirm the project ID in `app.json` matches what EAS hands back
(`3d8d8ca4-b1e6-4e2d-b685-2d80eb3646c6`).

### Configure submission credentials

```bash
eas credentials
```

For Android, follow the prompts to set up Play credentials. The cleanest
flow is a Play Console service account with the **Release Manager** role
and a downloaded JSON key — EAS asks for that JSON.

If you want `eas submit` to be hands-off, also update `eas.json`:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./pc-api-XXXX.json",
      "track": "internal"
    }
  }
}
```

Keep the JSON key **out of git** (`.gitignore` should already cover it).

### Build

```bash
eas build --profile production --platform android
```

Watch the build log on the EAS dashboard. Expect ~15–25 minutes the first
time (longer if dependencies are cached cold).

When the build completes, download the AAB or grab the URL from the EAS
dashboard.

---

## 7. Create the Play Console listing

1. **Console → Create app.** Name `QueenSkiilia`, default language English (US).
   App or Game: **App**. Free or Paid: **Free**.
2. **Confirm Declarations.** Targets children → **No**. Ads → **No**.
3. **Store presence → Main store listing.** Paste the copy from
   `store-listing/play-store.md`. Upload assets per
   `store-listing/assets-spec.md`. Set Privacy Policy URL to the deployed
   legal site.
4. **Policy → App content.**
   - **Privacy Policy:** the legal-site URL.
   - **Ads:** No.
   - **App access:** "All functionality is available without restrictions" — also
     provide tester credentials so the reviewer can sign in.
   - **Content rating:** complete the IARC questionnaire. Expected outcome: **Teen (13+)**.
   - **Target audience:** Adults; mark "13 and older" as a sub-audience.
   - **News app:** No.
   - **Covid-19 contact tracing or status:** No.
   - **Data Safety:** mirror the table in `legal/markdown/privacy.md §2`
     exactly. Mark Paystack as a third-party processor for "Financial info
     — User payment info."
   - **Government apps:** No.
   - **Financial features:** **declare "Personal loans" → No**, but mark
     "Other financial features → Manages payments." Provide the in-app
     screenshot of the deposit screen as the disclosure example.
5. **Production → Releases → Create new release.** Upload the AAB. Add
   release notes from `store-listing/play-store.md → What's new`.
6. **Save and review** the listing, but **don't promote to production yet**
   — go to Internal Testing first (step 8).

---

## 8. Internal testing track

1. **Testing → Internal testing → Create new release.** Upload the same
   AAB.
2. Add an email list of 10–20 testers (yourself + friendly users + a couple
   of moderation/legal reviewers).
3. Share the opt-in URL Play hands back.
4. Walk every tester through the full lifecycle:
   - Sign up as student → verify identity → apply to a project.
   - Sign up as business → post a project → select the student → fund
     escrow → review the submission → release → rate.
   - Confirm Delete Account from Settings actually deletes.
   - Confirm the report button on a profile and a project both submit.
5. Watch crash reports in Play Console **daily** during internal testing.

**Done when:** at least three testers complete the full project lifecycle
end-to-end without bugs.

---

## 9. Closed → Open → Production

Per the plan in `plans/mobile/16-launch-and-compliance.md §16.5`:

1. **Internal → Closed testing.** Add 50–100 testers via email list or
   opt-in URL. Run for at least one week. Watch ANRs, crash-free rate, and
   user reports.
2. **Closed → Open testing.** Anyone with the opt-in URL can install.
   Watch the same metrics for at least another week. Triage every
   support email.
3. **Open → Production with staged rollout.**
   - Day 1: **5%**. Watch for 24 hours.
   - Day 2: **20%** if no critical issues.
   - Day 4: **50%**.
   - Day 7: **100%** if metrics are clean.

A "critical issue" is any of: crash-free rate < 99%, ANR rate > 0.47%, P0
moderation incident, payment failure rate > 1%, or a Data Safety / Policy
warning email from Google.

Pause the rollout (Play Console → Production → Halt rollout) and ship a
fix via OTA (`npm run update:production`) **only if the fix is JS-only**.
Native changes require a full new AAB.

---

## 10. Post-launch checklist

- Update memory `session_queenskilla_session.md` with the live Play
  URL and rollout percentage.
- Add a `project_queenskilla_legal_assets.md` memory with the final
  Privacy / Terms URLs.
- Subscribe to Play Console alerts (Settings → Email preferences) so
  policy warnings reach the right inbox.
- Schedule the 30-day account-deletion cleanup job (Feature 15 follow-up).
- Re-enable real Paystack when ready: drop the mock branch in
  `(business)/projects/deposit/[projectId].tsx` and route through the
  reactivated paystack-service.

---

## Appendix A — Required permissions

App.json declares only what the camera and image-picker plugins ask for.
Final Android manifest will include:

- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE` (legacy SDKs; modern
  storage access goes through SAF)
- `android.permission.INTERNET`
- `android.permission.VIBRATE` (haptics on OTP entry)
- `android.permission.POST_NOTIFICATIONS` (Android 13+)

If you see anything else in the AAB manifest, search for the offending
package and remove it before re-submission.

## Appendix B — Things this runbook does NOT cover

- Actually writing the marketing site at queenskilla.app.
- Paystack onboarding (KYC for the operating entity).
- ASO keyword research.
- Localisation of the listing into French / Spanish / Portuguese.
- Apple TestFlight + App Store submission (separate runbook needed).
