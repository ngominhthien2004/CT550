# AGENTS.md (MEVN Starter)

## Purpose
This file provides portable guidance for AI coding agents in MEVN repositories.

## Recommended Agent Set
- `Fullstack Workflow Orchestrator`
- `Implementation Executor`
- `API Architect`
- `Expert Vue.js Frontend Engineer`
- `mongodb-performance-advisor`
- `Technical Report Writer`

## Suggested Workflow
### Fullstack task
1. Start with `Fullstack Workflow Orchestrator`.
2. Use `Research & Plan` (includes one-time startup checklist update if needed).
3. Use `Start Implementation` (default end-to-end path).
5. Use `Finalize & Report`.
6. If validation passes and user requested publish, run commit + push flow and update tracker `PR/Commit`.
7. Generate chapter/final report markdown from template in `docs/report-templates/` (default: `nienluan-chapter.template.md` for chapter-style reports).
8. Return to orchestrator for summary and verification checklist.

### Backend-first task
1. Start with `Implementation Executor`.
2. State whether this is project bootstrap or feature implementation.
3. Agent executes backend-first flow by default and runs commands directly when feasible.
4. Optionally hand off to specialists for granular control.

Advanced/manual mode (optional): call specialist agents directly (`API Architect`, `Expert Vue.js Frontend Engineer`, `mongodb-performance-advisor`) only when you need granular control.

### Startup Baseline (new project)
1. Use one-time checklist `docs/tasks/startup-checklist.md`.
2. Prefer one git repository at project root.
3. Keep monorepo structure: `backend/`, `frontend/`, `docs/`.
4. Create docs subfolders: `docs/diagrams`, `docs/report-templates`.
5. Add Docker when deployment/team workflow needs it.

### Phased Delivery Model
1. Phase 1 — Foundation CRUD
2. Phase 2 — Complex Features
3. Phase 3 — AI Features

### Report Workflow
1. Start with `Technical Report Writer`.
2. Provide report type + required sections/template.
3. Collect backend/frontend context via handoffs when needed.
4. Fill template sections with evidence-based implemented/not-yet/future split.
5. Finalize markdown chapters and export to DOCX/PDF.

## Report Templates
- `docs/report-templates/feature-final-report.template.md`
- `docs/report-templates/nienluan-chapter.template.md`

## Task Tracking
- Track feature implementation status in `docs/tasks/feature-tracker.md`.
- During planning handoff (`Research & Plan` or `Scope & Plan`), add/update one row per feature.
- Recommended status flow: `Planned` -> `In Progress` -> `Blocked` -> `Done`.

## Local Skills (Included)
- `.github/skills/mevn-context-map/SKILL.md`
- `.github/skills/mevn-feature-plan/SKILL.md`
- `.github/skills/mevn-playwright-ui-test/SKILL.md`
- `.github/skills/mevn-report-docx/SKILL.md`
- `.github/skills/mevn-feature-finalization/SKILL.md`

## Hooks (Included)
- `.github/hooks/safety-pretool.json`
- `.github/hooks/scripts/pretool-safety.ps1`

## Optional External Agents (Use-by-Need)
- `DevOps Expert` for CI/CD and deployment workflows.
- `Playwright Tester Mode` or `gem-browser-tester` for heavier E2E UI validation.
- `Agent Governance Reviewer` or `gem-reviewer` for security/compliance review gates.
- `DataAnalysisExpert` for data-centric analysis tasks.
- `MCP AppService Builder` only for Azure App Service MCP-server work.
- `gem-planner`, `gem-researcher`, `gem-implementer`, `gem-documentation-writer` for large coordinated features.

## Scope Guardrails
- Keep changes minimal and relevant.
- Preserve existing architecture and naming conventions.
- Avoid unrelated refactors.
- Respect auth, data integrity, and environment configuration.
