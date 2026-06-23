import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
  type DehydratedState,
} from '@tanstack/vue-query'
import { GqlError } from '~/lib/graphql-client'

/**
 * TanStack Vue Query with SSR hydration.
 *
 * Server-fetched queries are dehydrated into Nuxt payload state on `app:rendered`
 * and rehydrated on the client at `app:created`, so a query resolved during SSR
 * shows up in the initial HTML and does NOT refetch on the client.
 */
export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry GraphQL / 4xx errors; allow a couple of transient retries.
          if (error instanceof GqlError) return false
          const status = (error as { status?: number })?.status
          if (status && status >= 400 && status < 500) return false
          return failureCount < 2
        },
      },
    },
  })

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value)
    })
  }
})
