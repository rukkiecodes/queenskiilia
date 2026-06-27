# QueenSkiilia Privacy Policy

**Effective date:** [INSERT DATE BEFORE LAUNCH]
**Last updated:** [INSERT DATE BEFORE LAUNCH]

QueenSkiilia ("we", "us", "our") operates the QueenSkiilia mobile app and
related services (the "Service"). This Privacy Policy describes what
information we collect, why we collect it, how we use it, and the choices
you have. By using the Service you agree to this policy.

This policy is written to satisfy the Google Play Data Safety requirements
and applicable data-protection law (including, where relevant, the General
Data Protection Regulation and the Nigeria Data Protection Act). If a
specific provision conflicts with mandatory local law, that law applies.

---

## 1. Who we are

QueenSkiilia is a marketplace that connects students with verified
businesses for paid project work. The data controller is QueenSkiilia Ltd
(or its operating entity, [INSERT LEGAL ENTITY NAME], registered in
[INSERT COUNTRY], reachable at the contact below).

**Contact us:** support@queenskilla.app

---

## 2. Information we collect

We only collect information we genuinely need to run the Service. Each
data type below maps to the Google Play Data Safety category in brackets.

### Data you provide directly

| Field | Category | Why we collect it |
|---|---|---|
| Email address | Personal info — Email | One-time-passcode authentication, transactional messages. |
| Full name | Personal info — Name | Profile display, project communication. |
| Country | Personal info — Other | Matching projects, currency handling, tax compliance. |
| Profile photo (avatar) | Photos and videos | Profile display and chat. |
| Government ID photo | Photos and videos | Identity verification only — never shown to other users. |
| Face photo (selfie) | Photos and videos | Identity verification only — never shown to other users. |
| Business registration documents | Photos and videos / Files and docs | Business verification only — never shown to other users. |
| Portfolio descriptions and uploaded work files | Photos and videos / Files and docs | Public portfolio shown to potential clients. |
| Chat messages and attachments | Messages | Communication with the other party on a project. |
| Bio, university, graduation year, skills, skill level, links | Personal info — Other | Public profile and project matching. |
| Company name, industry, website, description | Personal info — Other | Public business profile. |

### Data we collect automatically

| Field | Category | Why |
|---|---|---|
| Approximate location (derived from country setting) | Location — Approximate | Currency and matching. We do **not** collect precise device location. |
| Push notification token | Device or other IDs | Delivering push notifications you opted in to. |
| App-version, runtime-version, device platform | App info and performance | Crash diagnostics and minimum-version checks. |
| Authentication tokens (access + refresh) | App activity | Keeping you signed in across sessions. |

### Data we collect via third parties

| Service | What they handle | Why |
|---|---|---|
| Paystack (`paystack.com`) | Payment processing, escrow disbursement. | We do **not** store card numbers; Paystack is PCI-DSS-compliant. |
| Cloudinary (`cloudinary.com`) | Image and file hosting (avatars, portfolio, ID documents, chat attachments). | Storage and delivery. ID and verification documents are stored in a restricted-access folder. |
| Supabase (`supabase.com`) | Primary database (Postgres) and realtime infrastructure. | Storage of all profile, project, chat, payment, and notification records. Hosted in Supabase's managed cloud. |
| Vercel (`vercel.com`) | Hosting for our GraphQL backend (federated subgraphs). | Server-side application hosting. |
| Google (Play Services) | Push notification delivery (FCM). | Sending notifications to Android devices. |
| Apple (APNs) | Push notification delivery (APNs). | Sending notifications to iOS devices. |
| SMTP provider ([INSERT PROVIDER NAME]) | Sending transactional emails (OTP codes, password resets). | One-time-passcode delivery. |

We do **not** share data with advertising networks, data brokers, or
analytics partners that profile users across services.

---

## 3. How we use your information

We use your information to:

- **Run the Service:** authenticate you, host your profile, list projects,
  let parties chat, process escrow payments, deliver notifications.
- **Verify users:** review government ID and face photos to issue the
  "Verified" badge. We do not share these documents with other users.
- **Communicate with you:** transactional emails (OTP, receipts, deletion
  confirmations), push notifications (only categories you opted into),
  and customer-support replies.
- **Comply with law:** retain transaction records as required by tax,
  anti-fraud, and anti-money-laundering regulations.
