import { reactive } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Style the confirm button as destructive (red). */
  danger?: boolean
}

interface ConfirmState extends Required<Omit<ConfirmOptions, 'message'>> {
  open: boolean
  message: string
  resolve: ((v: boolean) => void) | null
}

// Module-level singleton: only ever mutated on client interaction (never during
// SSR), so it's safe to share. Backed by one <ConfirmDialog> mounted in the shell.
const state = reactive<ConfirmState>({
  open: false,
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  resolve: null,
})

/** Resolve the pending promise once and clear it (guards double-resolve). */
function settle(value: boolean) {
  const r = state.resolve
  state.resolve = null
  state.open = false
  r?.(value)
}

/**
 * Promise-based confirmation backed by a Fusion UI dialog.
 *   if (await confirm({ message: 'Delete this?' })) { ... }
 */
export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // Resolve any prior pending dialog as cancelled before opening a new one.
    if (state.resolve) settle(false)
    state.title = options.title ?? 'Are you sure?'
    state.message = options.message
    state.confirmLabel = options.confirmLabel ?? 'Confirm'
    state.cancelLabel = options.cancelLabel ?? 'Cancel'
    state.danger = options.danger ?? false
    state.open = true
    return new Promise<boolean>((resolve) => {
      state.resolve = resolve
    })
  }
  return { confirm }
}

/** Internal — used by <ConfirmDialog> to read/drive the shared state. */
export function useConfirmState() {
  return { state, settle }
}
