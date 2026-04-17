# Agent Handoff by Phase

Mục tiêu: handoff rõ ràng để triển khai theo phase với ít rework.

## Phase 1 (Done) - Foundation CRUD

- Handoff owner: gem-orchestrator
- Assigned to: gem-implementer
- Supporting: gem-researcher (on-demand)
- Input tài liệu:
  - docs/tasks/phase-1-plan.md
  - docs/tasks/feature-tracker.md
- Delivery đã có:
  - User Auth, Profiles, Follow
  - Artwork CRUD

## Phase 2 (In Progress, phần Social đã Done) - Complex Features

### Trạng thái nhanh

- Đã hoàn tất social core: comment, bookmark, feed, ranking.
- Đã mở rộng comment flow: reply thread + display replies + sticker URL + smoke test bằng Chrome DevTools MCP.
- Tiếp theo ưu tiên: Moderation & Reporting.

### Handoff 1: API contract

- Agent: gem-researcher
- Required output:
  - Endpoint matrix cho moderation/reporting và phần social mở rộng còn thiếu
  - Request/response schema + auth/role matrix
  - DB impact note (model updates, indexes)
- Input tài liệu:
  - docs/tasks/phase-2-plan.md
  - docs/project-overview.md

### Handoff 2: Backend implementation

- Agent: gem-implementer
- Required output:
  - Route -> Controller -> Model cho tất cả endpoint phase 2
  - Validation + centralized error handling
  - Backend smoke run pass
- Dependency: Handoff 1 done

### Handoff 3: Frontend integration

- Agent: gem-designer
- Required output:
  - Views/components/stores cho comment/bookmark/feed/ranking/report
  - API consumption qua shared client
  - Frontend build pass
- Dependency: Handoff 2 stable contract

### Handoff 4: Performance review

- Agent: gem-reviewer
- Required output:
  - Index recommendations cho feed/ranking/discovery/comments
  - Query risk report và đề xuất tối ưu

## Phase 3 (Planned) - AI Features

### Handoff 1: AI API design

- Agent: gem-researcher
- Required output:
  - AI endpoint contracts, fallback strategy, error schema
  - Async/sync execution strategy

### Handoff 2: AI backend integration

- Agent: gem-implementer
- Required output:
  - AI service wrappers + endpoint integration
  - Safe fallback nếu provider fail

### Handoff 3: AI frontend UX

- Agent: gem-designer
- Required output:
  - UI flow cho auto-tagging/recommendation/assistant
  - Loading/error/retry states rõ ràng

### Handoff 4: Data + quality tuning

- Agent: gem-reviewer
- Required output:
  - Metadata/index/caching guidance cho AI workflows

### Handoff 5: Final reporting

- Agent: gem-documentation-writer
- Required output:
  - Tổng hợp kết quả, metric, rủi ro, đánh giá chất lượng theo template
  - Cập nhật report section trong docs/report-templates

## Tracking rule

- Mỗi khi bắt đầu handoff: cập nhật status feature từ Planned -> In Progress.
- Mỗi khi handoff hoàn tất + validate: cập nhật status -> Done và điền Validation.
