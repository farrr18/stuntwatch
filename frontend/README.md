# StuntWatch frontend

This folder contains the Next.js dashboard, same-origin API routes, and the
Cloudflare Workers/OpenNext configuration.

- `app/` — Next.js pages and API endpoints.
- `components/` — shared interface components.
- `lib/` — data adapter, hooks, types, and utilities.
- `messages/` — Indonesian and English translations.
- `mocks/` — local fallback data.
- `public/` — static files and map assets.
- `scripts/` — frontend data and map utilities.

Run frontend commands from the repository root with `npm run dev`,
`npm run typecheck`, or `npm run cf:preview`. The root npm workspace forwards
these commands to this package. The API route imports its prediction dataset
from `backend/models/artifacts/`.
