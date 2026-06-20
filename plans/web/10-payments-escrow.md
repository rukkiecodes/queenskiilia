# 10 — Payments & Escrow

**Goal:** After selecting a student, the business funds escrow via Paystack. Funds are held, then released on approval or refunded on dispute resolution. A payments dashboard shows escrows and transactions. Web uses Paystack's redirect/popup flow (simpler than the mobile WebView).

**Depends on:** 05 (student selected), 03 (shell).

**Backend:**
- payment-service: `escrow(projectId)`, `myEscrows`, `transactions(escrowId)`, `milestones(escrowId)`; `initiateEscrow(input)`, `releaseFunds(projectId)`, `refundEscrow(projectId)`, milestone mutations
- paystack-service: `initializePayment(input) → { authorizationUrl, accessCode, reference }`, `verifyPayment(reference)`, `paystackBanks`, transfer mutations

---

## User stories
- As a business, I fund escrow for a selected project and complete payment via Paystack.
- As a business, I see escrow status (pending → held → released/refunded) and transaction history.
- As a business, I release funds when work is approved.
- Fees and the "funds held in escrow" disclaimer are clearly disclosed before payment.

---

## Batches

### Batch 10.1 — Payments dashboard (2h)
- [ ] `app/composables/use-payments.ts` — `myEscrows`, `escrow`, `transactions`
- [ ] `app/components/cards/escrow-card.vue` — amount, currency, status chip, platform fee
- [ ] `app/pages/payments/index.vue` — escrow list + transaction history `<f-table>`
- [ ] `app/components/financial-disclaimer.vue` — escrow/fee disclosure (port from mobile)
- **Done when:** escrows + transactions render with accurate statuses.

### Batch 10.2 — Fund escrow via Paystack (2–3h)
- [ ] `app/pages/projects/[id]/fund.vue` — confirm amount + fee disclosure → `initiateEscrow` then `initializePayment`
- [ ] Redirect to `authorizationUrl` (or Paystack inline popup with the public key); set a return route `/payments/callback?reference=...`
- [ ] `app/pages/payments/callback.vue` — read `reference`, call `verifyPayment`, reconcile escrow to `held`, route back with a success `<f-alert>`
- **Done when:** a test-card payment completes, returns to callback, verifies, and the escrow shows `held`.

### Batch 10.3 — Release / refund (1–2h)
- [ ] Release CTA on an approved project → `releaseFunds(projectId)`; refund path tied to dispute resolution (F12)
- [ ] Status transitions reflected live in the dashboard
- **Done when:** release moves escrow to `released`; refund (via dispute) moves to `refunded`.

---

## Acceptance criteria
- [ ] Test-card transactions succeed end-to-end (initialize → callback → verify)
- [ ] Status transitions correct: pending → held → released/refunded
- [ ] Fee + escrow disclaimer shown before payment
- [ ] Payments dashboard accurate; transaction history present
- [ ] Works at 1440 / 768 / 390 px
- [ ] Memory bank: note web Paystack uses redirect/popup + `verifyPayment` callback (mobile uses WebView)
