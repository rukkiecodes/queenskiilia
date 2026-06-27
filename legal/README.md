# Legal — Privacy Policy & Terms of Service

Static site that hosts the QueenSkiilia Privacy Policy and Terms of Service.
Deployed as its own Vercel project so legal copy can change without cutting
a new mobile app build (a Google Play Store submission requirement).

## Files

- `markdown/privacy.md` — canonical Privacy Policy source.
- `markdown/terms.md` — canonical Terms of Service source.
- `public/privacy.html` — deployable HTML rendering of the policy.
- `public/terms.html` — deployable HTML rendering of the terms.
- `public/index.html` — small landing page linking to both.

Update the markdown first, then mirror any changes into the HTML. The
HTML files are what Vercel actually serves; the markdown lives next to
them so reviewers can read a clean diff.

## Deploy (first time)

```bash
cd legal
npx vercel --prod
```

Pick a project name like `queenskilla-legal`. Note the URL Vercel hands
back (e.g., `https://queenskilla-legal.vercel.app`).

## Deploy (updates)

```bash
cd legal
npx vercel --prod
```

Cache headers in `vercel.json` are short (5 minutes) so updates take
effect for users almost immediately.

## Wire into the mobile app

Once deployed, update `client/mobile/constants/legal.ts`:

```ts
export const LEGAL_URLS = {
  terms:   'https://queenskilla-legal.vercel.app/terms.html',
  privacy: 'https://queenskilla-legal.vercel.app/privacy.html',
} as const;
```

Then create a memory note at `project_queenskilla_legal_assets.md` with the
final URLs and the deployment short-name.

## Important

- The mobile settings screens (`(shared)/settings/terms.tsx`, `.../privacy.tsx`)
  render these URLs inside a WebView. Don't rely on JavaScript — keep the
  pages renderable with JS disabled.
- The Privacy Policy URL must be publicly accessible **before** submitting
  to the Google Play Console; the listing form requires it.
- The Privacy Policy must match the Play Console Data Safety form exactly
  (data types collected, third parties, retention period). If you edit one,
  edit both.
