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
| Phase 1: User Auth, Profiles & Follow | BE, DB | Implementation Executor | Done | implementation_plan.md | pending push | Booted successfully | 2026-03-21 |
| Phase 1: Artwork Management (CRUD) | BE, DB | Implementation Executor | Done | implementation_plan.md | pending push | Booted successfully | 2026-03-21 |

## Trạng thái chuẩn
- `Planned`
- `In Progress`
- `Blocked`
- `Done`
