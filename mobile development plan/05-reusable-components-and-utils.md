# Reusable Components & Utility Functions

All components use **inline styles** (no StyleSheet.create, no Tailwind).
Shadows use CSS `boxShadow` style prop.
Rounded corners use `{ borderCurve: 'continuous' }`.
Icons use `expo-image` with `source="sf:icon-name"` (SF Symbols).
Safe area via `<ScrollView contentInsetAdjustmentBehavior="automatic" />`.

---

## UI Primitives (`components/ui/`)

### Button (components/ui/button.tsx)
```typescript
// Props
type ButtonProps = {
  variant: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}
// Uses Pressable with Reanimated scale on press
// Haptic feedback on iOS via expo-haptics (ImpactFeedbackStyle.Light)
// process.env.EXPO_OS === 'ios' guard for haptics
```

### Input (components/ui/input.tsx)
```typescript
type InputProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  hint?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
  leftIcon?: string;   // SF Symbol name
  rightIcon?: string;  // SF Symbol name
  onRightIconPress?: () => void;
}
// Icons rendered via: <Image source="sf:magnifyingglass" style={{ width: 20, height: 20 }} />
```

### OTPInput (components/ui/otp-input.tsx)
```typescript
type OTPInputProps = {
  length?: number;        // default 6
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}
// 6 TextInput boxes with auto-advance and backspace handling
// Reanimated 4 shake on error:
//   useSharedValue → withSequence(withTiming(-10), withTiming(10), withTiming(-10), withTiming(0))
// Paste detection: onChangeText length > 1 → fill all boxes
```

### Avatar (components/ui/avatar.tsx)
```typescript
type AvatarProps = {
  uri?: string;
  name?: string;         // fallback initials (first + last initial)
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showVerified?: boolean;
  verifiedType?: 'talent' | 'business';
}
// Image from expo-image for the avatar photo
// Verified badge: SF Symbol "checkmark.seal.fill" (gold for talent, blue for business)
```

### Badge (components/ui/badge.tsx)
```typescript
type BadgeProps = {
  label: string;
  variant: 'skill-level' | 'status' | 'verified' | 'category';
  value?: string;       // for skill-level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}
// Inline styles, color from utils/color.ts getSkillLevelColor / getStatusColor
```

### Tag (components/ui/tag.tsx)
```typescript
type TagProps = {
  label: string;
  onRemove?: () => void;   // shows X icon if set
  color?: string;
  variant?: 'solid' | 'outline';
}
```

### RatingStars (components/ui/rating-stars.tsx)
```typescript
type RatingStarsProps = {
  value: number;                       // 0–5
  onChange?: (v: number) => void;      // interactive if provided
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
// SF Symbols: "star.fill", "star", "star.leadinghalf.filled"
// <Image source="sf:star.fill" style={{ tintColor: Colors.gold }} />
```

### ProgressBar (components/ui/progress-bar.tsx)
```typescript
type ProgressBarProps = {
  progress: number;        // 0–1
  color?: string;
  height?: number;
  animated?: boolean;      // Reanimated 4 width animation
}
```

### CountdownTimer (components/ui/countdown-timer.tsx)
```typescript
type CountdownTimerProps = {
  expiresAt: Date | string;
  onExpire?: () => void;
  warningThresholdSeconds?: number;   // turns red below this
  format?: 'mm:ss' | 'hh:mm:ss' | 'relative';
}
// Uses setInterval internally, cleans up on unmount
```

### Toast (components/ui/toast.tsx)
```typescript
// Global — rendered in root layout
// Controlled by useUIStore().showToast()
// Auto-dismisses after 3s
// Reanimated 4 entering: SlideInUp / exiting: SlideOutUp
// No external library needed — formSheet and modal presentations used for dialogs
```

### EmptyState (components/ui/empty-state.tsx)
```typescript
type EmptyStateProps = {
  illustration?: 'projects' | 'notifications' | 'chat' | 'portfolio';
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}
```

### Skeleton (components/ui/skeleton.tsx)
```typescript
type SkeletonProps = {
  width: number | string;
  height: number;
  radius?: number;
  count?: number;
}
// Reanimated 4 shimmer: useSharedValue opacity 0.3 → 1 → 0.3 withRepeat
```

---

## Card Components (`components/cards/`)

### ProjectCard (components/cards/project-card.tsx)
```typescript
type ProjectCardProps = {
  project: Project;
  onPress: () => void;
  variant?: 'student' | 'business';    // business shows applicant count
  showStatus?: boolean;
}
// Inline styles, boxShadow for elevation
// style={{ borderRadius: 16, borderCurve: 'continuous', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
```

### UserCard (components/cards/user-card.tsx)
```typescript
type UserCardProps = {
  user: User;
  onPress: () => void;
  showRating?: boolean;
  showSkillLevel?: boolean;
  showVerified?: boolean;
  action?: React.ReactNode;
}
```

### NotificationCard (components/cards/notification-card.tsx)
```typescript
type NotificationCardProps = {
  notification: Notification;
  onPress: () => void;
}
// Left SF Symbol icon based on type
// Unread: gold dot indicator
// Relative timestamp (date-fns formatDistanceToNow)
```

