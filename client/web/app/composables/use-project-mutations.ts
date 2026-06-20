import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { projectsApi } from '~/lib/projects-api'
import type { CreateProjectInput } from '~/types/project'

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myProjects'] }),
  })
}

export function useCancelProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.cancel(id),
    onSuccess: (_p, id) => {
      qc.invalidateQueries({ queryKey: ['myProjects'] })
      qc.invalidateQueries({ queryKey: ['project', id] })
    },
  })
}

export function useSelectStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { projectId: string; studentId: string }) =>
      projectsApi.selectStudent(vars.projectId, vars.studentId),
    onSuccess: (_p, vars) => {
      qc.invalidateQueries({ queryKey: ['myProjects'] })
      qc.invalidateQueries({ queryKey: ['project', vars.projectId] })
      qc.invalidateQueries({ queryKey: ['projectApplications', vars.projectId] })
    },
  })
}

export function useApplyToProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { projectId: string; coverNote: string }) =>
      projectsApi.apply(vars.projectId, vars.coverNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myApplications'] }),
  })
}

export function useWithdrawApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (applicationId: string) => projectsApi.withdraw(applicationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myApplications'] }),
  })
}
