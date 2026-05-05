# GraphQL Queries & Mutations — Mobile Client

All GraphQL goes through the Apollo Gateway at `{EXPO_PUBLIC_API_URL}/graphql`.

On mobile we use **TanStack Query + native fetch** (no Apollo Client).
Each query/mutation is a plain string constant + a typed hook that wraps `gqlFetch`.

Reference: `lib/graphql-client.ts` for `gqlFetch` implementation (see 04-store-and-state.md).

---

## Fragments (graphql/fragments.ts)

```typescript
export const USER_CORE = `
  fragment UserCore on User {
    id email accountType fullName avatarUrl
    isVerified verifiedBadge isActive
  }
`;

export const PROJECT_CORE = `
  fragment ProjectCore on Project {
    id title description requiredSkills skillLevel
    budget currency deadline status createdAt
    businessId selectedStudent
  }
`;

export const MESSAGE_CORE = `
  fragment MessageCore on Message {
    id chatId senderId content attachmentUrls isRead sentAt
  }
`;

export const NOTIFICATION_CORE = `
  fragment NotificationCore on Notification {
    id userId type title body isRead metadata createdAt
  }
`;
```

---

## Auth / User (graphql/user-queries.ts)

```typescript
export const ME_QUERY = `
  query Me {
    me {
      ...UserCore
      studentProfile { bio university graduationYear skills skillLevel totalEarnings averageRating }
      businessProfile { companyName website industry country totalProjectsPosted averageRating }
      verifications { type status adminNote }
    }
  }
  ${USER_CORE}
`;

export const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserCore
      studentProfile { skills skillLevel averageRating totalEarnings }
      businessProfile { companyName industry averageRating }
    }
  }
  ${USER_CORE}
`;
```

```typescript
// hooks/use-me.ts
import { useQuery } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import { ME_QUERY } from '../graphql/user-queries';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => gqlFetch<{ me: User }>(ME_QUERY),
    select: (d) => d.me,
  });
}
```

---

## Project Queries & Mutations (graphql/project-queries.ts)

```typescript
export const PROJECTS_QUERY = `
  query Projects($status: String, $skillLevel: String, $limit: Int, $offset: Int) {
    projects(status: $status, skillLevel: $skillLevel, limit: $limit, offset: $offset) {
      ...ProjectCore
    }
  }
  ${PROJECT_CORE}
`;

export const PROJECT_QUERY = `
  query Project($id: ID!) {
    project(id: $id) { ...ProjectCore }
  }
  ${PROJECT_CORE}
`;

export const MY_PROJECTS_QUERY = `
  query MyProjects {
    myProjects { ...ProjectCore }
  }
  ${PROJECT_CORE}
`;

export const PROJECT_APPLICATIONS_QUERY = `
  query ProjectApplications($projectId: ID!) {
    projectApplications(projectId: $projectId) {
      id projectId studentId coverNote status appliedAt
    }
  }
`;

export const MY_APPLICATIONS_QUERY = `
  query MyApplications {
    myApplications { id projectId status appliedAt coverNote }
  }
`;
```

```typescript
// graphql/project-mutations.ts

export const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) { ...ProjectCore }
  }
  ${PROJECT_CORE}
`;

export const APPLY_TO_PROJECT_MUTATION = `
  mutation ApplyToProject($input: ApplyInput!) {
    applyToProject(input: $input) { id projectId status }
  }
`;

export const SELECT_STUDENT_MUTATION = `
  mutation SelectStudent($projectId: ID!, $studentId: ID!) {
    selectStudent(projectId: $projectId, studentId: $studentId) {
      id status selectedStudent
    }
  }
`;

export const SUBMIT_WORK_MUTATION = `
  mutation SubmitWork($input: SubmitWorkInput!) {
    submitWork(input: $input) { id status submittedAt }
  }
`;

export const REVIEW_SUBMISSION_MUTATION = `
  mutation ReviewSubmission($projectId: ID!, $approve: Boolean!, $feedback: String) {
    reviewSubmission(projectId: $projectId, approve: $approve, feedback: $feedback) {
      id status feedback reviewedAt
    }
  }
