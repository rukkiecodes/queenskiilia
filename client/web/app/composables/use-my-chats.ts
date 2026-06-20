import { useQuery } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { chatApi } from '~/lib/chat-api'

export function useMyChats() {
  return useQuery({ queryKey: ['myChats'], queryFn: () => chatApi.myChats() })
}

/** The chat for a given project (to deep-link from the workspace). */
export function useChatForProject(projectId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: ['chat', computed(() => toValue(projectId))],
    queryFn: () => chatApi.forProject(toValue(projectId)),
    enabled: computed(() => !!toValue(projectId)),
  })
}
