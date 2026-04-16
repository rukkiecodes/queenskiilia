# GraphQL Queries & Mutations — Mobile Client

All GraphQL goes through the Apollo Gateway at `{MAIN_SERVER_URL}/graphql`.
Fragments are reused across queries to keep payloads lean.

---

## Fragments

```graphql
fragment UserCore on User {
  id email accountType fullName avatarUrl
  isVerified verifiedBadge isActive
}

fragment ProjectCore on Project {
  id title description requiredSkills skillLevel
  budget currency deadline status createdAt
  businessId selectedStudent
}

fragment MessageCore on Message {
  id chatId senderId content attachmentUrls isRead sentAt
}

fragment NotificationCore on Notification {
  id userId type title body isRead metadata createdAt
}
```

---

## Auth / User Queries

```graphql
# Get current user profile
query Me {
  me { ...UserCore studentProfile { bio university graduationYear skills skillLevel totalEarnings averageRating } businessProfile { companyName website industry country totalProjectsPosted averageRating } verifications { type status adminNote } }
}

# Get any user by ID (talent search / business profile)
query GetUser($id: ID!) {
  user(id: $id) { ...UserCore studentProfile { skills skillLevel averageRating totalEarnings } businessProfile { companyName industry averageRating } }
}
```

---

## Project Queries

```graphql
# Marketplace — paginated + filtered
query Projects($status: String, $skillLevel: String, $limit: Int, $offset: Int) {
  projects(status: $status, limit: $limit, offset: $offset) { ...ProjectCore }
}

# Single project detail
query Project($id: ID!) {
  project(id: $id) { ...ProjectCore }
}

# My projects (student: applied to; business: posted)
query MyProjects {
  myProjects { ...ProjectCore }
}

# Applications for a project (business view)
query ProjectApplications($projectId: ID!) {
  projectApplications(projectId: $projectId) {
    id projectId studentId coverNote status appliedAt
  }
}

# My applications (student)
query MyApplications {
  myApplications { id projectId status appliedAt coverNote }
}
```

---

## Project Mutations

```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) { ...ProjectCore }
}

mutation ApplyToProject($input: ApplyInput!) {
  applyToProject(input: $input) { id projectId status }
}

mutation SelectStudent($projectId: ID!, $studentId: ID!) {
  selectStudent(projectId: $projectId, studentId: $studentId) { id status selectedStudent }
}

mutation SubmitWork($input: SubmitWorkInput!) {
  submitWork(input: $input) { id status submittedAt }
}

mutation ReviewSubmission($projectId: ID!, $approve: Boolean!, $feedback: String) {
  reviewSubmission(projectId: $projectId, approve: $approve, feedback: $feedback) {
    id status feedback reviewedAt
  }
}

mutation WithdrawApplication($applicationId: ID!) {
  withdrawApplication(applicationId: $applicationId) { id status }
}

mutation CancelProject($id: ID!) {
  cancelProject(id: $id) { id status }
}
```

---

## Skills Queries & Mutations

```graphql
query SkillCategories {
  skillCategories { id name parentCategory skills }
}

query MyAssessments {
  myAssessments { id category level score completedAt }
}

query ActiveAssessmentSession {
  activeAssessmentSession { id category questions status startedAt expiresAt }
}

mutation StartAssessment($category: String!, $level: String!) {
  startAssessment(category: $category, level: $level) {
    id questions { index text options }
    expiresAt
  }
}

mutation SubmitAssessment($sessionId: ID!, $answers: [AnswerInput!]!) {
  submitAssessment(sessionId: $sessionId, answers: $answers) {
    id category level score completedAt
  }
}
```

---

## Portfolio Queries & Mutations

```graphql
query MyPortfolio {
  myPortfolio { id projectTitle businessName description skills fileUrls clientRating clientReview isPublic completedAt }
}

query StudentPortfolio($studentId: ID!) {
  studentPortfolio(studentId: $studentId) { id projectTitle businessName skills clientRating isPublic completedAt }
}

mutation UpdatePortfolioItemVisibility($id: ID!, $isPublic: Boolean!) {
  updatePortfolioItemVisibility(id: $id, isPublic: $isPublic) { id isPublic }
}
```

---

## Notification Queries & Mutations

```graphql
query MyNotifications($unreadOnly: Boolean, $limit: Int, $offset: Int) {
  myNotifications(unreadOnly: $unreadOnly, limit: $limit, offset: $offset) { ...NotificationCore }
}

query UnreadCount {
  unreadCount
}

mutation MarkAsRead($id: ID!) {
  markAsRead(id: $id) { id isRead }
}

mutation MarkAllAsRead {
  markAllAsRead
}
```

---

## Chat Queries & Mutations

```graphql
query Chat($projectId: ID!) {
  chat(projectId: $projectId) { id projectId studentId businessId createdAt }
}

query ChatMessages($chatId: ID!, $limit: Int, $offset: Int) {
  chatMessages(chatId: $chatId, limit: $limit, offset: $offset) { ...MessageCore }
}

mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) { ...MessageCore }
}

mutation MarkMessagesRead($chatId: ID!) {
  markMessagesRead(chatId: $chatId)
}
```

---

## Payment & Escrow Mutations

```graphql
query MyEscrows {
  myEscrows { id projectId amount currency gateway status platformFee createdAt releasedAt }
}

mutation InitiateEscrow($input: InitiateEscrowInput!) {
  initiateEscrow(input: $input) { id amount currency gateway status }
}

mutation InitializePayment($input: InitializePaymentInput!) {
  initializePayment(input: $input) { authorizationUrl accessCode reference }
}

mutation VerifyPayment($reference: String!) {
  # via paystack-service
}

mutation ReleaseFunds($projectId: ID!) {
  releaseFunds(projectId: $projectId) { id status releasedAt }
}
```

---

## Ratings Queries & Mutations

```graphql
query UserRatings($userId: ID!) {
  userRatings(userId: $userId) { id reviewerType quality communication speed professionalism paymentFairness clarity respect comment createdAt }
}

mutation SubmitRating($input: SubmitRatingInput!) {
  submitRating(input: $input) { id createdAt }
}
```

---

## Dispute Queries & Mutations

```graphql
query ProjectDispute($projectId: ID!) {
  projectDispute(projectId: $projectId) { id reason status resolution adminNote createdAt resolvedAt }
}

mutation RaiseDispute($input: RaiseDisputeInput!) {
  raiseDispute(input: $input) { id status createdAt }
}
```