### ChatPreviewCard (components/cards/chat-preview-card.tsx)
```typescript
type ChatPreviewCardProps = {
  chat: Chat;
  lastMessage?: Message;
  unreadCount: number;
  onPress: () => void;
}
```

### PortfolioItemCard (components/cards/portfolio-item-card.tsx)
```typescript
type PortfolioItemCardProps = {
  item: PortfolioItem;
  onPress: () => void;
  onToggleVisibility?: () => void;
}
```

---

## Form Components (`components/forms/`)

### SkillSelector (components/forms/skill-selector.tsx)
- Multi-select tag input for choosing skills
- Searchable text input with dropdown results
- Selected skills shown as removable Tag chips
- Opens as a `formSheet` screen for full-screen search on mobile

### CountryPicker (components/forms/country-picker.tsx)
- Searchable modal (presented as formSheet)
- Country list with flag emojis
- Returns ISO code + name

### CurrencyPicker (components/forms/currency-picker.tsx)
- USD, GBP, EUR, NGN
- Inline segmented control or formSheet

### FilePicker (components/forms/file-picker.tsx)
- Wraps `expo-document-picker` + `expo-image-picker`
- Uploads to Cloudinary via `utils/cloudinary.ts`, returns `secure_url`
- Shows upload progress (TanStack Query mutation)
- Supports: images, PDF, ZIP
- Max size: 5MB enforced client-side

### DatePicker (components/forms/date-picker.tsx)
- Wraps `@react-native-community/datetimepicker`
- Shows formatted date (date-fns format)
- Min date: tomorrow (project deadlines)

---

## Utility Functions (`utils/`)

```typescript
// utils/format.ts
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export function formatCurrency(amount: number, currency = 'USD'): string
// → "$1,200.00" | "₦450,000"

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string
// → "Apr 16, 2026"  (uses date-fns format)

export function formatRelativeTime(date: string | Date): string
// → "2 hours ago" | "just now"  (uses date-fns formatDistanceToNow)

export function formatDeadline(date: string | Date): string
// → "3 days left" | "Due tomorrow" | "Overdue"  (uses differenceInDays)

export function truncate(text: string, maxLength: number): string
// → "This is a long des..."

export function formatCompactNumber(n: number): string
// → "1.4M" | "38k" | "500"  (per expo skill: format large numbers)
```

```typescript
// utils/color.ts
// Returns hex strings matching constants/colors.ts

export function getSkillLevelColor(level: string): string
// beginner → green, intermediate → blue, advanced → orange, expert → gold

export function getStatusColor(status: string): string
// open → green, in_progress → blue, disputed → red, completed → grey

export function getEscrowStatusColor(status: string): string
```

```typescript
// utils/validation.ts
import { z } from 'zod';

export const emailSchema = z.string().email();
export const otpSchema = z.string().length(6).regex(/^\d+$/);
export const budgetSchema = z.number().positive();
export const urlSchema = z.string().url();

// Helper wrappers:
export function isValidEmail(email: string): boolean
export function isValidOTP(otp: string): boolean
export function isValidBudget(value: string): boolean
```

```typescript
// utils/cloudinary.ts

const CLOUD = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(
  uri: string,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
  formData.append('upload_preset', PRESET);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}
```

```typescript
// utils/token.ts

export function decodeJWT(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
}

export function isTokenExpired(token: string): boolean {
  const { exp } = decodeJWT(token) as { exp: number };
  return Date.now() >= exp * 1000;
}

export function getTokenExpiry(token: string): Date {
  const { exp } = decodeJWT(token) as { exp: number };
  return new Date(exp * 1000);
}
```

---

## Custom Hooks (`hooks/`)

```
hooks/
├── use-auth.ts              useRequestOtp, useVerifyOtp, useAuthStore shortcut
├── use-projects.ts          TanStack useQuery for project list (paginated)
├── use-project.ts           Single project detail + action mutations
├── use-notifications.ts     Notification store + mark-read mutations
├── use-chat.ts              Socket.IO room join/leave + message send
├── use-skill-test.ts        Assessment session management
├── use-portfolio.ts         Portfolio items for current user
├── use-escrow.ts            Escrow + payment mutations
├── use-ratings.ts           Submit + fetch ratings
├── use-debounce.ts          Debounce any value (default 400ms)
├── use-refresh-on-focus.ts  Re-run TanStack query on screen focus
└── use-keyboard-avoid.ts    Reanimated keyboard offset for chat
```

### use-auth.ts
```typescript
import { useAuthStore } from '../store/auth-store';

export function useAuth() {
  const store = useAuthStore();
  return {
    ...store,
    isStudent: store.user?.accountType === 'student',
    isBusiness: store.user?.accountType === 'business',
    isVerified: store.user?.isVerified ?? false,
  };
}
```

### use-debounce.ts
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### use-refresh-on-focus.ts
```typescript
import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';

export function useRefreshOnFocus(refetch: () => void) {
  const focused = useIsFocused();
  const firstRender = React.useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (focused) refetch();
  }, [focused]);
}
```
