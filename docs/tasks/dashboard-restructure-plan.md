---
status: in-progress
phase: 4
updated: 2026-07-24
---

# Dashboard Tab Restructure

## Goal
Tách Works và Series thành 2 tab riêng biệt trên top navigation, mỗi tab có sub-filter theo loại content (Illustration, Manga, GIF, Novel) với URL routing để dễ navigate.

## Context & Decisions
| Decision | Rationale | Source |
|----------|-----------|--------|
| Series là tab riêng, không còn ẩn trong Works | UX rõ ràng hơn, Works và Series là 2 concept tách biệt | User request |
| URL routing (`/dashboard/works`, `/dashboard/series`) | Dễ navigate, share link, back/forward hoạt động | User request |
| Works có 5 filter: All, Illustration, Manga, GIF, Novel | Artwork model hỗ trợ 4 types + All | `ref:backend-analysis` |
| Series có 4 filter: All, Illustration, Manga, Novel | Series model chỉ hỗ trợ 3 types (không có gif) | `ref:backend-analysis` |
| Backend đã hỗ trợ `?type=` filter sẵn | `getArtworks({ type })` và `seriesApi.getMySeries({ type })` đều có | `ref:backend-analysis` |
| Filter dùng query param (`?type=illust`) | Thay vì nested route, giữ path sạch | Architecture decision |

## Phase 1: Router + Tab Navigation [IN PROGRESS]
- [ ] **1.1 Thêm child routes cho `/dashboard`** ← CURRENT
  - Thêm `{ path: '', redirect: '/dashboard/works' }` làm default
  - Thêm `{ path: 'works', name: 'dashboard-works' }` với component mới
  - Thêm `{ path: 'series', name: 'dashboard-series' }` với component mới
  - File: `frontend/src/router/index.js`
- [ ] 1.2 Cập nhật `CreatorDashboardTabs.vue`
  - Thêm tab "Series" (5 tabs: Home, Works, Series, Reactions, Analytics)
  - Tab click → `router.push({ name: 'dashboard-works' })` hoặc `'dashboard-series'`
  - Tab active state dựa trên `route.name`
  - File: `frontend/src/components/dashboard/CreatorDashboardTabs.vue`
- [ ] 1.3 Cập nhật `DashboardView.vue`
  - Đọc `route.name` để xác định activeTab
  - Render `DashboardWorksPanel` khi `'dashboard-works'`
  - Render `DashboardSeriesPanel` khi `'dashboard-series'`
  - Home/Reactions/Analytics vẫn giữ nguyên client-side state
  - File: `frontend/src/views/DashboardView.vue`

## Phase 2: Content Type Filtering [PENDING]
- [ ] 2.1 Đại tu `DashboardWorksPanel.vue`
  - Xóa sub-tab bar "Works | Series" (không cần nữa)
  - Thêm filter sub-bar: [All] [Illustration] [Manga] [GIF] [Novel]
  - Đọc `route.query.type` để xác định filter
  - Click filter → `router.push({ query: { type: ... } })`
  - Gọi `getArtworks({ user, type })` khi filter thay đổi
  - File: `frontend/src/components/dashboard/DashboardWorksPanel.vue`
- [ ] 2.2 Đại tu `DashboardSeriesPanel.vue`
  - Thêm filter sub-bar: [All] [Illustration] [Manga] [Novel]
  - Đọc `route.query.type` để xác định filter
  - Click filter → `router.push({ query: { type: ... } })`
  - Gọi `seriesStore.fetchMySeries(type)` khi filter thay đổi
  - File: `frontend/src/components/dashboard/DashboardSeriesPanel.vue`

## Phase 3: i18n + CSS [PENDING]
- [ ] 3.1 Thêm i18n keys mới
  - `tabAll`, `tabIllustration`, `tabManga`, `tabGif`, `tabNovel`
  - Cập nhật 3 files: `en/vi/ja/dashboard.json`
- [ ] 3.2 CSS cho filter sub-bar
  - Style giống sub-tab hiện tại nhưng responsive cho 5 items
  - Mobile: scrollable horizontally
  - Active state: brand color + underline (giống current sub-tab style)
- [ ] 3.3 Cleanup unused code
  - Xóa `activeSubTab` ref khỏi `DashboardWorksPanel`
  - Xóa import `DashboardSeriesPanel` khỏi `DashboardWorksPanel`
  - Verify không có dead code

## Phase 4: Verification [PENDING]
- [ ] 4.1 Build check
  - `cd frontend && npm run build` — phải pass
- [ ] 4.2 Navigation test
  - Navigate: `/dashboard/works`, `/dashboard/works?type=illust`, `/dashboard/series?type=manga`
  - Tab highlight đúng khi navigate
  - Back/forward browser button hoạt động
- [ ] 4.3 Filter function test
  - Chọn filter → list render đúng loại content
  - "All" hiển thị tất cả
  - Empty state hiển thị đúng khi filter không có kết quả

## Files thay đổi
| File | Thay đổi |
|------|----------|
| `frontend/src/router/index.js` | Thêm child routes cho dashboard |
| `frontend/src/views/DashboardView.vue` | Route-based tab state, render Series panel |
| `frontend/src/components/dashboard/CreatorDashboardTabs.vue` | Thêm tab Series, route-based navigation |
| `frontend/src/components/dashboard/DashboardWorksPanel.vue` | Xóa sub-tabs, thêm type filter |
| `frontend/src/components/dashboard/DashboardSeriesPanel.vue` | Thêm type filter |
| `frontend/src/i18n/locales/en/dashboard.json` | Thêm filter keys |
| `frontend/src/i18n/locales/vi/dashboard.json` | Thêm filter keys |
| `frontend/src/i18n/locales/ja/dashboard.json` | Thêm filter keys |

## Files KHÔNG thay đổi
- Backend — đã hỗ trợ `?type=` filter sẵn
- `series.store.js` — đã có `fetchMySeries(type)`
- `CreateSeriesModal.vue` — giữ nguyên
- Other dashboard panels (Reactions, Analytics) — không đụng
