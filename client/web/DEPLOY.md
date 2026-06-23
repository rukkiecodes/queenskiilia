# QueenSkiilia Web — Deploy

Nuxt 4 (SSR) app. Deploys to Vercel; Nuxt auto-detects the Vercel preset.

## 1. Vercel project

- Import the repo; set **Root Directory** to `client/web`.
- Framework preset: **Nuxt** (auto-detected). Build command `nuxt build`, output handled by the Vercel preset.
- Node 20+.

## 2. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `NUXT_PUBLIC_API_URL` | `https://queenskilla-mainserver.vercel.app` |
| `NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | your Cloudinary cloud name |
| `NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | your unsigned upload preset |
| `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |

(These map to `runtimeConfig.public.*` automatically.)

## 3. Backend changes (REQUIRES backend access — not done by the web app)

Add the deployed web origin (e.g. `https://queenskilla-web.vercel.app`) to:

- **main-server** `CORS_ORIGINS` (env var) — so `/auth/*` and `/graphql` accept the web origin.
- **main-server Socket.IO** allowed origins (`socket/index.ts` uses `env.CORS_ORIGINS`) — so the chat/notification socket handshake is accepted.

Without this, auth/GraphQL/socket calls from the deployed web app are blocked by CORS.

## 4. Cookies

Auth cookies are `Secure` in production (`secure: !import.meta.dev`), `SameSite=Lax`, `Path=/`, HttpOnly — they work on the Vercel HTTPS domain out of the box. The BFF (`server/api/auth/*`) is same-origin, so no cross-site cookie issues.

## 5. Post-deploy smoke test

1. `GET /robots.txt` and `/sitemap.xml` resolve.
2. Public pages render with correct `<title>`/OG (`/`, `/talent/<id>`, `/legal/terms`).
3. OTP login end-to-end (email → code → profile setup → dashboard).
4. Socket connects after login (chat/notifications).
5. Fund a project with a Paystack **test** card → callback verifies → escrow `held`.

## 6. SEO / perf notes

- Public pages indexable; app/auth pages emit `robots: noindex` via their layouts.
- `robots.txt` disallows app routes; `sitemap.xml` lists `/`, legal, and public `/talent/:id` profiles.
- Theme is set from the `qs.theme` cookie before paint (no FOUC); Poppins is preconnected.
- Run Lighthouse on `/` and a `/talent/:id` page; target Performance ≥ 90.
