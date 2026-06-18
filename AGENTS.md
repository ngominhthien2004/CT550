# AGENTS.md — IlluWrl (Pixiv Clone)

Compact guidance for OpenCode sessions working on this repo.

## What is this project

A Pixiv-style illustration/manga/novel sharing platform ("IlluWrl") built as a MEVN stack.
Hosted on Render.com with optional Cloudflare deployment (wrangler configs exist in both
`backend/wrangler.toml` and `frontend/wrangler.jsonc`).

## Architecture

Monorepo with two packages:

- **`backend/`** — Express 5 + Mongoose (MongoDB). Entry: `backend/server.js` (required via `index.js`).
  - CommonJS (`"type": "commonjs"`). **NOT ESM** — do not use `import`/`export` syntax.
  - Flow: `routes/*.routes.js → controllers/*.controller.js → models/*.js`
  - Auth middleware: `protect`, `admin` from `middlewares/auth.middleware.js`
  - Error handling: centralized `middlewares/error.middleware.js` (catch-all + notFound)
  - Config: `config/db.js` (MongoDB), `config/env.js` (env helpers), `config/passport.js` (Google OAuth)
- **`frontend/`** — Vue 3 + Vite + Pinia + Vue Router. Entry: `frontend/src/main.js`.
  - ESM throughout (Vite-native).
  - Layout system: most pages use `components/layout/MainLayoutTemplate.vue` (sidebar + topbar). Standalone pages (no template): `LoginView`, `SignUpView`, `FeedView`, `DrawingView`, `AIView`, `AuthCallbackView`.

## Developer commands

| Where | Command | What |
|-------|---------|------|
| root | `npm install` (playwright only) | Installs Playwright at root level |
| backend | `npm install` | Install backend deps |
| backend | `npm run dev` | Starts Express on `PORT` (default 5000) |
| backend | `npm test` | `node --test tests/*.test.js` (Node built-in test runner) |
| frontend | `npm install` | Install frontend deps |
| frontend | `npm run dev` | Vite dev server (default 5173) — proxies `/api` and `/uploads` to backend |
| frontend | `npm run build` | Compile check (run before reporting frontend changes done) |

## Testing

- Backend uses Node.js **built-in** test runner (`node:test` + `node:assert/strict`). Not Jest/Mocha.
- Single test file: `backend/tests/requestValidation.test.js` (request commission state machine tests).
- Run: `cd backend && npm test`

## Test accounts

Use pre-created test accounts from `docs/reports/auth-test-accounts-2026-04-05.md` instead of creating new ones for ad-hoc testing.

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Admin | `qa_admin_20260417` | `QaAdmin!2026` | admin |
| Human-style (30 accs) | e.g. `johnny.brooks`, `goku.tanaka` | `Test12345!` | user |

All 30 human-style accounts share password `Test12345!`. See `docs/reports/auth-test-accounts-2026-04-05.md` for the full list.

Rules:
- **Reuse existing accounts** — do not create new ones unless the test explicitly covers account registration.
- These are local dev only — do not use in production.

## Browser testing (Chrome DevTools MCP)

This environment has Chrome DevTools MCP tools available (`chrome-devtools_*`). Use them for:

- **Smoke tests**: navigate to affected routes, verify UI renders correctly.
- **Screenshots**: capture proof of UI state after changes (prefer Chrome DevTools MCP over Playwright screenshots per project convention).
- **Form fill & interaction**: fill forms, click buttons, read page content to verify feature behavior.
- **Console & network**: check for JS errors or failed API calls.

Workflow: start frontend + backend dev servers → navigate page → inspect/interact → capture screenshot evidence.

## Important quirks & gotchas

1. **DNS**: Backend forces IPv4-first DNS resolution (`dns.setDefaultResultOrder('ipv4first')` in `server.js`)
   and overrides DNS servers to Google Public DNS (`dns.setServers(['8.8.8.8', '1.1.1.1'])` in `config/db.js`)
   to avoid SRV lookup failures. Do NOT remove.
2. **CORS is custom** — Not using `cors` npm package. Implemented inline in `server.js` with origin allowlist
   from `config/env.js`. Local dev origins (localhost, 127.0.0.1) are auto-allowed.
3. **`.env` files are required** — Backend crashes on startup without `JWT_SECRET` and `MONGODB_URI`.
   Copy `backend/.env.example` → `backend/.env`. Frontend env defaults to proxying to localhost.
4. **Uploads**: File upload max size configurable via `MAX_UPLOAD_FILE_SIZE_MB` env var (default 10 MB).
   GIF uploads have a specific policy: only `.gif` MIME type accepted for `type=gif`; ZIP/ugoira rejected.
   See `backend/docs/GIF_UPLOAD_POLICY.md`.
