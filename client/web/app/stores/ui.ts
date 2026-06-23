import { defineStore, skipHydrate } from 'pinia'
import type { NotifyOptions } from '@rukkiecodes/vue'

/** Shape of Fusion UI's `useNotify().notify` (imperative toast fn + variants). */
type FusionNotify = ((o: NotifyOptions) => void) & {
  success: (o: NotifyOptions) => void
  error: (o: NotifyOptions) => void
  warning: (o: NotifyOptions) => void
  info: (o: NotifyOptions) => void
}

/**
 * Global UI state: a ref-counted loading flag and a bridge to Fusion UI's toast
 * service. The actual notifier is registered client-side (see
 * app/plugins/fusion-services.client.ts) so the store stays free of any Fusion
 * import at module load and remains SSR-safe. The bridge lets non-component code
 * (stores, gqlFetch error handling, composables) raise toasts.
 */
export const useUiStore = defineStore('ui', () => {
  const _loadingCount = ref(0)
  const globalLoading = computed(() => _loadingCount.value > 0)

  // Non-serializable (a function) and client-only → skipHydrate.
  const _notifier = skipHydrate(shallowRef<FusionNotify | null>(null))

  function startLoading() {
    _loadingCount.value++
  }
  function stopLoading() {
    _loadingCount.value = Math.max(0, _loadingCount.value - 1)
  }
  function resetLoading() {
    _loadingCount.value = 0
  }

  function registerNotifier(fn: FusionNotify) {
    _notifier.value = fn
  }

  function notify(o: NotifyOptions) {
    _notifier.value?.(o)
  }
  function success(o: NotifyOptions) {
    _notifier.value?.success(o)
  }
  function error(o: NotifyOptions) {
    _notifier.value?.error(o)
  }
  function warning(o: NotifyOptions) {
    _notifier.value?.warning(o)
  }
  function info(o: NotifyOptions) {
    _notifier.value?.info(o)
  }

  return {
    _loadingCount,
    globalLoading,
    _notifier,
    startLoading,
    stopLoading,
    resetLoading,
    registerNotifier,
    notify,
    success,
    error,
    warning,
    info,
  }
})
