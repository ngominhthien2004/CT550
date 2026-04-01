# Agent Handoff by Phase

Muc tieu: handoff ro rang de chay implementation theo phase voi it rework.

## Phase 1 (Done) - Foundation CRUD
- Handoff owner: Fullstack Workflow Orchestrator
- Assigned to: Implementation Executor
- Supporting: API Architect (on-demand)
- Input tai lieu:
  - docs/tasks/phase-1-plan.md
  - docs/tasks/feature-tracker.md
- Delivery da co:
  - User Auth, Profiles, Follow
  - Artwork CRUD

## Phase 2 (Ready to start) - Complex Features
### Handoff 1: API contract
- Agent: API Architect
- Required output:
  - Endpoint matrix cho comment/bookmark/feed/ranking/report
  - Request/response schema + auth/role matrix
  - DB impact note (model updates, indexes)
- Input tai lieu:
  - docs/tasks/phase-2-plan.md
  - docs/project-overview.md

### Handoff 2: Backend implementation
- Agent: Implementation Executor
- Required output:
  - Route -> Controller -> Model cho tat ca endpoint phase 2
  - Validation + centralized error handling
  - Backend smoke run pass
- Dependency: Handoff 1 done

### Handoff 3: Frontend integration
- Agent: Expert Vue.js Frontend Engineer
- Required output:
  - Views/components/stores cho comment/bookmark/feed/ranking/report
  - API consumption qua shared client
  - Frontend build pass
- Dependency: Handoff 2 stable contract

### Handoff 4: Performance review
- Agent: mongodb-performance-advisor
- Required output:
  - Index recommendations cho feed/ranking/discovery
  - Query risk report va de xuat toi uu

## Phase 3 (Planned) - AI Features
### Handoff 1: AI API design
- Agent: API Architect
- Required output:
  - AI endpoint contracts, fallback strategy, error schema
  - Async/sync execution strategy

### Handoff 2: AI backend integration
- Agent: Implementation Executor
- Required output:
  - AI service wrappers + endpoint integration
  - Safe fallback neu provider fail

### Handoff 3: AI frontend UX
- Agent: Expert Vue.js Frontend Engineer
- Required output:
  - UI flow cho auto-tagging/recommendation/assistant
  - Loading/error/retry states ro rang

### Handoff 4: Data + quality tuning
- Agent: mongodb-performance-advisor
- Required output:
  - Metadata/index/caching guidance cho AI workflows

### Handoff 5: Final reporting
- Agent: Technical Report Writer
- Required output:
  - Tong hop ket qua, metric, rui ro, danh gia chat luong theo template
  - Cap nhat report section trong docs/report-templates

## Tracking rule
- Moi khi bat dau handoff: cap nhat status feature tu Planned -> In Progress.
- Moi khi handoff hoan tat + validate: cap nhat status -> Done va dien Validation.
