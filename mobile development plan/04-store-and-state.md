# State Management — Zustand Stores

All global state lives in Zustand stores. Persistent data (user, tokens) uses Expo SecureStore.
Non-sensitive cached data (project lists, preferences) uses MMKV via zustand-mmkv-storage.

---

## Store List

| Store | Purpose |
|---|---|
| `authStore` | User identity, tokens, login/logout, hydration |
| `projectStore` | Project listings, filters, active project |
| `notificationStore` | Notifications list, unread count, real-time |
| `chatStore` | Chat rooms, messages, Socket.IO connection |
| `uiStore` | Loading states, modals, toast messages |

---

## Auth Store (see 02-auth-flow.md for full code)

Key state: `user`, `accessToken`, `isAuthenticated`, `isLoading`
Key actions: `setAuth`, `refreshAccessToken`, `logout`, `hydrate`

---

## Project Store

```typescript
// store/projectStore.ts

interface ProjectFilters {
  status?: string;
  skillLevel?: string;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  myApplications: Application[];
  myProjects: Project[];       // business: posted projects
  filters: ProjectFilters;
  pagination: { limit: number; offset: number; hasMore: boolean };

  setProjects: (projects: Project[]) => void;
  appendProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setFilters: (filters: Partial<ProjectFilters>) => void;
  resetFilters: () => void;
  updateProjectStatus: (id: string, status: string) => void;
}
```

---

## Notification Store

```typescript
// store/notificationStore.ts

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;  // called from Socket.IO
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}
```

---

## Chat Store

```typescript
// store/chatStore.ts

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;   // chatId → messages[]
  connected: boolean;

  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setConnected: (v: boolean) => void;
}
```

---

## UI Store

```typescript
// store/uiStore.ts

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
```

---

## Apollo Client Setup

```typescript
// lib/apolloClient.ts

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { TokenStorage } from './tokenStorage';
import { MAIN_SERVER_URL } from '../constants/env';

const httpLink = createHttpLink({
  uri: `${MAIN_SERVER_URL}/graphql`,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await TokenStorage.getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED') {
        useAuthStore.getState().refreshAccessToken();
      }
    });
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            keyArgs: ['status', 'skillLevel', 'search'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});
```

---

## Socket.IO Setup (Real-time)

```typescript
// lib/socketClient.ts

import { io, Socket } from 'socket.io-client';
import { MAIN_SERVER_URL } from '../constants/env';
import { TokenStorage } from './tokenStorage';
import { useNotificationStore } from '../store/notificationStore';
import { useChatStore } from '../store/chatStore';

let socket: Socket | null = null;

export async function connectSocket() {
  const token = await TokenStorage.getAccessToken();
  if (!token || socket?.connected) return;

  socket = io(MAIN_SERVER_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    useChatStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    useChatStore.getState().setConnected(false);
  });

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

export function sendMessage(chatId: string, content: string, attachmentUrls: string[] = []) {
  socket?.emit('message:send', { chatId, content, attachmentUrls });
}
```
