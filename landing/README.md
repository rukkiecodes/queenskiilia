# QueenSkiilia — Landing Page

SEO-ready marketing site + waiting-list capture for **queenskilla.app**, built
with Next.js 15 (App Router) and Tailwind CSS v4. Follows the Apple design
language defined in `client/mobile/DESIGN.md` (Action Blue `#0066cc`, Inter as
the SF Pro substitute, pill CTAs, alternating light/dark full-bleed sections).

## Sections

1. **Hero** — "From Skill to Real Experience" + waiting-list CTA.
2. **The Problem** — "Tired of hearing 'You need experience'?"
3. **How QueenSkiilia Works** — three boxes: Prove It → Work → Earn.
4. **Waiting list** — embedded JotForm (form `261676405204555`).

## SEO

- Full `metadata` (title/description, canonical, keywords) in `app/layout.tsx`.
- OpenGraph + Twitter card (`/og.png` — add a 1200×630 image to `public/`).
- `Organization` JSON-LD structured data.
- `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt`.
- Server-rendered HTML, semantic landmarks, accessible labels.

> Add `public/og.png` (1200×630), `public/icon.png`, and `public/favicon.ico`
> before launch — referenced by the metadata above.

## Waiting list storage

Submissions are collected by **JotForm** (form `261676405204555`), embedded in
`components/waitlist.tsx` via the official iframe + `for-form-embed-handler.js`
auto-resize script. There is no database — view and export signups from the
JotForm dashboard. No server env vars are required for the waitlist.

## Develop

```bash
npm install
cp .env.example .env.local   # optional — only NEXT_PUBLIC_* vars
npm run dev                  # http://localhost:3000
```

## Build / deploy

```bash
npm run build && npm start
```

Deploy as its own Vercel project (suggested name `queenskilla-landing`), point
the `queenskilla.app` domain at it. The waitlist needs no env vars; set only
the `NEXT_PUBLIC_*` vars above if you want non-default values.
