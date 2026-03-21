---
name: mevn-context-map
description: "Map all files impacted by a MEVN feature before coding. Use when user asks to analyze impact, find related files, or understand frontend-backend-data touchpoints for a change."
---

# MEVN Context Map

## Use when
- Need impacted-file discovery before implementation.
- Need quick dependency map between `frontend/src`, `backend/routes`, `backend/controllers`, and `backend/models`.

## Workflow
1. Restate feature goal and boundaries.
2. Map impacted layers:
   - Frontend: views/components/stores/router/services
   - Backend: routes/controllers/models/middleware
   - Data: Mongo collections/index implications
3. List candidate files by confidence (high/medium/low).
4. Identify risky contracts (auth, response shape, pagination, upload path).
5. Output a minimal execution order.

## Output format
- Scope summary
- Affected files (grouped by frontend/backend/data)
- Contract risks
- Proposed execution order
