import { useTheme } from '@rukkiecodes/vue'

/**
 * App-level theme control. Wraps Fusion UI's theme instance and persists the
 * choice to the `qs.theme` cookie so the next SSR render starts in the right theme.
 */
export function useAppTheme() {
  const theme = useTheme()
  // No default — only written once the user explicitly picks a theme, so an
  // unset cookie keeps following the OS preference.
  const cookie = useCookie<'light' | 'dark' | null>('qs.theme', {
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
