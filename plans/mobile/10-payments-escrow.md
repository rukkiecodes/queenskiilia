# 10 — Payments & Escrow (Paystack)

**Goal:** After business selects a student, they fund an escrow via Paystack. Funds release to the student when work is approved, or refund on dispute resolution.

**Depends on:** 01, 02, 03, 05. Backend payment-service + paystack-service.

**Backend GQL:** `myEscrows`, `initiateEscrow`, `initializePayment` (returns Paystack `authorizationUrl`), `releaseFunds`.

---

## User stories
- Right after selecting a student, business is prompted to deposit escrow.
- Business pays via Paystack in an in-app WebView.
- Business sees all escrow accounts (active, released, refunded).
- Business clicks "Release Funds" once work is approved (handled in feature 11).

---

## Batches

### Batch 10.1 — Paystack WebView modal (2h)
- [ ] `components/payments/paystack-webview.tsx` — `react-native-webview` modal
- [ ] On `initializePayment` → open WebView at `authorizationUrl`
- [ ] Listen for redirect to callback URL → extract `reference` → close WebView
- [ ] Show success/cancel toast based on result
- **Done when:** can complete a Paystack test transaction end-to-end.

### Batch 10.2 — Escrow deposit flow from select-student (1–2h)
- [ ] After `selectStudent` mutation succeeds, push `app/(business)/payments/deposit/[projectId].tsx`
- [ ] Show project summary, escrow amount, platform fee breakdown ("Platform takes 10–15%")
- [ ] "Deposit" button → `initiateEscrow` → `initializePayment` → open WebView
- [ ] On success → invalidate `my-projects` and `my-escrows` queries
- **Done when:** project status moves to `in_progress` after successful deposit.

### Batch 10.3 — Payments dashboard (1–2h)
- [ ] `app/(business)/payments.tsx` — list of `myEscrows` grouped by status
- [ ] Each row: project, amount + currency, status badge, release date if applicable
- [ ] Transaction history section below
- **Done when:** all escrows accurate, status badges color-correct via `getEscrowStatusColor`.

### Batch 10.4 — Release Funds button + confirmation (1h)
- [ ] On any in-progress escrow row: "Release Funds" button (only visible if work was approved — checks project status)
- [ ] Confirm sheet → `useReleaseFunds` mutation
- [ ] Success → toast + invalidate caches
- **Done when:** released funds appear in student earnings (feature 14).

---

## Acceptance criteria
- [ ] Test card transactions complete successfully
- [ ] Status transitions: deposited → released or refunded
- [ ] Refund (via dispute resolution) reflects in dashboard
- [ ] Compliance: fee disclosure visible before payment ("Platform takes 10–15%")
- [ ] Compliance: disclaimer "QueenSkiilia is not a bank. Escrow facilitated by Paystack." shown on payment screen
- [ ] Memory bank: no changes
