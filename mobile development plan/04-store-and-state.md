# State Management — Zustand Stores + TanStack Query

All global state lives in Zustand stores.
Sensitive data (tokens, user) uses Expo SecureStore via `lib/token-storage.ts`.
Server state (projects, notifications) is managed by TanStack Query — NOT stored in Zustand.

---

## Store List

| Store | Purpose |
|---|---|
| `auth-store` | User identity, tokens, login/logout, hydration |
| `notification-store` | Real-time notification list + unread count (Socket.IO pushes here) |
| `chat-store` | Socket.IO connection state + real-time messages |
| `ui-store` | Toast messages, global loading overlay |

> `project-store` is NOT needed — TanStack Query caches project data automatically.

---

## Auth Store (see 02-auth-flow.md for full code)

Key state: `user`, `accessToken`, `isAuthenticated`, `isLoading`
Key actions: `setAuth`, `refreshAccessToken`, `logout`, `hydrate`

---

## Notification Store

```typescript
// store/notification-store.ts

import { create } from 'zustand';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;   // called from Socket.IO
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
```

---

## Chat Store

```typescript
// store/chat-store.ts

import { create } from 'zustand';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  attachmentUrls: string[];
  isRead: boolean;
  sentAt: string;
}

interface ChatState {
  activeChat: string | null;                        // chatId
  messages: Record<string, Message[]>;              // chatId → messages[]
  connected: boolean;

  setActiveChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setConnected: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  messages: {},
  connected: false,

  setActiveChat: (chatId) => set({ activeChat: chatId }),

  addMessage: (chatId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] ?? []), message],
      },
    })),

  setMessages: (chatId, messages) =>
    set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),

  setConnected: (connected) => set({ connected }),
}));
```

---

## UI Store

```typescript
// store/ui-store.ts

import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface UIState {
  toasts: Toast[];
  globalLoading: boolean;

  showToast: (type: Toast['type'], message: string) => void;
  hideToast: (id: string) => void;
  setGlobalLoading: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  globalLoading: false,

  showToast: (type, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now().toString(), type, message }],
    })),

  hideToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setGlobalLoading: (globalLoading) => set({ globalLoading }),
}));
```

---

## TanStack Query Setup

TanStack Query replaces Apollo Client for all GraphQL data fetching.
Wrap the root layout with `QueryClientProvider` (see 02-auth-flow.md).

```typescript
// lib/graphql-client.ts

import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth-store';

const GQL_URL = `${process.env.EXPO_PUBLIC_API_URL}/graphql`;

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = await SecureStore.getItemAsync('qs_access_token');

  const response = await fetch(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  // Handle UNAUTHENTICATED → refresh once
  if (json.errors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === 'UNAUTHENTICATED')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = useAuthStore
        .getState()
        .refreshAccessToken()
        .finally(() => { isRefreshing = false; refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) return gqlFetch<T>(query, variables);
    throw new Error('Session expired');
  }

  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}
```

### Query Pattern

```typescript
// hooks/use-projects.ts

import { useQuery } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import { PROJECTS_QUERY } from '../graphql/project-queries';

export function useProjects(filters?: { status?: string; skillLevel?: string }) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => gqlFetch<{ projects: Project[] }>(PROJECTS_QUERY, filters),
    select: (data) => data.projects,
    staleTime: 1000 * 60 * 2,   // 2 min
  });
}
```

### Mutation Pattern

```typescript
// hooks/use-apply-to-project.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import { APPLY_TO_PROJECT_MUTATION } from '../graphql/project-mutations';

export function useApplyToProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { projectId: string; coverNote: string }) =>
      gqlFetch(APPLY_TO_PROJECT_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}
```

---

## Socket.IO Setup (Real-time)

```typescript
// lib/socket-client.ts

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useNotificationStore } from '../store/notification-store';
import { useChatStore } from '../store/chat-store';

let socket: Socket | null = null;

export async function connectSocket() {
  const token = await SecureStore.getItemAsync('qs_access_token');
  if (!token || socket?.connected) return;

  socket = io(process.env.EXPO_PUBLIC_API_URL!, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => useChatStore.getState().setConnected(true));
  socket.on('disconnect', () => useChatStore.getState().setConnected(false));

  socket.on('notification:new', (notification) => {
    useNotificationStore.getState().addNotification(notification);
  });

  socket.on('message:new', ({ chatId, message }) => {
    useChatStore.getState().addMessage(chatId, message);
  });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinRoom(room: string) {
  socket?.emit('join', room);
}

export function sendSocketMessage(
  chatId: string,
  content: string,
  attachmentUrls: string[] = []
) {
  socket?.emit('message:send', { chatId, content, attachmentUrls });
}
```
