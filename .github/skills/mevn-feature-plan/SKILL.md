---
name: mevn-feature-plan
description: "Create and maintain implementation plans for MEVN features with backend-first or fullstack sequencing. Use for planning, re-planning, and scope control."
---

# MEVN Feature Plan

## Use when
- User requests implementation plan, TODO breakdown, or milestone sequence.
- Scope changed and plan needs update.

## Workflow
1. Capture acceptance criteria.
2. Confirm startup baseline (when project is new):
   - single git repository at project root (recommended),
   - monorepo layout (`backend/`, `frontend/`, `docs/`),
   - docs structure (`docs/diagrams`, `docs/report-templates`),
   - Docker decision (defer unless team/deploy needs immediate containerization).
3. Choose sequence:
   - Backend-first (contract then frontend), or
   - Fullstack iterative.
4. Apply phase model:
   - Phase 1: Foundation CRUD.
   - Phase 2: Complex business workflows.
   - Phase 3: AI features.
5. Break into verifiable steps:
   - API/model changes
   - Frontend integration
   - Validation/build checks
   - Final report step
6. Flag assumptions and blockers.

## Quality rules
- Keep steps action-oriented and testable.
- Minimize parallel risky changes.
- Include rollback hints for breaking contracts.
