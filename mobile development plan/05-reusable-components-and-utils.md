# Reusable Components & Utility Functions

---

## UI Primitives (`components/ui/`)

### Button
```typescript
// components/ui/Button.tsx
Props: {
  variant: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onPress: () => void
  children: ReactNode
  fullWidth?: boolean
  icon?: string           // Ionicons name
  iconPosition?: 'left' | 'right'
}
```

### Input
```typescript
// components/ui/Input.tsx
Props: {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (v: string) => void
  error?: string
  hint?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  multiline?: boolean
  maxLength?: number
  disabled?: boolean
  leftIcon?: string
  rightIcon?: string
  onRightIconPress?: () => void
}
```

### OTPInput
```typescript
// components/ui/OTPInput.tsx
Props: {
  length?: number          // default 6
  value: string
  onChange: (v: string) => void
  error?: boolean
  autoFocus?: boolean
}
// Auto-advances, handles backspace, supports paste
```

### Avatar
```typescript
// components/ui/Avatar.tsx
Props: {
  uri?: string
  name?: string            // fallback initials
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showVerified?: boolean
  verifiedType?: 'talent' | 'business'
}
```

### Badge
```typescript
// components/ui/Badge.tsx
Props: {
  label: string
  variant: 'skill-level' | 'status' | 'verified' | 'category'
  value?: string           // for skill-level: 'beginner' | 'intermediate' | etc.
}
// Automatically picks correct color from Colors constant
```

### Tag / Chip
```typescript
// components/ui/Tag.tsx
Props: {
  label: string
  onRemove?: () => void    // if set, shows X button
  color?: string
  variant?: 'solid' | 'outline'
}
```

### RatingStars
```typescript
// components/ui/RatingStars.tsx
Props: {
  value: number            // 0–5
  onChange?: (v: number) => void   // if interactive
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean      // shows "4.5" next to stars
}
```

### ProgressBar
```typescript
// components/ui/ProgressBar.tsx
Props: {
  progress: number         // 0–1
  color?: string
  height?: number
  animated?: boolean
}
```

### CountdownTimer
```typescript
// components/ui/CountdownTimer.tsx
Props: {
  expiresAt: Date | string
  onExpire?: () => void
  warningThresholdSeconds?: number   // turns red below this
  format?: 'mm:ss' | 'hh:mm:ss' | 'relative'
}
```

### BottomSheet
```typescript
// components/ui/BottomSheet.tsx
Props: {
  visible: boolean
  onClose: () => void
  snapPoints?: string[]    // e.g. ['30%', '60%']
  children: ReactNode
  title?: string
}
// Built on @gorhom/bottom-sheet
```

### Toast
```typescript
// components/ui/Toast.tsx
// Global — rendered in root layout
// Controlled by uiStore.showToast()
// Auto-dismisses after 3s
// Slides in from top with Reanimated
```

### EmptyState
```typescript
// components/ui/EmptyState.tsx
Props: {
  illustration?: 'projects' | 'notifications' | 'chat' | 'portfolio'
  title: string
  description?: string
  action?: { label: string; onPress: () => void }
}
```

### Skeleton
```typescript
// components/ui/Skeleton.tsx
Props: {
  width: number | string
  height: number
  radius?: number
  count?: number           // renders N stacked skeletons
}
// Shimmer animation via Reanimated
```

---

## Card Components (`components/cards/`)

### ProjectCard
```typescript
Props: {
  project: Project
  onPress: () => void
  variant?: 'student' | 'business'   // business shows applicant count
  showStatus?: boolean
}
// Displays: title, business/student name, skills (first 3 + overflow), budget, deadline
```

### UserCard
```typescript
Props: {
  user: User
  onPress: () => void
  showRating?: boolean
  showSkillLevel?: boolean
  showVerified?: boolean
  action?: ReactNode        // e.g. "Select" button
}
```

