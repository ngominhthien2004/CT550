# Phase 2 Plan - Complex Social Workflows

## Mục tiêu

- Triển khai luồng tương tác cộng đồng và kiểm duyệt nội dung.
- Đồng bộ FE/BE/DB cho các tính năng social core.

## Scope chính

- Comment system (create/list/delete, permissions).
- Bookmark/favorites và thư mục lưu trữ.
- Feed cá nhân dựa trên follow graph.
- Ranking (daily/weekly/monthly) và discovery theo tags/hành vi.
- Report/Moderation workflow có role admin.

## Sequencing (backend-first)

1. gem-researcher

- Chốt contract cho comment/bookmark/feed/ranking/report.
- Định nghĩa model/index cần thiết cho hiệu năng truy vấn.

2. gem-implementer

- Implement route -> controller -> model + middleware auth/role.
- Bổ sung validation và error contracts.

3. gem-designer

- Xây view/pages + store actions theo API contract đã chốt.
- Quản lý loading/error state rõ ràng.

4. gem-reviewer

- Review index và truy vấn cho feed/ranking/discovery.

## Trạng thái

- Current status: Done
- Last updated: 2026-04-01

## Tài liệu contract

- docs/tasks/phase-2-api-contract.md

## Validation checklist

- Backend smoke run thành công.
- Frontend build thành công.
- Smoke test user flow: comment, bookmark, feed, report.
