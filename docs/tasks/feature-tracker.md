# Feature Tracker

Mục tiêu: theo dõi trạng thái các chức năng đã/đang triển khai trong repo.

## Cách dùng nhanh
- Khi bắt đầu một feature mới: thêm 1 mục ở bảng bên dưới với trạng thái `Planned`.
- Sau khi chốt kế hoạch: cập nhật `Status` -> `In Progress` và thêm link plan chi tiết (nếu có).
- Khi hoàn tất + đã validate: thực hiện commit code, push lên GitHub, sau đó cập nhật `Status` -> `Done` và điền `Validation`.

## Bảng theo dõi

| Feature | Scope (FE/BE/DB) | Owner/Agent | Status | Plan File | PR/Commit | Validation | Last Updated |
|---|---|---|---|---|---|---|---|
| (example) Comment API endpoints | BE, DB | Plan -> API Architect | Planned | /memories/session/plan.md | - | pending | 2026-03-20 |
| Phase 1: User Auth, Profiles & Follow | BE, DB | Implementation Executor | Done | docs/tasks/phase-1-plan.md | pending push | Booted successfully | 2026-03-21 |
| Phase 1: Artwork Management (CRUD) | BE, DB | Implementation Executor | Done | docs/tasks/phase-1-plan.md | pending push | Booted successfully | 2026-03-21 |
| Phase 2: Social Features (Comment, Bookmark, Feed, Ranking, Discovery) | FE, BE, DB | Fullstack Workflow Orchestrator -> API Architect + Expert Vue.js Frontend Engineer + mongodb-performance-advisor | Done | docs/tasks/phase-2-plan.md | c9b4954 | Backend boot ok, frontend build ok, contract doc completed | 2026-04-01 |
| Phase 2: Moderation & Reporting Workflow | FE, BE, DB | Fullstack Workflow Orchestrator -> API Architect + Expert Vue.js Frontend Engineer | Planned | docs/tasks/phase-2-plan.md | - | pending | 2026-04-01 |
| Phase 3: AI Auto-tagging, Captioning, Recommendation | FE, BE, DB | Fullstack Workflow Orchestrator -> API Architect + mongodb-performance-advisor | Planned | docs/tasks/phase-3-plan.md | - | pending | 2026-04-01 |
| Phase 3: AI Detection Labeling + Art Assistant | FE, BE, DB | Fullstack Workflow Orchestrator -> API Architect + Expert Vue.js Frontend Engineer + Technical Report Writer | Planned | docs/tasks/phase-3-plan.md | - | pending | 2026-04-01 |

## Trạng thái chuẩn
- `Planned`
- `In Progress`
- `Blocked`
- `Done`