### NotificationCard
```typescript
Props: {
  notification: Notification
  onPress: () => void
}
// Left icon based on type, unread gold dot, relative timestamp
```

### ChatPreviewCard
```typescript
Props: {
  chat: Chat
  lastMessage?: Message
  unreadCount: number
  onPress: () => void
}
```

### PortfolioItemCard
```typescript
Props: {
  item: PortfolioItem
  onPress: () => void
  onToggleVisibility?: () => void
}
```

---

## Form Components (`components/forms/`)

### SkillSelector
- Multi-select tag input for choosing skills
- Searchable dropdown with add custom option
- Selected skills shown as removable chips

### CountryPicker
- Searchable modal with country list + flag emojis
- Returns ISO code + name

### CurrencyPicker
- USD, GBP, EUR, NGN selector

### FilePicker
- Wraps Expo Document Picker + Image Picker
- Uploads to Cloudinary, returns URL
- Shows upload progress
- Supports: images, PDF, ZIP
- Max size: 5MB (enforced)

### DatePicker
- Wraps `@react-native-community/datetimepicker`
- Shows formatted date
- Min date: tomorrow (for project deadlines)

---

## Utility Functions (`utils/`)

```typescript
// utils/format.ts

export function formatCurrency(amount: number, currency = 'USD'): string
// → "$1,200.00" | "₦450,000"

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string
// → "Apr 16, 2026"

export function formatRelativeTime(date: string | Date): string
// → "2 hours ago" | "just now" | "3 days ago"

export function formatDeadline(date: string | Date): string
// → "3 days left" | "Due tomorrow" | "Overdue" (red)

export function truncate(text: string, maxLength: number): string
// → "This is a long des..."
```

```typescript
// utils/color.ts

export function getSkillLevelColor(level: string): string
// beginner → green, intermediate → blue, advanced → orange, expert → gold

export function getStatusColor(status: string): string
// open → green, in_progress → blue, disputed → red, etc.

export function getEscrowStatusColor(status: string): string
```

```typescript
// utils/validation.ts

export function isValidEmail(email: string): boolean
export function isValidOTP(otp: string): boolean   // 6 digits
export function isValidBudget(value: string): boolean
export function isValidURL(url: string): boolean
```

```typescript
// utils/token.ts

export function decodeJWT(token: string): JWTPayload
export function isTokenExpired(token: string): boolean
export function getTokenExpiry(token: string): Date
```

```typescript
// utils/cloudinary.ts

export async function uploadToCloudinary(
  uri: string,
  folder: string
): Promise<string>
// Uploads file to Cloudinary, returns secure_url
```

---

## Custom Hooks (`hooks/`)

```typescript
hooks/
├── useAuth.ts           // shortcut to authStore + derived helpers
├── useProjects.ts       // Apollo queries for projects list + polling
├── useProject.ts        // Single project detail + actions
├── useNotifications.ts  // notification store + mark-read actions
├── useChat.ts           // Socket.IO chat for a room
├── useSkillTest.ts      // Assessment session management
├── usePortfolio.ts      // Portfolio items for current user
├── useEscrow.ts         // Escrow + payment actions
├── useRatings.ts        // Submit + fetch ratings
├── useDebounce.ts       // Debounce search input
├── useRefreshOnFocus.ts // Re-fetch Apollo query when screen focused
└── useKeyboardAvoid.ts  // Animated keyboard avoidance for chat
```

### useAuth
```typescript
export function useAuth() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const isStudent = user?.accountType === 'student';
  const isBusiness = user?.accountType === 'business';
  const isVerified = user?.isVerified ?? false;
  return { user, isAuthenticated, isStudent, isBusiness, isVerified, logout };
}
```

### useDebounce
```typescript
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

### useRefreshOnFocus
```typescript
export function useRefreshOnFocus(refetch: () => void) {
  const focused = useIsFocused();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (focused) refetch();
  }, [focused]);
}
```
