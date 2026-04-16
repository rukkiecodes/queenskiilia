# Google Play Policy Compliance

Reference: Google Play Developer Policy (files in /google policy/)

---

## 1. Misrepresentation Policy

**Rule:** App title, icon, description must honestly represent functionality.

**QueenSkiilia compliance:**
- App name = "QueenSkiilia" (consistent across store listing and in-app)
- Short description must mention: skill marketplace, student projects, verified portfolio
- Icon: must NOT use logos from other companies (no Upwork/Fiverr resemblance)
- Developer name: must match real entity (Terry Amagboro / QueenSkiilia Ltd)
- Country of origin: must be accurate in developer profile

**Action items:**
- [ ] Write store listing description in plain English — no exaggerated claims
- [ ] Do NOT say "the #1 platform" without evidence
- [ ] Screenshots must show real app screens, not fabricated mockups

---

## 2. User Data & Privacy

**Rule:** Collect only what you need. Declare all data in the Data Safety section.

**Data QueenSkiilia collects:**

| Data Type | Why | Shared? |
|---|---|---|
| Email address | Auth (OTP) | No |
| Full name | Profile display | No |
| Profile photo | Avatar (Cloudinary) | Yes (other users) |
| Country | Profile + project matching | No |
| ID document photo | Verification | No (admin only) |
| Face photo | Verification (face match) | No |
| Business documents | Verification | No (admin only) |
| Device push token | Notifications | No |
| Submitted work files | Project submission | Yes (business client) |

**Privacy Policy requirements:**
- [ ] Host a Privacy Policy URL (required for Play Store submission)
- [ ] Explain: what data collected, why, how long retained, how to delete
- [ ] Explain: third-party services used (Cloudinary, Paystack, Supabase, Google)
- [ ] Provide in-app "Delete Account" option (required by Google since 2024)

---

## 3. Financial Services Policy

**Rule:** Apps handling payments must comply with local laws. Escrow services may need disclosures.

**QueenSkiilia compliance:**
- [ ] Add disclaimer: "QueenSkiilia is not a bank. Escrow services are facilitated by Paystack."
- [ ] Display clear fee disclosure: "Platform takes 10–15% commission"
- [ ] No crypto / NFT payments (would require additional review)
- [ ] Paystack handles PCI compliance — do NOT store card numbers in app
- [ ] Show refund policy in settings and terms

---

## 4. Impersonation & Fake Verification

**Rule:** Cannot impersonate other entities or suggest false verification status.

**QueenSkiilia compliance:**
- [ ] Verified badge must only show for users who have passed admin verification
- [ ] Cannot show "Verified" on demo/test accounts in screenshots
- [ ] Admin review process must be real (not auto-approve)

---

## 5. Spam & Minimum Functionality

**Rule:** App must provide substantial functionality at launch. No placeholder screens.

**Launch checklist (minimum viable):**
- [ ] Auth flow fully functional (OTP → login → profile)
- [ ] Project marketplace browsable without login (read-only)
- [ ] At least student dashboard + project listing functional
- [ ] Settings screen with logout and profile edit

---

## 6. Ratings & Reviews Policy

**Rule:** Cannot incentivize users to give positive reviews. Cannot fake ratings.

**QueenSkiilia compliance:**
- [ ] Rating prompts must appear naturally (after project completion only)
- [ ] Cannot offer coins/rewards for 5-star reviews
- [ ] In-app ratings between users (student ↔ business) are project-gated — only triggered after project approved

---

## 7. Permissions (Android)

Request only necessary permissions:

| Permission | Why needed |
|---|---|
| `CAMERA` | ID verification face photo, chat photo attachments |
| `READ_EXTERNAL_STORAGE` | Attach files in chat / submission upload |
| `NOTIFICATIONS` | Project updates, messages, deadline reminders |
| `INTERNET` | Core functionality |
| `VIBRATE` | Haptic feedback on OTP entry |

**Do NOT request:**
- `READ_CONTACTS` — not needed
- `RECORD_AUDIO` — not needed (unless adding voice notes later)
- `ACCESS_FINE_LOCATION` — not needed

---

## 8. Content Policy

**Rule:** No illegal, violent, adult, or hateful content.

**QueenSkiilia compliance:**
- [ ] Implement content moderation on project titles/descriptions (flag keywords)
- [ ] Implement file upload scanning (Cloudinary auto-moderation can help)
- [ ] Report button on project listings and user profiles
- [ ] Terms of Service must explicitly prohibit: plagiarism, harassment, adult content, illegal work

---

## 9. Target Audience

**Rated:** 13+ (Teen)
**Target:** College students + businesses

**Age gate compliance:**
- No explicit content allowed
- Do NOT target under-13s
- If user indicates they are under 18 → show student-only content, hide payment methods that require adult contracts

---

## 10. App Store Listing Requirements

### Required before submission:
- [ ] App icon: 512×512 PNG (no alpha)
- [ ] Feature graphic: 1024×500 JPG/PNG
- [ ] Screenshots: minimum 2, recommended 4–8 per device type (phone, tablet)
- [ ] Short description: max 80 characters
- [ ] Full description: max 4000 characters
- [ ] Privacy Policy URL (hosted, publicly accessible)
- [ ] Content rating questionnaire completed (IARC)
- [ ] Data Safety form completed
- [ ] Target API level: Android 14+ (API 34)
- [ ] 64-bit APK / AAB required
- [ ] App signing by Google Play enabled

### Recommended:
- [ ] Promotional video (30s–2min) showing core student flow
- [ ] Localized descriptions in English, French, Spanish, Portuguese (per blueprint)
