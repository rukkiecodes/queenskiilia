import { gqlFetch } from './graphql-client';

export type ProjectStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type Project = {
  id: string;
  businessId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  skillLevel: SkillLevel;
  budget: number;
  currency: string;
  deadline: string; // ISO date
  status: ProjectStatus;
  selectedStudent: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Application = {
  id: string;
  projectId: string;
  studentId: string;
  coverNote: string | null;
  status: ApplicationStatus;
  appliedAt: string;
};

const PROJECT_FRAGMENT = `
  id
  businessId
  title
  description
  requiredSkills
  skillLevel
  budget
  currency
  deadline
  status
  selectedStudent
  createdAt
  updatedAt
`;

const APPLICATION_FRAGMENT = `
  id
  projectId
  studentId
  coverNote
  status
  appliedAt
`;

const LIST_PROJECTS = `
  query Projects(
    $status: String
    $search: String
    $skillLevel: String
    $budgetMin: Float
    $budgetMax: Float
    $sortBy: String
    $limit: Int
    $offset: Int
  ) {
    projects(
      status: $status
      search: $search
      skillLevel: $skillLevel
      budgetMin: $budgetMin
      budgetMax: $budgetMax
      sortBy: $sortBy
      limit: $limit
      offset: $offset
    ) { ${PROJECT_FRAGMENT} }
  }
`;

const GET_PROJECT = `
  query Project($id: ID!) {
    project(id: $id) { ${PROJECT_FRAGMENT} }
  }
`;

const APPLY_TO_PROJECT = `
  mutation ApplyToProject($input: ApplyInput!) {
    applyToProject(input: $input) { ${APPLICATION_FRAGMENT} }
  }
`;

const MY_APPLICATIONS = `
  query MyApplications {
    myApplications { ${APPLICATION_FRAGMENT} }
  }
`;

const WITHDRAW_APPLICATION = `
  mutation WithdrawApplication($id: ID!) {
    withdrawApplication(applicationId: $id) { ${APPLICATION_FRAGMENT} }
  }
`;

const CREATE_PROJECT = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) { ${PROJECT_FRAGMENT} }
  }
`;

const CANCEL_PROJECT = `
  mutation CancelProject($id: ID!) {
    cancelProject(id: $id) { ${PROJECT_FRAGMENT} }
  }
`;

const SELECT_STUDENT = `
  mutation SelectStudent($projectId: ID!, $studentId: ID!) {
    selectStudent(projectId: $projectId, studentId: $studentId) { ${PROJECT_FRAGMENT} }
  }
`;

const MY_PROJECTS = `
  query MyProjects {
    myProjects { ${PROJECT_FRAGMENT} }
  }
`;

const PROJECT_APPLICATIONS = `
  query ProjectApplications($projectId: ID!) {
    projectApplications(projectId: $projectId) { ${APPLICATION_FRAGMENT} }
  }
`;

export type CreateProjectInput = {
  title: string;
  description: string;
  requiredSkills: string[];
  skillLevel: SkillLevel;
  budget: number;
  currency: string;
  deadline: string; // ISO
};

export type SortBy = 'latest' | 'budget_high' | 'budget_low' | 'deadline_soon';

export type ListProjectsArgs = {
  status?: ProjectStatus;
  search?: string;
  skillLevel?: SkillLevel;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: SortBy;
  limit?: number;
  offset?: number;
};

export const projectsApi = {
  list: ({
    status,
    search,
    skillLevel,
    budgetMin,
    budgetMax,
    sortBy,
    limit = 20,
    offset = 0,
  }: ListProjectsArgs = {}) =>
    gqlFetch<{ projects: Project[] }>(LIST_PROJECTS, {
      status,
      search,
      skillLevel,
      budgetMin,
      budgetMax,
      sortBy,
      limit,
      offset,
    }).then((r) => r.projects),

  get: (id: string) =>
    gqlFetch<{ project: Project | null }>(GET_PROJECT, { id }).then((r) => r.project),

  apply: (projectId: string, coverNote: string) =>
    gqlFetch<{ applyToProject: Application }>(APPLY_TO_PROJECT, {
      input: { projectId, coverNote },
    }).then((r) => r.applyToProject),

  myApplications: () =>
    gqlFetch<{ myApplications: Application[] }>(MY_APPLICATIONS).then(
      (r) => r.myApplications,
    ),

  withdraw: (applicationId: string) =>
    gqlFetch<{ withdrawApplication: Application }>(WITHDRAW_APPLICATION, {
      id: applicationId,
    }).then((r) => r.withdrawApplication),

  create: (input: CreateProjectInput) =>
    gqlFetch<{ createProject: Project }>(CREATE_PROJECT, { input }).then(
      (r) => r.createProject,
    ),

  cancel: (id: string) =>
    gqlFetch<{ cancelProject: Project }>(CANCEL_PROJECT, { id }).then(
      (r) => r.cancelProject,
    ),

  selectStudent: (projectId: string, studentId: string) =>
    gqlFetch<{ selectStudent: Project }>(SELECT_STUDENT, { projectId, studentId }).then(
      (r) => r.selectStudent,
    ),

  myProjects: () =>
    gqlFetch<{ myProjects: Project[] }>(MY_PROJECTS).then((r) => r.myProjects),

  applicationsFor: (projectId: string) =>
    gqlFetch<{ projectApplications: Application[] }>(PROJECT_APPLICATIONS, {
      projectId,
    }).then((r) => r.projectApplications),
};
