import { useNotify } from '@rukkiecodes/vue'
import { useUiStore } from '~/stores/ui'

/**
 * Bridges Fusion UI's imperative toast service into the UI store so non-component
 * code can raise toasts via `useUiStore().notify(...)`. Client-only and deferred to
 * `app:mounted` so the notify host exists and Pinia is active.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    const ui = useUiStore()
    const { notify } = nuxtApp.vueApp.runWithContext(() => useNotify())
    ui.registerNotifier(notify)
  })
})
