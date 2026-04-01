# Phase 2 Plan - Complex Social Workflows

## Muc tieu
- Trien khai luong tuong tac cong dong va kiem duyet noi dung.
- Dong bo FE/BE/DB cho cac tinh nang social core.

## Scope chinh
- Comment system (create/list/delete, permissions).
- Bookmark/favorites va thu muc luu tru.
- Feed ca nhan dua tren follow graph.
- Ranking (daily/weekly/monthly) va discovery theo tags/hanh vi.
- Report/Moderation workflow co role admin.

## Sequencing (backend-first)
1. API Architect
- Chot contract cho comment/bookmark/feed/ranking/report.
- Dinh nghia model/index can thiet cho hieu nang truy van.
2. Implementation Executor
- Implement route -> controller -> model + middleware auth/role.
- Bo sung validation va error contracts.
3. Expert Vue.js Frontend Engineer
- Xay view/pages + store actions theo API contract da chot.
- Quan ly loading/error state ro rang.
4. mongodb-performance-advisor
- Review index va truy van cho feed/ranking/discovery.

## Trang thai
- Current status: Done
- Last updated: 2026-04-01

## Tai lieu contract
- docs/tasks/phase-2-api-contract.md

## Validation checklist
- Backend smoke run thanh cong.
- Frontend build thanh cong.
- Smoke test user flow: comment, bookmark, feed, report.
