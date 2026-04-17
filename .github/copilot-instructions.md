# Copilot Instructions for MEVN Starter

Use this as a portable baseline for MEVN projects:
- `backend/`: Node.js + Express + Mongoose (MongoDB)
- `frontend/`: Vue 3 + Vite + Pinia + Vue Router

## Core Principles
- Keep changes minimal and scoped to the user request.
- Preserve existing architecture and naming conventions.
- Fix root causes where possible; avoid patch-only workarounds.
- Avoid unrelated refactors.
- Do NOT configure `git user.name` or `git user.email`. Assume the environment is properly authenticated and configured.

## Language Output Policy
- When writing Vietnamese, always use full diacritics (dấu tiếng Việt đầy đủ).
- If Vietnamese with diacritics cannot be ensured, write in English instead.
- Do not write Vietnamese without diacritics in docs, comments, reports, or task artifacts.

## Default Workflow Policy
- Default to backend-first execution for features that affect both API and UI:
	1) define or update backend contract first,
	2) validate data/model impact,
	3) integrate frontend against finalized contract.
- Prefer `gem-implementer` as the default execution agent for implementation tasks.
- Use one-time startup baseline from `docs/tasks/startup-checklist.md`.
- Track feature progress in `docs/tasks/feature-tracker.md` with status flow `Planned -> In Progress -> Blocked -> Done`.

## Backend Conventions (Expected)
- Use ESM imports with explicit `.js` paths in backend files.
- Implement API changes through `routes -> controllers -> models`.
- Keep auth checks in middleware (e.g., `protect`, `admin`).
- Prefer async handlers with centralized error middleware.

## Frontend Conventions (Expected)
- Keep page logic in `src/views/` and reusable UI in `src/components/`.
- Keep shared business/data logic in Pinia stores.
- Centralize HTTP client setup in `src/services/api.js`.
- Keep route guards aligned with auth store and route metadata.
- Use Bootstrap 5 CSS utility/layout classes for frontend styling when Bootstrap is installed or explicitly requested.
- For icons in frontend UI, keep a single icon set per screen (prefer Font Awesome when installed) and require accessible labels for icon-only buttons.
- New frontend pages must be built on top of the existing layout/template system (`MainLayoutTemplate` + established section components) instead of ad-hoc standalone page shells.

## Screenshot Artifact Rules
- Store UI smoke-test screenshots in `test-artifacts/screenshots/<feature>/` (example: `test-artifacts/screenshots/like-favorite/`).
- Keep Playwright HTML/JSON reports in `test-artifacts/screenshots/reports/`.
- Use descriptive, feature-first file names with date suffix when practical (example: `favorite-page-template-2026-04-08.png`).
- For new features, create a dedicated screenshot folder before running smoke tests.
- When capturing screenshots from chat automation, prioritize ChromeDevTools MCP screenshot tools over Playwright screenshot tools.

## Security and Data Integrity
- Never expose secrets in code; use `.env` and environment variables.
- Do not bypass auth checks for private/admin endpoints.
- Validate required request fields before write operations.
- Avoid destructive operations unless explicitly requested.

## Validation Checklist
- Backend: run backend scripts and smoke-start server.
- Frontend: run `npm run build` in frontend for compile-time validation.
- Frontend UI updates: run a Playwright browser smoke check on affected routes before reporting completion.
- If API contracts change, ensure frontend usage is updated.

## Process References
- Keep agent process docs in `docs/process/` (`agent-execution-workflow.md`, `agent-handoff-phases.md`, `gitnexus-playbook.md`).

## Gem-Team Overlay Policy
- Gem-team already provides base workflow; project-specific behavior is applied as an overlay via local instructions/skills.
- Prefer local overlay instead of editing plugin files under `C:/Users/Lenovo/.vscode/agent-plugins/.../gem-team` because extension updates can overwrite changes.
- Load and apply `.github/skills/mevn-gem-team-overlay/SKILL.md` for implementation tasks requiring project workflow enforcement.

## Non-Goals
- Do not add new frameworks/libraries without explicit request.
- Bootstrap 5 CSS is an approved exception when the user asks to use Bootstrap in frontend work.
- Do not redesign architecture unless explicitly requested.
