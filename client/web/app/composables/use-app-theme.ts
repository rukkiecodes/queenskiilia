import { useTheme } from '@rukkiecodes/vue'

/**
 * App-level theme control. Wraps Fusion UI's theme instance and persists the
 * choice to the `qs.theme` cookie so the next SSR render starts in the right theme.
 */
export function useAppTheme() {
  const theme = useTheme()
  const cookie = useCookie<'light' | 'dark'>('qs.theme', {
    default: () => 'light',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  // Keep the cookie in sync whenever the active theme changes.
  watch(
    () => theme.name.value,
    (name) => {
      cookie.value = name === 'dark' ? 'dark' : 'light'
    },
  )

  function toggle() {
    theme.toggle(['light', 'dark'])
  }

  function set(name: 'light' | 'dark') {
    theme.change(name)
  }

  return {
    theme,
    name: theme.name,
    isDark: theme.isDark,
    toggle,
    set,
  }
}