5. **Express 5**: Note that Express 5 does not support `app.get('*', ...)` — the SPA fallback uses `app.use` instead.
6. **AI features**: HuggingFace for AI detection (`umm-maybe/AI-image-detector`), Ollama for AI chat/recommendations.
   Threshold configurable via `AI_DETECTION_THRESHOLD` (default 70%).
7. **vue-konva must be registered in main.js**: The npm packages `konva` and `vue-konva` are declared in `frontend/package.json`, but Vue does NOT auto-register them. You MUST add `import VueKonva from 'vue-konva'` and `app.use(VueKonva)` in `frontend/src/main.js`. Without this, `<v-stage>`, `<v-layer>`, `<v-rect>`, `<v-line>`, `<v-image>` components fail with "Failed to resolve component" warnings and the canvas never renders.
8. **Bootstrap global heading colors override Vue scoped CSS**: Bootstrap sets global colors on `h1`–`h6` (e.g. `h2 { color: #0f172a }`). In Vue `scoped` components, if you don't explicitly set `color` on a heading, Bootstrap's global rule wins — even on dark backgrounds. Always set `color: inherit` (or an explicit light color) on heading elements inside dark-themed modals/panels.
9. **Chrome DevTools tab management**: Before opening a new tab with `chrome-devtools_new_page`, ALWAYS call `chrome-devtools_list_pages` first to check what tabs already exist. Reuse existing isolated contexts (`isolatedContext`) for the same user session instead of creating new tabs. This prevents accumulating too many open tabs (max 5 recommended). When done with a test session, close unused tabs with `chrome-devtools_close_page`.

## Test artifact convention

Screenshots captured during testing / debugging sessions MUST be saved to `test-artifacts/` (not `docs/images/` or `docs/screenshots/`). This directory already exists and contains historical test artifacts. Keeping them in one place makes cleanup predictable and avoids polluting documentation folders with ephemeral test evidence.

## Environment files

- `backend/.env.example` — full docs for each backend variable (MongoDB, JWT, CORS, Google OAuth, AI)
- `frontend/.env.example` — `VITE_API_BASE_URL`, `VITE_UPLOADS_BASE_URL`
- `frontend/.env.production` — production URLs (custom domain `api.ngominhthien22.site`)
- `render.env.example` — combined env doc for Render deployment groups

## Frontend conventions

- Page logic in `src/views/`, reusable UI in `src/components/<domain>/`.
- Pinia stores in `src/stores/` for shared state and async data (auth, artwork, bookmark, like, etc.).
- Centralized HTTP client at `src/services/api.js` — adds `Bearer` token from localStorage, normalizes asset URLs.
- Router at `src/router/index.js` with guards via `meta.requiresAuth` and `meta.requiresAdmin`.
- Bootstrap 5 CSS and Font Awesome are installed and used for layout/utility classes and icons.
- Design tokens in `src/assets/styles/global.css` (CSS custom properties: `--bg`, `--text`, `--brand`, etc.).
- Full layout architecture documented in `docs/layout-architecture.md`.
- **Drawing Tool module**: `DrawingView.vue` composes 6 child components under `components/drawing/`: `DrawingTopBar`, `DrawingToolPanel`, `DrawingCanvas`, `DrawingLayersPanel`, `PostDrawingModal`, `SaveSlotsModal`. State lives in `stores/drawing.store.js` (Pinia). Drawing uses Konva.js via vue-konva — see quirk #7.

## Deployment

- **Render**: `render.yaml` defines two services: `CT550` (backend web service) and `CT550-Frontend` (static site).
  Backend root: `backend/`, build: `npm install`, start: `node index.js`, health check: `/api`.
  Frontend root: `frontend/`, build: `npm install; npm run build`, publish: `dist/`.
- **Cloudflare**: Wrangler configs exist but likely exploratory — production deployment is on Render.

## Existing instruction sources (read these for deeper conventions)

- `.github/copilot-instructions.md` — broader workflow rules (data seeding policy via MongoDB MCP, screenshot artifact rules, etc.)
- `.github/instructions/backend.rules.instructions.md` — backend code structure conventions
- `.github/instructions/frontend.rules.instructions.md` — frontend code structure conventions (includes QA account reuse, smoke test requirements)
- `docs/project-overview.md` — comprehensive feature inventory with status (✅/⚠️/❌)
- `docs/layout-architecture.md` — detailed frontend page layout diagrams
- `docs/tasks/feature-tracker.md` — current feature implementation status
- `docs/PRD.yaml` — product requirements for individual features
- `docs/action-flow/request-action-flows.md` — complete request/commission action flow documentation with state machine, API endpoints, auth matrix, and validation rules

## Per-backend-file convention caveat

The `.github/copilot-instructions.md` says "Use ESM imports with explicit `.js` paths in backend files."
**This is incorrect for this repo.** The backend uses CommonJS (`require` / `module.exports`). Do not add ESM
syntax to backend files unless the project is explicitly migrated.
