# QueenSkiilia Mobile — Feature Build Plan

Project: `client/mobile/` · Stack: Expo SDK 55 + Expo Router · TanStack Query + Zustand · OTP auth · **Apple design language**.

This folder breaks the mobile app into **16 features**, ordered by dependency. Each feature file lists its **batches** — small, shippable units (~1–3 hours of work each). A batch closes when its acceptance criteria pass on a real device against the live Vercel backend.

> **Visual source of truth:** [`client/mobile/DESIGN.md`](../../client/mobile/DESIGN.md) — the Apple design language installed via `getdesign`. Every UI decision (color, type, spacing, motion) traces back to this file.
> **Architecture/GraphQL specs:** see [`mobile development plan/`](../../mobile%20development%20plan/) for backend contract details. Where that folder talks about visual styling (e.g., "gold accents"), DESIGN.md supersedes it.

---

## Phase 0 — Foundation (prerequisite, not a feature)

Must be complete before Feature 01 starts.

### Project setup
- [ ] Delete boilerplate: `app/(tabs)/`, `app/modal.tsx`
- [ ] Create `.env` with `EXPO_PUBLIC_API_URL=https://queenskilla-mainserver.vercel.app`, `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- [ ] Create `types/env.d.ts` declaring those vars

### Fonts (Poppins family)
- [ ] Drop the 17 Poppins TTF files into `assets/fonts/Poppins/`. Required filenames:
  - `Poppins-Black.ttf`, `Poppins-BlackItalic.ttf`
  - `Poppins-Bold.ttf`, `Poppins-BoldItalic.ttf`
  - `Poppins-ExtraBold.ttf`, `Poppins-ExtraBoldItalic.ttf`
  - `Poppins-ExtraLight.ttf`, `Poppins-ExtraLightItalic.ttf`
  - `Poppins-Italic.ttf`
  - `Poppins-Light.ttf`, `Poppins-LightItalic.ttf`
  - `Poppins-Medium.ttf`, `Poppins-MediumItalic.ttf`
  - `Poppins-Regular.ttf`
  - `Poppins-SemiBold.ttf`, `Poppins-SemiBoldItalic.ttf`
  - `Poppins-Thin.ttf`, `Poppins-ThinItalic.ttf`
- [ ] Load fonts once at the root via `useFonts` in `app/_layout.tsx` (not inside `ThemedText` — that re-registers on every render)

### Normalizer utilities (`lib/`)
- [ ] `lib/normalize-font-size.ts`
  ```ts
  import { Dimensions, PixelRatio } from 'react-native';
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const BASE_WIDTH = 375;
  const BASE_HEIGHT = 812;

  export const normalizeFontSize = (size: number) => {
    const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
    return Math.round(PixelRatio.roundToNearestPixel((size * scale) / 1.5));
  };
  ```
- [ ] `lib/normalize-size.ts`
  ```ts
  import { Dimensions, PixelRatio } from 'react-native';
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const BASE_WIDTH = 375;

  export const normalizeSize = (size: number) =>
    Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size));
  ```
- [ ] `lib/normalize-color.ts` — keeps colors visually consistent across iOS/Android (Android renders certain hex/8-digit forms slightly differently; rgba strings are interpreted identically on both platforms)
  ```ts
  // Accepts: "#RGB", "#RRGGBB", "#RRGGBBAA", "rgb(...)", "rgba(...)" → returns "rgba(r, g, b, a)".
  // Optional second arg overrides alpha (0–1).
  export const normalizeColor = (input: string, alpha?: number): string => {
    let r = 0, g = 0, b = 0, a = 1;

    if (input.startsWith('#')) {
      let hex = input.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) hex += 'ff';
      if (hex.length !== 8) throw new Error(`Invalid hex color: ${input}`);
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      const m = input.match(/rgba?\(([^)]+)\)/i);
      if (!m) throw new Error(`Unsupported color: ${input}`);
      const parts = m[1].split(',').map(s => s.trim());
      r = +parts[0]; g = +parts[1]; b = +parts[2];
      a = parts[3] !== undefined ? +parts[3] : 1;
    }

    if (alpha !== undefined) a = alpha;
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  };
  ```

### Design tokens (`constants/`)
- [ ] `constants/colors.ts` — palette derived from DESIGN.md, every value run through `normalizeColor` so iOS/Android render identically. **Action Blue (#0066cc) is the only interactive color.**
  ```ts
  import { normalizeColor as n } from '@/lib/normalize-color';

  export const colors = {
    // Interactive
    primary:           n('#0066cc'),  // Action Blue — links, buttons, focus
    primaryFocus:      n('#0071e3'),  // hover/pressed (web/iPad)
    primaryOnDark:     n('#2997ff'),  // links on dark canvas

    // Text
    ink:               n('#1d1d1f'),  // body text on light
    body:              n('#1d1d1f'),
    bodyOnDark:        n('#ffffff'),
    bodyMuted:         n('#cccccc'),  // muted on dark
    inkMuted80:        n('#333333'),
    inkMuted48:        n('#7a7a7a'),

    // Hairlines / dividers
    dividerSoft:       n('#f0f0f0'),
    hairline:          n('#e0e0e0'),

    // Surfaces
    canvas:            n('#ffffff'),
    canvasParchment:   n('#f5f5f7'),
    surfacePearl:      n('#fafafc'),
    surfaceTile1:      n('#272729'),
    surfaceTile2:      n('#2a2a2c'),
    surfaceTile3:      n('#252527'),
    surfaceBlack:      n('#000000'),
    chipTranslucent:   n('#d2d2d7'),

    // On-color
    onPrimary:         n('#ffffff'),
    onDark:            n('#ffffff'),
  } as const;

  export type ColorToken = keyof typeof colors;
  ```
- [ ] `constants/typography.ts` — Poppins font name constants + size tokens (each wrapped in `normalizeFontSize`). Mirrors the type scale from DESIGN.md.
  ```ts
  import { normalizeFontSize as f } from '@/lib/normalize-font-size';

  export const fonts = {
    black:            'Poppins-Black',
    blackItalic:      'Poppins-BlackItalic',
    bold:             'Poppins-Bold',
    boldItalic:       'Poppins-BoldItalic',
    extraBold:        'Poppins-ExtraBold',
    extraBoldItalic:  'Poppins-ExtraBoldItalic',
    extraLight:       'Poppins-ExtraLight',
    extraLightItalic: 'Poppins-ExtraLightItalic',
    italic:           'Poppins-Italic',
    light:            'Poppins-Light',
    lightItalic:      'Poppins-LightItalic',
    medium:           'Poppins-Medium',
    mediumItalic:     'Poppins-MediumItalic',
    regular:          'Poppins-Regular',
    semiBold:         'Poppins-SemiBold',
    semiBoldItalic:   'Poppins-SemiBoldItalic',
    thin:             'Poppins-Thin',
    thinItalic:       'Poppins-ThinItalic',
  } as const;

  // Size scale — match DESIGN.md type ramp; consumed pre-normalized so callers never call f() at the use site.
  export const fontSize = {
    heroDisplay: f(80),
    title1:      f(56),
    title2:      f(40),
    title3:      f(28),
    headline:    f(20),
    body:        f(17),
    callout:     f(15),
    caption:     f(13),
    micro:       f(11),
  } as const;
  ```
- [ ] `constants/spacing.ts` — 4-pt base scale, each wrapped in `normalizeSize` (so layouts scale on small + large screens identically)

### Themed primitives
- [ ] `components/themed-text.tsx` — props: `font` (Poppins-* name), `size` (token from `fontSize`), `color` (token from `colors`), `opacity?`. **Do NOT load fonts inside this component** — they're loaded once at root.
- [ ] `components/themed-view.tsx` — wraps `View` with palette-aware `backgroundColor`

### Data + auth
- [ ] `lib/token-storage.ts` (SecureStore wrapper)
- [ ] `lib/auth-api.ts` (fetch-based REST client for `/auth/*`)
- [ ] `lib/graphql-client.ts` (`gqlFetch<T>` with auto refresh)
- [ ] `store/auth-store.ts` and `store/ui-store.ts`

### Root
- [ ] Replace `app/_layout.tsx` with `QueryClientProvider` + auth gate (redirects unauthenticated → `(auth)`, authenticated → role dashboard) + root-level `useFonts` for the entire Poppins family
- [ ] App boots, no crashes, redirects to a placeholder `(auth)/index.tsx`

---

## Feature Order (build sequentially — later features depend on earlier ones)

| # | Feature | Why this order |
|---|---|---|
| 01 | [Authentication](01-authentication.md) | Nothing else works without a token |
| 02 | [Profile & verification](02-profile-and-verification.md) | Required to enter dashboards |
| 03 | [Navigation shells](03-navigation-shells.md) | Tab layouts unlock all role screens |
| 04 | [Student marketplace](04-student-marketplace.md) | Core student loop entry point |
| 05 | [Business projects](05-business-projects.md) | Core business loop — must exist for students to apply to |
| 06 | [Skill assessments](06-skill-assessments.md) | Filters student access to higher-tier projects |
| 07 | [Portfolio](07-portfolio.md) | Output of completed projects, viewed by businesses |
| 08 | [Talent search](08-talent-search.md) | Business-side discovery of students |
| 09 | [Chat (real-time)](09-chat-realtime.md) | Required for active project collaboration |
| 10 | [Payments & escrow](10-payments-escrow.md) | Required before work can begin |
| 11 | [Work submissions & review](11-work-submissions.md) | Closes the project lifecycle |
| 12 | [Ratings & disputes](12-ratings-and-disputes.md) | Post-completion flows |
| 13 | [Notifications & push](13-notifications-push.md) | Cross-cutting — best added once core flows exist |
| 14 | [Dashboards (leaderboard, earnings)](14-dashboards-leaderboard-earnings.md) | Read-only summaries of prior data |
| 15 | [Settings & account](15-settings-and-account.md) | Polish + Google Play compliance (Delete Account) |
| 16 | [Launch prep & compliance](16-launch-and-compliance.md) | Store assets, EAS build, Play Store submission |

---

## Conventions for every feature

### Visual
- **Design language:** Apple. `client/mobile/DESIGN.md` is the source of truth. When in doubt, read it before opening Figma or guessing.
- **Interactive color:** `colors.primary` (Action Blue, #0066cc) is the only interactive color. No gold, no secondary accents. CTAs, active tab, focus rings, links — all primary.
- **Surfaces:** alternate `colors.canvas` (white) and `colors.surfaceTile1/2/3` (near-black) per section. No gradients on chrome.
- **Shadows:** chrome has no shadows. The single allowed shadow is the soft drop under product/portfolio imagery resting on a surface.

### Typography
- All text goes through `<ThemedText font="..." size="...">`. Never hard-code `fontFamily` or `fontSize` in StyleSheet.
- Pick `font` from the Poppins names in `constants/typography.ts` (`fonts.regular`, `fonts.semiBold`, etc.).
- Pick `size` from `fontSize.*` tokens — never raw numbers.

### Sizing
- All numeric sizes (padding, margin, width, height, radius) go through `normalizeSize` — either at call site or via the `spacing` constants.
- All font sizes go through `normalizeFontSize` — already done in `fontSize` tokens, so prefer tokens.
- All colors go through `normalizeColor` — already done in `colors` tokens, so prefer tokens.

### Code structure
- **Filenames:** kebab-case (`auth-store.ts`, `project-card.tsx`)
- **Styling:** inline styles (no `StyleSheet.create` unless reused), `boxShadow` CSS prop, `borderCurve: 'continuous'`
- **Icons:** `<Image source="sf:name" />` from `expo-image`
- **Data:** TanStack Query (no Apollo), native `fetch` (no axios)
- **Tabs:** `NativeTabs` from `expo-router/unstable-native-tabs` with `NativeTabs.Trigger.Icon/.Label/.Badge`
- **Sheets:** `presentation: 'formSheet'` in Stack.Screen options (no `@gorhom/bottom-sheet`)
- **Skill invocation:** before scaffolding mobile code, invoke `building-native-ui` and/or `native-data-fetching` skills

### Definition of Done per batch
- Code merged
- Tested on a real device
- No expo-doctor warnings
- All UI uses tokens from `constants/colors.ts` + `constants/typography.ts` + `constants/spacing.ts` (no raw hex, no raw px, no raw font names)
- Memory bank updated if a durable decision changed
