/**
 * Hosted-URL pointers for the Terms of Service and Privacy Policy. Rendered
 * in a WebView from the Settings screen so legal copy can change without
 * cutting a new app build (a Google Play Store submission requirement).
 *
 * TODO(launch): Replace these placeholders with the production URLs before
 * the first Play Console submission. The reference for which URL is current
 * lives in the memory bank at `project_queenskilla_legal_assets.md` (created
 * once the URLs are finalized).
 */
export const LEGAL_URLS = {
  terms:   'https://queenskilla.app/terms',
  privacy: 'https://queenskilla.app/privacy',
} as const;

export const SUPPORT_EMAIL = 'support@queenskilla.app';
