# Asset Specification

Save final assets under `store-listing/assets/` (gitignored binaries are
fine — commit only the small source files needed to regenerate them).

## Icons

### Google Play app icon
- **Format:** PNG, no alpha.
- **Size:** 512 × 512.
- **Naming:** `play-store-icon.png`.
- **Source:** designer file at [INSERT FIGMA / SOURCE LOCATION].

The in-app icon already lives at
`client/mobile/assets/images/icon.png` and the Android adaptive icon
foreground/background under `client/mobile/assets/images/`. The store
icon should match those visually (square, centered crown mark, no text).

### App Store icon
- **Format:** PNG, no alpha, square (no rounding — Apple rounds at render).
- **Size:** 1024 × 1024.
- **Naming:** `app-store-icon.png`.

## Feature graphic (Google Play only)

- **Format:** JPG or PNG.
- **Size:** 1024 × 500.
- **Naming:** `feature-graphic.png`.
- **Notes:** Shown at the top of the listing. Keep critical content within
  the inner 924×400 because the edges may be cropped on some surfaces.
  No app store badges, no system UI mockups (Play rejects those).

## Screenshots

Required minimum: **2 per device class**. Strong recommendation: **4–8 per
device class**, covering distinct screens. All screenshots must be real
captures from the running app — no fabricated mockups, no rendered
prototypes.

### Phone (Android)
- **Aspect ratio:** between 16:9 and 9:16; **min** 320 px, **max** 3840 px on
  the long edge.
- **Practical target:** **1440 × 3120** (matches a Pixel 8).

### 7-inch tablet (Android)
- **Aspect ratio:** between 4:3 and 3:4; long edge 1024–3840 px.
- **Practical target:** **2048 × 2732**.

### 10-inch tablet (Android)
- Same constraints as 7-inch.
- **Practical target:** **2560 × 1600**.

### iPhone 6.7" (App Store, only if submitting to Apple)
- **Required.** 1290 × 2796.

### iPad 12.9" (App Store, only if submitting to Apple)
- **Required if any iPad screenshots provided.** 2048 × 2732.

### Suggested capture list (8 frames, ordered)

1. **Hero — student dashboard.** Mid-density data, the "Earnings" tile
   showing a non-zero number, one in-progress project.
2. **Marketplace.** Project list with the filter pill row visible and at
   least four real-looking project cards.
3. **Project detail.** Verified business badge visible, budget, deadline,
   required skills, and the Apply button.
4. **Chat.** Real conversation with at least one image attachment and one
   text bubble from each side.
5. **Submission review (business).** Files attached, approve/request-revision
   buttons visible.
6. **Earnings screen.** Held + released totals, transaction list with a few
   entries, the FinancialDisclaimer footer visible.
7. **Portfolio.** Two or three portfolio items with star ratings.
8. **Profile + verification.** Verified badge prominent.

Capture every frame on the **same device** for consistent status-bar
treatment. Status-bar carrier and battery icons must look normal (use
Android's demo-mode for clean bars).

## Promotional video (optional but boosts conversion)

- **Length:** 30s – 2min.
- **Aspect ratio:** 16:9.
- **Captions:** burnt-in English captions for accessibility.
- **Hosting:** unlisted YouTube, paste the URL in the Play Console field.

## Generation runbook

1. Run the app on a clean emulator at the target resolution
   (`emulator -avd Pixel_8_API_34`).
2. Use the in-app onboarding to create the test student account and seed
   sample data through the GraphQL playground if needed.
3. Trigger Android's screenshot shortcut (`Volume Down + Power`).
4. Crop status-bar artifacts if present.
5. Run through a brief design review (no debug overlays, no developer
   menu, no toast that says "MOCK PAYMENT" — switch to production env
   before capturing the payment screens).
6. Drop into `store-listing/assets/screenshots/{platform}/{class}/` with
   filenames like `01-dashboard.png`.

## Reviewer guidance

Add a short note about each screenshot in the Play Console "Notes for
the reviewer" field so the reviewer can match the screens to the journey
described in the description.
