import { adminGqlFetch } from '~/lib/admin-api'

// Typed wrappers over the admin-only GraphQL queries (Phase 2 data layer).

export interface AdminStats {
  totalUsers: number
  students: number
  businesses: number
  verifiedUsers: number
  pendingVerifications: number
  totalProjects: number
  openProjects: number
  completedProjects: number
  openDisputes: number
  pendingReports: number
  escrowHeld: number
  escrowReleased: number
}

export interface AdminUserSummary {
  id: string
  email: string
  fullName?: string | null
  accountType: string
  isVerified: boolean
  isActive: boolean
  country?: string | null
  createdAt: string
}

export interface AdminVerification {
  id: string
  userId: string
  type: string
  status: string
  documentUrl?: string | null
  adminNote?: string | null
  submittedAt: string
  reviewedAt?: string | null
  user?: AdminUserSummary | null
}

export interface AdminDispute {
  id: string
  projectId: string
  raisedBy: string
  reason: string
  status: string
  resolution?: string | null
  adminNote?: string | null
  createdAt: string
  resolvedAt?: string | null
  projectTitle?: string | null
  raiserName?: string | null
  businessName?: string | null
  studentName?: string | null
}

export interface AdminReport {
  id: string
  reporterId: string
  targetType: string
  targetId: string
  reason: string
  details?: string | null
  status: string
  adminNote?: string | null
  createdAt: string
  reviewedAt?: string | null
  reporterName?: string | null
  targetLabel?: string | null
}

export function fetchAdminStats() {
  return adminGqlFetch<{ adminStats: AdminStats }>(`
    query AdminStats {
      adminStats {
        totalUsers students businesses verifiedUsers pendingVerifications
        totalProjects openProjects completedProjects openDisputes pendingReports
        escrowHeld escrowReleased
      }
    }
  `).then((r) => r.adminStats)
}

export function fetchAdminVerifications(status?: string) {
  return adminGqlFetch<{ adminVerifications: AdminVerification[] }>(
    `query AdminVerifications($status: String) {
      adminVerifications(status: $status) {
        id userId type status documentUrl adminNote submittedAt reviewedAt
        user { id email fullName accountType isVerified isActive country createdAt }
      }
    }`,
    { status },
  ).then((r) => r.adminVerifications)
}

export function fetchAdminUsers(search?: string, accountType?: string) {
  return adminGqlFetch<{ adminUsers: AdminUserSummary[] }>(
    `query AdminUsers($search: String, $accountType: String) {
      adminUsers(search: $search, accountType: $accountType) {
        id email fullName accountType isVerified isActive country createdAt
      }
    }`,
    { search, accountType },
  ).then((r) => r.adminUsers)
}

export function fetchAdminDisputes(status?: string) {
  return adminGqlFetch<{ adminDisputes: AdminDispute[] }>(
    `query AdminDisputes($status: String) {
      adminDisputes(status: $status) {
        id projectId raisedBy reason status resolution adminNote createdAt resolvedAt
        projectTitle raiserName businessName studentName
      }
    }`,
    { status },
  ).then((r) => r.adminDisputes)
}

export function fetchAdminReports(status?: string) {
  return adminGqlFetch<{ adminReports: AdminReport[] }>(
    `query AdminReports($status: String) {
      adminReports(status: $status) {
        id reporterId targetType targetId reason details status adminNote createdAt reviewedAt
        reporterName targetLabel
      }
    }`,
    { status },
  ).then((r) => r.adminReports)
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function reviewVerification(id: string, decision: 'approve' | 'reject', adminNote?: string) {
  return adminGqlFetch<{ reviewVerification: AdminVerification }>(
    `mutation($id: ID!, $decision: String!, $adminNote: String) {
      reviewVerification(id: $id, decision: $decision, adminNote: $adminNote) {
        id status reviewedAt adminNote
      }
    }`,
    { id, decision, adminNote },
  ).then((r) => r.reviewVerification)
}

export function setUserActive(id: string, isActive: boolean) {
  return adminGqlFetch<{ setUserActive: AdminUserSummary }>(
    `mutation($id: ID!, $isActive: Boolean!) {
      setUserActive(id: $id, isActive: $isActive) { id isActive }
    }`,
    { id, isActive },
  ).then((r) => r.setUserActive)
}

export function setUserVerified(id: string, isVerified: boolean) {
  return adminGqlFetch<{ setUserVerified: AdminUserSummary }>(
    `mutation($id: ID!, $isVerified: Boolean!) {
      setUserVerified(id: $id, isVerified: $isVerified) { id isVerified }
    }`,
    { id, isVerified },
  ).then((r) => r.setUserVerified)
}

export function resolveDispute(id: string, resolution: string, adminNote?: string) {
  return adminGqlFetch<{ resolveDispute: AdminDispute }>(
    `mutation($id: ID!, $resolution: String!, $adminNote: String) {
      resolveDispute(id: $id, resolution: $resolution, adminNote: $adminNote) {
        id status resolution adminNote resolvedAt
      }
    }`,
    { id, resolution, adminNote },
  ).then((r) => r.resolveDispute)
}

export function reviewReport(id: string, action: 'dismissed' | 'actioned' | 'reviewed', adminNote?: string) {
  return adminGqlFetch<{ reviewReport: AdminReport }>(
    `mutation($id: ID!, $action: String!, $adminNote: String) {
      reviewReport(id: $id, action: $action, adminNote: $adminNote) {
        id status adminNote reviewedAt
      }
    }`,
    { id, action, adminNote },
  ).then((r) => r.reviewReport)
}
