import type { ThemeDefinition } from '@rukkiecodes/vue'

/**
 * QueenSkiilia brand themes for Fusion UI.
 *
 * These are the library's built-in `light`/`dark` themes with one brand change:
 * `primary` is mapped to Action Blue (#0066cc) — the single interactive color
 * carried forward from the mobile Apple design language (client/mobile/DESIGN.md).
 *
 * Everything else (surfaces, semantic colors, emphasis/opacity variables) keeps
 * Fusion UI's defaults so component contrast + states stay correct.
 *
 * NOTE: `primary` MUST be branded here (not in CSS). The theme engine writes the
 * active theme's colors inline onto <html>, which beats any :root stylesheet rule.
 */

const BRAND_PRIMARY = '#0066cc' // Action Blue

export const brandThemes: Record<string, ThemeDefinition> = {
  light: {
    dark: false,
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
      primary: BRAND_PRIMARY,
      secondary: '#7d33ff',
      success: '#46c93a',
      danger: '#ff4757',
      warning: '#ffba00',
      dark: '#1e1e1e',
      light: '#f4f7f8',
      'on-background': '#2c3e50',
      'on-surface': '#2c3e50',
      'on-primary': '#ffffff',
      'on-secondary': '#ffffff',
      'on-success': '#ffffff',
      'on-danger': '#ffffff',
      'on-warning': '#1e1e1e',
      'on-light': '#2c3e50',
    },
    variables: {
      'border-color': '#2c3e50',
      'border-opacity': 0.12,
      'high-emphasis-opacity': 0.92,
      'medium-emphasis-opacity': 0.6,
      'disabled-opacity': 0.38,
      'surface-2': '#f4f7f8',
      'surface-3': '#f0f3f4',
      'shadow-rest': '0 5px 20px 0 rgba(0, 0, 0, 0.05)',
    },
  },
  dark: {
    dark: true,
    colors: {
      background: '#1e2023',
      surface: '#26282c',
      primary: BRAND_PRIMARY,
      secondary: '#9b6bff',
      success: '#46c93a',
      danger: '#ff4757',
      warning: '#ffba00',
      dark: '#f4f7f8',
      light: '#2a2c30',
      'on-background': '#ffffff',
      'on-surface': '#ffffff',
      'on-primary': '#ffffff',
      'on-secondary': '#ffffff',
      'on-success': '#ffffff',
      'on-danger': '#ffffff',
      'on-warning': '#1e1e1e',
      'on-light': '#ffffff',
    },
    variables: {
      'border-color': '#ffffff',
      'border-opacity': 0.16,
      'high-emphasis-opacity': 1,
      'medium-emphasis-opacity': 0.7,
      'disabled-opacity': 0.5,
      'surface-2': '#26282c',
      'surface-3': '#1c1e21',
      'shadow-rest': '0 5px 20px 0 rgba(0, 0, 0, 0.4)',
    },
  },
}

export type BrandThemeName = keyof typeof brandThemes