`;

export const WITHDRAW_APPLICATION_MUTATION = `
  mutation WithdrawApplication($applicationId: ID!) {
    withdrawApplication(applicationId: $applicationId) { id status }
  }
`;

export const CANCEL_PROJECT_MUTATION = `
  mutation CancelProject($id: ID!) {
    cancelProject(id: $id) { id status }
  }
`;
```

```typescript
// hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import * as Q from '../graphql/project-queries';
import * as M from '../graphql/project-mutations';

export function useProjects(filters?: { status?: string; skillLevel?: string }) {
  return useInfiniteQuery({
    queryKey: ['projects', filters],
    queryFn: ({ pageParam = 0 }) =>
      gqlFetch<{ projects: Project[] }>(Q.PROJECTS_QUERY, { ...filters, limit: 20, offset: pageParam }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.projects.length === 20 ? pages.length * 20 : undefined,
    select: (data) => data.pages.flatMap((p) => p.projects),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => gqlFetch<{ project: Project }>(Q.PROJECT_QUERY, { id }),
    select: (d) => d.project,
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: () => gqlFetch<{ myProjects: Project[] }>(Q.MY_PROJECTS_QUERY),
    select: (d) => d.myProjects,
  });
}

export function useApplyToProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; coverNote: string }) =>
      gqlFetch(M.APPLY_TO_PROJECT_MUTATION, { input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => gqlFetch(M.CREATE_PROJECT_MUTATION, { input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-projects'] }),
  });
}
```

---

## Skills Queries & Mutations (graphql/skill-queries.ts)

```typescript
export const SKILL_CATEGORIES_QUERY = `
  query SkillCategories {
    skillCategories { id name parentCategory skills }
  }
`;

export const MY_ASSESSMENTS_QUERY = `
  query MyAssessments {
    myAssessments { id category level score completedAt }
  }
`;

export const ACTIVE_SESSION_QUERY = `
  query ActiveAssessmentSession {
    activeAssessmentSession { id category questions status startedAt expiresAt }
  }
`;

export const START_ASSESSMENT_MUTATION = `
  mutation StartAssessment($category: String!, $level: String!) {
    startAssessment(category: $category, level: $level) {
      id questions { index text options } expiresAt
    }
  }
`;

export const SUBMIT_ASSESSMENT_MUTATION = `
  mutation SubmitAssessment($sessionId: ID!, $answers: [AnswerInput!]!) {
    submitAssessment(sessionId: $sessionId, answers: $answers) {
      id category level score completedAt
    }
  }
`;
```

---

## Portfolio (graphql/portfolio-queries.ts)

```typescript
export const MY_PORTFOLIO_QUERY = `
  query MyPortfolio {
    myPortfolio {
      id projectTitle businessName description skills fileUrls
      clientRating clientReview isPublic completedAt
    }
  }
`;

export const STUDENT_PORTFOLIO_QUERY = `
  query StudentPortfolio($studentId: ID!) {
    studentPortfolio(studentId: $studentId) {
      id projectTitle businessName skills clientRating isPublic completedAt
    }
  }
`;

export const UPDATE_PORTFOLIO_VISIBILITY_MUTATION = `
  mutation UpdatePortfolioItemVisibility($id: ID!, $isPublic: Boolean!) {
    updatePortfolioItemVisibility(id: $id, isPublic: $isPublic) { id isPublic }
  }
`;
```

---

## Notifications (graphql/notification-queries.ts)

```typescript
export const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications($unreadOnly: Boolean, $limit: Int, $offset: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) {
      ...NotificationCore
    }
  }
  ${NOTIFICATION_CORE}
`;

export const UNREAD_COUNT_QUERY = `
  query UnreadCount { unreadCount }
`;

export const MARK_AS_READ_MUTATION = `
  mutation MarkAsRead($id: ID!) {
    markAsRead(id: $id) { id isRead }
  }
`;

