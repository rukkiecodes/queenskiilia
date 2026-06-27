import { gqlFetch } from '~/lib/graphql-client'
import type { Application, CreateProjectInput, ListProjectsArgs, Project } from '~/types/project'

// Operation strings ported from client/mobile/lib/projects-api.ts.
const PROJECT_FRAGMENT = `
  id businessId title description requiredSkills skillLevel
  budget currency thumbnailUrl durationDays deadline status selectedStudent createdAt updatedAt
  business { id fullName avatarUrl businessProfile { companyName } }
`
// Detail view also pulls the full client sub-profile (cover, ratings, company).
const PROJECT_DETAIL_FRAGMENT = `
  id businessId title description requiredSkills skillLevel
  budget currency thumbnailUrl durationDays deadline status selectedStudent createdAt updatedAt
  business {
    id fullName avatarUrl country isVerified verifiedBadge createdAt
    businessProfile {
      companyName website industry country description totalProjectsPosted averageRating
    }
  }
`
const APPLICATION_FRAGMENT = `id projectId studentId coverNote status appliedAt`

const LIST_PROJECTS = `
  query Projects(
    $status: String, $search: String, $skillLevel: String, $budgetMin: Float,
    $budgetMax: Float, $sortBy: String, $limit: Int, $offset: Int
  ) {
    projects(
      status: $status, search: $search, skillLevel: $skillLevel, budgetMin: $budgetMin,
      budgetMax: $budgetMax, sortBy: $sortBy, limit: $limit, offset: $offset
    ) { ${PROJECT_FRAGMENT} }
  }
`
const GET_PROJECT = `query Project($id: ID!) { project(id: $id) { ${PROJECT_DETAIL_FRAGMENT} } }`
const APPLY_TO_PROJECT = `mutation ApplyToProject($input: ApplyInput!) { applyToProject(input: $input) { ${APPLICATION_FRAGMENT} } }`
const MY_APPLICATIONS = `query MyApplications { myApplications { ${APPLICATION_FRAGMENT} } }`
const WITHDRAW_APPLICATION = `mutation WithdrawApplication($id: ID!) { withdrawApplication(applicationId: $id) { ${APPLICATION_FRAGMENT} } }`
const CREATE_PROJECT = `mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { ${PROJECT_FRAGMENT} } }`
const CANCEL_PROJECT = `mutation CancelProject($id: ID!) { cancelProject(id: $id) { ${PROJECT_FRAGMENT} } }`
const SELECT_STUDENT = `mutation SelectStudent($projectId: ID!, $studentId: ID!) { selectStudent(projectId: $projectId, studentId: $studentId) { ${PROJECT_FRAGMENT} } }`
const MY_PROJECTS = `query MyProjects { myProjects { ${PROJECT_FRAGMENT} } }`
const PROJECT_APPLICATIONS = `query ProjectApplications($projectId: ID!) { projectApplications(projectId: $projectId) { ${APPLICATION_FRAGMENT} } }`

export const projectsApi = {
  list: (args: ListProjectsArgs = {}) => {
    const { limit = 20, offset = 0, ...rest } = args
    return gqlFetch<{ projects: Project[] }>(LIST_PROJECTS, { ...rest, limit, offset }).then(
      (r) => r.projects,
    )
  },

  get: (id: string) => gqlFetch<{ project: Project | null }>(GET_PROJECT, { id }).then((r) => r.project),

  apply: (projectId: string, coverNote: string) =>
    gqlFetch<{ applyToProject: Application }>(APPLY_TO_PROJECT, {
      input: { projectId, coverNote: coverNote || null },
    }).then((r) => r.applyToProject),

  myApplications: () =>
    gqlFetch<{ myApplications: Application[] }>(MY_APPLICATIONS).then((r) => r.myApplications),

  withdraw: (applicationId: string) =>
    gqlFetch<{ withdrawApplication: Application }>(WITHDRAW_APPLICATION, { id: applicationId }).then(
      (r) => r.withdrawApplication,
    ),

  create: (input: CreateProjectInput) =>
    gqlFetch<{ createProject: Project }>(CREATE_PROJECT, { input }).then((r) => r.createProject),

  cancel: (id: string) =>
    gqlFetch<{ cancelProject: Project }>(CANCEL_PROJECT, { id }).then((r) => r.cancelProject),

  selectStudent: (projectId: string, studentId: string) =>
    gqlFetch<{ selectStudent: Project }>(SELECT_STUDENT, { projectId, studentId }).then(
      (r) => r.selectStudent,
    ),

  myProjects: () => gqlFetch<{ myProjects: Project[] }>(MY_PROJECTS).then((r) => r.myProjects),

  applicationsFor: (projectId: string) =>
    gqlFetch<{ projectApplications: Application[] }>(PROJECT_APPLICATIONS, { projectId }).then(
      (r) => r.projectApplications,
    ),
}
