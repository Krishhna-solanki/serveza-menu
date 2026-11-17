# AGENTS.md

- Build hooks (`predev`/`prebuild`) must run with plain npm/node (local `tsx` devDependency), never `bunx` — the repo is deployed to Netlify, which has no bun.
- Public Supabase connection values are duplicated in `.env.production` so Netlify builds work without `.env`; `.env` itself is auto-generated and must not be edited.
- SPA hosting fallback is configured twice by design: `netlify.toml` (with build settings) and `public/_redirects`, both `/* → /index.html 200`.
- Centralize public menu URL construction so QR codes, copied links, and admin menu links always share the canonical destination.