export const MARK_ALL_AS_READ_MUTATION = `
  mutation MarkAllAsRead { markAllAsRead }
`;
```

```typescript
// hooks/use-notifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import { useNotificationStore } from '../store/notification-store';
import * as Q from '../graphql/notification-queries';

export function useNotifications() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => gqlFetch<{ myNotifications: Notification[] }>(Q.MY_NOTIFICATIONS_QUERY, { limit: 50 }),
    select: (d) => d.myNotifications,
    onSuccess: (data) => setNotifications(data),
  });
}

export function useMarkAllRead() {
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gqlFetch(Q.MARK_ALL_AS_READ_MUTATION),
    onSuccess: () => {
      markAllRead();
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
```

---

## Chat (graphql/chat-queries.ts)

```typescript
export const CHAT_QUERY = `
  query Chat($projectId: ID!) {
    chat(projectId: $projectId) { id projectId studentId businessId createdAt }
  }
`;

export const CHAT_MESSAGES_QUERY = `
  query ChatMessages($chatId: ID!, $limit: Int, $offset: Int) {
    chatMessages(chatId: $chatId, limit: $limit, offset: $offset) {
      ...MessageCore
    }
  }
  ${MESSAGE_CORE}
`;

export const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) { ...MessageCore }
  }
  ${MESSAGE_CORE}
`;

export const MARK_MESSAGES_READ_MUTATION = `
  mutation MarkMessagesRead($chatId: ID!) {
    markMessagesRead(chatId: $chatId)
  }
`;
```

---

## Payment & Escrow (graphql/payment-queries.ts)

```typescript
export const MY_ESCROWS_QUERY = `
  query MyEscrows {
    myEscrows { id projectId amount currency gateway status platformFee createdAt releasedAt }
  }
`;

export const INITIATE_ESCROW_MUTATION = `
  mutation InitiateEscrow($input: InitiateEscrowInput!) {
    initiateEscrow(input: $input) { id amount currency gateway status }
  }
`;

export const INITIALIZE_PAYMENT_MUTATION = `
  mutation InitializePayment($input: InitializePaymentInput!) {
    initializePayment(input: $input) { authorizationUrl accessCode reference }
  }
`;

export const RELEASE_FUNDS_MUTATION = `
  mutation ReleaseFunds($projectId: ID!) {
    releaseFunds(projectId: $projectId) { id status releasedAt }
  }
`;
```

```typescript
// hooks/use-escrow.ts — Paystack payment flow
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlFetch } from '../lib/graphql-client';
import * as M from '../graphql/payment-queries';

export function useInitializePayment() {
  return useMutation({
    mutationFn: (input: { projectId: string; amount: number; currency: string }) =>
      gqlFetch<{ initializePayment: { authorizationUrl: string; reference: string } }>(
        M.INITIALIZE_PAYMENT_MUTATION,
        { input }
      ),
    // After mutation: open authorizationUrl in react-native-webview
    // On WebView redirect to callback URL: verify payment reference
  });
}

export function useReleaseFunds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => gqlFetch(M.RELEASE_FUNDS_MUTATION, { projectId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-escrows'] }),
  });
}
```

---

## Ratings & Disputes (graphql/rating-queries.ts)

```typescript
export const USER_RATINGS_QUERY = `
  query UserRatings($userId: ID!) {
    userRatings(userId: $userId) {
      id reviewerType quality communication speed professionalism
      paymentFairness clarity respect comment createdAt
    }
  }
`;

export const SUBMIT_RATING_MUTATION = `
  mutation SubmitRating($input: SubmitRatingInput!) {
    submitRating(input: $input) { id createdAt }
  }
`;

export const PROJECT_DISPUTE_QUERY = `
  query ProjectDispute($projectId: ID!) {
    projectDispute(projectId: $projectId) {
      id reason status resolution adminNote createdAt resolvedAt
    }
  }
`;

export const RAISE_DISPUTE_MUTATION = `
  mutation RaiseDispute($input: RaiseDisputeInput!) {
    raiseDispute(input: $input) { id status createdAt }
  }
`;
```
