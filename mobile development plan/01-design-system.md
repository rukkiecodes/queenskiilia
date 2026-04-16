# Design System — Colors, Typography, Spacing

## Brand Colors (from Blueprint)

```typescript
// constants/colors.ts

export const Colors = {
  // === Primary Palette ===
  royalBlue:        '#1A237E',   // Primary brand — headers, CTAs
  royalBlueLight:   '#283593',   // Hover / pressed state
  royalBlueDark:    '#0D1257',   // Deep variant
  gold:             '#FFD700',   // Accent — badges, highlights, stars
  goldLight:        '#FFF176',   // Gold hover / soft glow
  goldDark:         '#F9A825',   // Gold pressed / deep accent

  // === Backgrounds (Dark Theme — Primary) ===
  bgPrimary:        '#0A0A14',   // App background
  bgSurface:        '#12122A',   // Card / sheet background
  bgSurfaceAlt:     '#1A1A35',   // Secondary surface (modals, inputs)
  bgOverlay:        '#0A0A14CC', // Semi-transparent overlay

  // === Text ===
  textPrimary:      '#FFFFFF',   // Main text
  textSecondary:    '#B0BEC5',   // Subtitles, labels
  textMuted:        '#607D8B',   // Placeholders, disabled
  textInverse:      '#0A0A14',   // Text on gold/light backgrounds

  // === Borders ===
  border:           '#2A2A4A',   // Default border
  borderFocus:      '#FFD700',   // Focused input border
  borderLight:      '#3A3A5C',   // Subtle border

  // === Semantic ===
  success:          '#4CAF50',
  successLight:     '#C8E6C9',
  error:            '#F44336',
  errorLight:       '#FFCDD2',
  warning:          '#FF9800',
  warningLight:     '#FFE0B2',
  info:             '#2196F3',
  infoLight:        '#BBDEFB',

  // === Skill Level Colors ===
  beginner:         '#4CAF50',   // Green
  intermediate:     '#2196F3',   // Blue
  advanced:         '#FF9800',   // Orange
  expert:           '#FFD700',   // Gold

  // === Status Colors (Projects) ===
  statusOpen:       '#4CAF50',
  statusInProgress: '#2196F3',
  statusUnderReview:'#FF9800',
  statusCompleted:  '#9C27B0',
  statusDisputed:   '#F44336',
  statusCancelled:  '#607D8B',

  // === Escrow / Payment ===
  escrowHeld:       '#FF9800',
  escrowReleased:   '#4CAF50',
  escrowRefunded:   '#2196F3',
  escrowDisputed:   '#F44336',

  // === Verified Badges ===
  verifiedTalent:   '#FFD700',
  verifiedBusiness: '#1A237E',

  // === Pure ===
  white:            '#FFFFFF',
  black:            '#000000',
  transparent:      'transparent',
} as const;
```

---

## Typography

```typescript
// constants/typography.ts

export const FontFamily = {
  regular:    'Inter-Regular',
  medium:     'Inter-Medium',
  semiBold:   'Inter-SemiBold',
  bold:       'Inter-Bold',
  extraBold:  'Inter-ExtraBold',
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  base: 16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
} as const;
```

---

## Spacing System (8pt grid)

```typescript
// constants/spacing.ts

export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
} as const;

export const Radius = {
  none: 0,
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;
```

---

## Shadows

```typescript
// constants/shadows.ts

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  gold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
```

---

## Icon System

Use `@expo/vector-icons` Ionicons throughout.

| Context | Icon |
|---|---|
| Home | `home` / `home-outline` |
| Projects | `briefcase` / `briefcase-outline` |
| Chat | `chatbubbles` / `chatbubbles-outline` |
| Notifications | `notifications` / `notifications-outline` |
| Profile | `person` / `person-outline` |
| Skill Test | `school` / `school-outline` |
| Portfolio | `albums` / `albums-outline` |
| Earnings | `wallet` / `wallet-outline` |
| Verified | `checkmark-circle` (gold) |
| Star (rating) | `star` / `star-outline` |
| Search | `search` |
| Filter | `options` |
| Back | `chevron-back` |
| Close | `close` |
| Add | `add` |
| Settings | `settings` / `settings-outline` |

---

## Component Themes

### Button Variants
```
Primary  → bg: royalBlue,   text: white,    border: none
Gold     → bg: gold,        text: textInverse, border: none
Outline  → bg: transparent, text: white,    border: border
Ghost    → bg: transparent, text: textSecondary, border: none
Danger   → bg: error,       text: white,    border: none
```

### Input States
```
Default  → border: border,      bg: bgSurfaceAlt
Focused  → border: gold,        bg: bgSurfaceAlt
Error    → border: error,       bg: bgSurfaceAlt
Disabled → border: border,      bg: bgSurface,    opacity: 0.5
```
