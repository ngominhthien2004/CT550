# Feature Tracker

Mục tiêu: theo dõi trạng thái các chức năng đã/đang triển khai trong repo.

## Cách dùng nhanh

- Khi bắt đầu một feature mới: thêm 1 mục ở bảng bên dưới với trạng thái `Planned`.
- Sau khi chốt kế hoạch: cập nhật `Status` -> `In Progress` và thêm link plan chi tiết (nếu có).
- Khi hoàn tất + đã validate: thực hiện commit code, push lên GitHub, sau đó cập nhật `Status` -> `Done` và điền `Validation`.

## Bảng theo dõi

| Feature                                                                | Scope (FE/BE/DB) | Owner/Agent                                                                  | Status  | Plan File                                     | PR/Commit    | Validation                                                                                                   | Last Updated |
| ---------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- | ------- | --------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | ------------ |
| (example) Comment API endpoints                                        | BE, DB           | Plan -> gem-researcher                                                       | Planned | /memories/session/plan.md                     | -            | pending                                                                                                      | 2026-03-20   |
| Phase 1: User Auth, Profiles & Follow                                  | BE, DB           | gem-implementer                                                              | Done    | docs/tasks/phase-1-plan.md                    | pending push | Booted successfully                                                                                          | 2026-03-21   |
| Phase 1: Artwork Management (CRUD)                                     | BE, DB           | gem-implementer                                                              | Done    | docs/tasks/phase-1-plan.md                    | pending push | Booted successfully                                                                                          | 2026-03-21   |
| Phase 2: Social Features (Comment, Bookmark, Feed, Ranking, Discovery) | FE, BE, DB       | gem-orchestrator -> gem-researcher + gem-designer + gem-reviewer             | Done    | docs/tasks/phase-2-plan.md                    | c9b4954      | Backend boot ok, frontend build ok, contract doc completed                                                   | 2026-04-01   |
| UI Navigation Wiring + Utility Pages (Messages/Notifications/Account)  | FE, BE           | gem-designer                                                                 | Done    | docs/tasks/frontend-page-checklist.md         | pending push | Frontend build ok, linked topbar/sidebar buttons, latest artworks on Home                                    | 2026-04-05   |
| Auth UI (SignUp/Login/Account) + 3-account verification                | FE, BE, DB       | gem-designer                                                                 | Done    | docs/reports/auth-test-accounts-2026-04-05.md | pending push | Frontend build ok, register/login 3 accounts passed                                                          | 2026-04-05   |
| FE/BE Parity Close: Follow + Messages + Notifications                  | FE, BE, DB       | gem-implementer                                                              | Done    | docs/tasks/backend-feature-checklist.md       | d218b1d      | Frontend build ok, API smoke ok, MongoDB MCP validation ok                                                   | 2026-04-08   |
| Comment Threading + Sticker + MCP UI Smoke                             | FE, BE, DB       | gem-implementer                                                              | Done    | docs/tasks/backend-feature-checklist.md       | pending push | Frontend build ok, login test account ok, comment/reply flow ok, screenshot captured via Chrome DevTools MCP | 2026-04-17   |
| Phase 2: Moderation & Reporting Workflow                               | FE, BE, DB       | gem-orchestrator -> gem-researcher + gem-designer                            | Planned | docs/tasks/phase-2-plan.md                    | -            | pending                                                                                                      | 2026-04-01   |
| Phase 3: AI Auto-tagging, Captioning, Recommendation                   | FE, BE, DB       | gem-orchestrator -> gem-researcher + gem-reviewer                            | Planned | docs/tasks/phase-3-plan.md                    | -            | pending                                                                                                      | 2026-04-01   |
| Phase 3: AI Detection Labeling + Art Assistant                         | FE, BE, DB       | gem-orchestrator -> gem-researcher + gem-designer + gem-documentation-writer | Planned | docs/tasks/phase-3-plan.md                    | -            | pending                                                                                                      | 2026-04-01   |

## Trạng thái chuẩn

- `Planned`
- `In Progress`
- `Blocked`
- `Done`