- **Maintain platform safety:** review user-submitted reports of abuse,
  fraud, or spam under our content policy.

We **do not** use your data for ad targeting, build advertising profiles,
or sell your information to third parties.

---

## 4. Legal basis (GDPR users)

If GDPR applies to you, we rely on the following legal bases:

- **Contractual necessity** — to deliver the Service you signed up for
  (most data uses above).
- **Legitimate interests** — fraud prevention, security, and verification.
- **Consent** — push notifications, optional profile fields.
- **Legal obligation** — keeping transaction records.

---

## 5. Who sees your data

| Audience | What they see |
|---|---|
| Other users on the platform | Your public profile (name, avatar, bio, skills, portfolio, public ratings). Nothing related to verification documents or payment details. |
| Project counterparties only | Chat messages, submitted work files, escrow status for a shared project. |
| QueenSkiilia staff | All data, on a least-privilege basis, only when needed to operate the Service, review verification documents, or resolve disputes. |
| Sub-processors (Paystack, Cloudinary, Supabase, Vercel, Google/Apple, SMTP provider) | Only the data necessary for their function (see §2). |
| Authorities | When required by law, court order, or to investigate fraud, harassment, or other policy violations. |

---

## 6. Data retention

- **Account data:** kept while your account is active.
- **Account deletion:** when you delete your account from Settings → Delete
  Account, we soft-delete the account immediately (you can no longer log
  in) and **permanently delete** the account record after a **30-day
  reversibility window**. During that window you may recover by contacting
  support from your registered email.
- **Transaction records (escrow, payouts, fees):** retained for **7 years**
  after the transaction, as required by financial-services and tax law.
  These records are kept even after account deletion but are stripped of
  optional profile fields.
- **Verification documents:** deleted within **30 days** after your account
  is approved or rejected.
- **Chat messages:** kept while the underlying project exists; deleted when
  the project is permanently deleted.
- **Cloudinary uploads:** scheduled for deletion when their referencing row
  (avatar, portfolio item, message attachment) is deleted.
- **Backups:** routine backups may retain deleted records for up to **90
  days** beyond deletion, after which they roll off.

---

## 7. Your rights

You can, at any time:

- **Access** your data via the in-app Profile and Settings screens.
- **Correct** profile fields in Settings → Profile.
- **Delete** your account via Settings → Delete Account.
- **Export** your data by emailing support@queenskilla.app with the subject
  "Data export request" — we will respond within 30 days.
- **Object** to a specific processing activity or **withdraw consent**
  (notifications, optional profile fields) at any time in Settings.
- **Lodge a complaint** with your national data-protection authority.

If you are in the EU/EEA, you can contact our representative at the email
above.

---

## 8. Security

We use industry-standard practices to protect your data:

- All network traffic uses HTTPS.
- Authentication tokens are stored on-device in the platform's secure
  storage (iOS Keychain, Android Keystore via `expo-secure-store`).
- Backend services use least-privilege database credentials.
- Verification documents live in a restricted Cloudinary folder.
- Card numbers are never seen by QueenSkiilia; all payment data flows
  through Paystack.

No system is perfectly secure. If we discover a breach affecting your
data, we will notify affected users without undue delay, consistent with
applicable law.

---

## 9. Children

QueenSkiilia is rated **Teen (13+)** and is not intended for users under
the age of 13. We do not knowingly collect personal information from
children under 13. If you believe a child under 13 has used the Service,
please contact us and we will delete the account.

Users between 13 and 18 may use the Service only with parental or
guardian consent and only with profile information appropriate for a
public marketplace. We do not surface payment methods to users who
indicate they are under 18.

---

## 10. International transfers

QueenSkiilia is operated from [INSERT COUNTRY]. Our sub-processors
(Supabase, Vercel, Cloudinary, Paystack, Google, Apple) may store and
process data in regions including the United States and the European
Union. Where required, we rely on Standard Contractual Clauses or
equivalent safeguards.

---

## 11. Changes to this policy

We may update this policy as the Service evolves. Material changes will
be announced in-app and via email at least **14 days** before they take
effect. Continued use of the Service after the effective date constitutes
acceptance of the updated policy.

---

## 12. Contact

For privacy questions, data-export requests, or anything else:

- **Email:** support@queenskilla.app
- **Postal:** [INSERT LEGAL ENTITY POSTAL ADDRESS]
