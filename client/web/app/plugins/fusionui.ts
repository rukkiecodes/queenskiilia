import { createFusionUI } from '@rukkiecodes/vue'
import { fusionSet, fusionAliases } from '@rukkiecodes/icons'
import { brandThemes } from '~/theme/brand-themes'

/**
 * Registers Fusion UI (components, directives, services, theme, icons) globally.
 *
 * The active theme is read from the `qs.theme` cookie so SSR and the client agree
 * on light/dark from the first render (no flash, no hydration mismatch). Brand
 * colors live in `brandThemes`; structural styles come from `@rukkiecodes/vue/styles`
 * + `~/assets/css/brand.css`, both registered in nuxt.config `css`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // No hard default — an unset cookie means "follow the OS preference".
  const themeCookie = useCookie<'light' | 'dark' | null>('qs.theme', {
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  // Saved choice wins; otherwise start in the system theme (client) / light (SSR).
  const systemDark =
    import.meta.client && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const initialTheme = themeCookie.value ?? (systemDark ? 'dark' : 'light')

  const fusion = createFusionUI({
    ssr: true,
    theme: {
      defaultTheme: initialTheme,
      themes: brandThemes,
    },
    icons: {
      defaultSet: 'fusion',
      sets: { fusion: fusionSet },
      aliases: fusionAliases,
    },
  })

  nuxtApp.vueApp.use(fusion)
})
