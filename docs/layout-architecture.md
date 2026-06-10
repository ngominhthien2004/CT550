# Kiến Trúc Layout — Hệ Thống Frontend

> Tài liệu này mô tả chi tiết cấu trúc layout của toàn bộ hệ thống frontend.
> Dùng để tham khảo khi phát triển, đảm bảo nhất quán về bố cục và responsive.

---

## Mục Lục

1. [Tổng Quan Global Layout](#1-tổng-quan-global-layout)
2. [Main Layout Template](#2-main-layout-template)
3. [CSS Design Tokens & Component Styles](#3-css-design-tokens--component-styles)
4. [Pages Sử Dụng MainLayoutTemplate](#4-pages-sử-dụng-mainlayouttemplate)
   - 4.1. [HomePage (`/`)](#41-homepage-)
   - 4.2. [TypedHomeFeedView (`/illustrations`, `/manga`, `/novels`)](#42-typedhomefeedview-illustrations-manga-novels)
   - 4.3. [DiscoveryView (`/discovery`)](#43-discoveryview-discovery)
   - 4.4. [NewestByAllView (`/newest_by_all`)](#44-newestbyallview-newest_by_all)
   - 4.5. [FollowingNewestView (`/newest_by_followed`)](#45-followingnewestview-newest_by_followed)
   - 4.6. [SearchResultsView (`/search`, `/search/users`)](#46-searchresultsview-search-searchusers)
   - 4.7. [RankingsView (`/rankings`)](#47-rankingsview-rankings)
   - 4.8. [ArtworkDetailView (`/artworks/:id`, `/novels/:id`)](#48-artworkdetailview-artworksid-novelsid)
   - 4.9. [TagDetailView (`/tags/:tagName`)](#49-tagdetailview-tagstagname)
   - 4.10. [AccountView (`/account`)](#410-accountview-account)
   - 4.11. [DashboardView (`/dashboard`)](#411-dashboardview-dashboard)
   - 4.12. [AdminManagementView (`/admin`)](#412-adminmanagementview-admin)
   - 4.13. [UploadArtworkView (`/upload/:kind`)](#413-uploadartworkview-uploadkind)
   - 4.14. [MessagesView (`/messages`)](#414-messagesview-messages)
   - 4.15. [NotificationsView (`/notifications`)](#415-notificationsview-notifications)
   - 4.16. [FavoritesView (`/favorites`)](#416-favoritesview-favorites)
   - 4.17. [FollowUsersView (`/users/:id/following`, `/users/:id/followers`)](#417-followusersview-usersidfollowing-usersidfollowers)
   - 4.18. [RequestManagementView (`/requests/manage`)](#418-requestmanagementview-requestsmanage)
   - 4.19. [PaymentSandboxView (`/payments/sandbox`)](#419-paymentsandboxview-paymentssandbox)
   - 4.20. [NotFoundView (`/*`)](#420-notfoundview-)
5. [Standalone Pages (Không Dùng MainLayoutTemplate)](#5-standalone-pages-không-dùng-mainlayouttemplate)
   - 5.1. [FeedView (`/feed`)](#51-feedview-feed)
   - 5.2. [LoginView (`/login`) & SignUpView (`/signup`)](#52-loginview-login--signupview-signup)
   - 5.3. ~~PremiumView (`/premium`)~~ — **Removed**
   - 5.4. [AIView (`/ai`)](#54-aiview-ai)
   - 5.5. [DrawingView (`/draw`)](#55-drawingview-draw)
   - 5.6. [AuthCallbackView (`/auth/callback`)](#56-authcallbackview-authcallback)
6. [Bảng Tổng Hợp Layout Patterns](#6-bảng-tổng-hợp-layout-patterns)
7. [Bảng Responsive Breakpoints](#7-bảng-responsive-breakpoints)

---

## 1. Tổng Quan Global Layout

### 1.1. Root Layout (`src/App.vue`)

```text
┌──────────────────────────────────────────────────────┐
│ .app-shell (min-height: 100vh)                        │
│  ├── <router-view />                                  │
│  └── <ToastContainer />                               │
└──────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- `App.vue` là root layout, bao bọc toàn bộ ứng dụng.
- Sử dụng class `.app-shell` với `min-height: 100vh` để đảm bảo full viewport.
- Chỉ chứa `<router-view />` (nơi render page component) và `<ToastContainer />` (thông báo).
- **Không có persistent header, footer, hay sidebar ở cấp App level** — những thành phần này nằm trong từng page hoặc trong `MainLayoutTemplate`.

---

## 2. Main Layout Template

### 2.1. Cấu Trúc Chung (`src/components/layout/MainLayoutTemplate.vue`)

Đây là layout template chính, được đa số các trang sử dụng.

```text
┌──────────────────────────────────────────────────────────┐
│ .app-layout                                               │
│  ├── .sidebar-backdrop (lớp phủ khi sidebar mở trên mobile)│
│  ├── <AppSidebarMenu> (sidebar điều hướng)                │
│  └── .main-pane                                           │
│       ├── <AppTopBar> (thanh topbar)                      │
│       └── .main-content                                   │
│            └── <slot /> (nội dung trang)                  │
└──────────────────────────────────────────────────────────┘
```

**Giải thích:**

| Thành phần | Mô tả |
|---|---|
| `.sidebar-backdrop` | Lớp phủ trong suốt, xuất hiện khi sidebar mở trên màn hình nhỏ. Click vào để đóng sidebar. |
| `<AppSidebarMenu>` | Sidebar điều hướng chính, chứa logo, menu links, và các tùy chọn. |
| `.main-pane` | Vùng nội dung chính bên cạnh sidebar. |
| `<AppTopBar>` | Thanh topbar chứa search bar, user menu, notifications. |
| `.main-content` | Wrapper cho nội dung page — nơi slot được render. |
| `<slot />` | Nội dung động của từng trang. |

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=1200px` | Giảm padding của `.main-content` |
| `<=920px` | Giảm margin, sidebar có thể ẩn/hiện dạng overlay |

---

## 3. CSS Design Tokens & Component Styles

### 3.1. Design Tokens (`src/assets/styles/global.css`)

Hệ thống biến CSS toàn cục, đảm bảo theme nhất quán giữa các component:

```css
:root {
  --bg:            /* Màu nền chính */
  --text:          /* Màu chữ chính */
  --muted:         /* Màu chữ mờ */
  --line:          /* Màu đường kẻ/divider */
  --brand:         /* Màu thương hiệu */
  --surface:       /* Màu bề mặt thẻ/card */
  --surface-alt:   /* Màu bề mặt phụ */
  --accent:        /* Màu nhấn */
  --danger:        /* Màu cảnh báo/lỗi */
  --shadow-sm:     /* Đổ bóng nhỏ */
  --shadow-md:     /* Đổ bóng vừa */
  --shadow-lg:     /* Đổ bóng lớn */
}
```

- **Dark mode:** Kích hoạt bằng class `.dark-theme` trên container.
- **Shared classes:**
  - `.page-block` — thẻ trắng, `border-radius: 16px`, dùng làm container chính cho các trang.
  - `.section-head` — tiêu đề section.

### 3.2. Component Styles

| File | Classes chính | Mô tả |
|---|---|---|
| `buttons.css` | `.action-pill`, `.icon-btn`, `.icon-round`, `.ghost-link` | Các dạng nút |
| `avatars.css` | `.avatar`, `--xs`(30px), `--sm`(40px), `--md`(48px), `--lg`(64px), `--xl`(100px) | Avatar với kích thước variants |
| `modal.css` | `.modal-backdrop`, `.modal-card`, `.modal-header/body/footer` | Modal overlay và card |
| `auth.css` | `.auth-shell`, `.auth-card`, `.social-stack` | Layout cho trang đăng nhập/đăng ký |

---

## 4. Pages Sử Dụng MainLayoutTemplate

### 4.1. HomePage (`/`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .home-main-column (grid, gap: 0.8rem)                │ │
│  │  ├── <HomeTabs />                                    │ │
│  │  ├── <HomeTagStrip />                                │ │
│  │  ├── <HomeHeroBanner />                              │ │
│  │  ├── <HomeArtworkGrid />                             │ │
│  │  └── .home-feed-layout (2-column grid)               │ │
│  │       ├── .home-feed-column (1fr)                    │ │
│  │       │    └── <HomeFeedColumn /> (luồng bài viết)   │ │
│  │       └── <aside> (320px, position: sticky)          │ │
│  │            └── <HomeRecommendedUsers />               │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Sử dụng grid layout với `gap: 0.8rem` cho main column.
- Feed layout chia 2 cột: nội dung chính chiếm `1fr`, sidebar phải 320px sticky.
- `<HomeTabs>` là tab điều hướng giữa các danh mục (Illustrations, Manga, Novels).
- `<HomeTagStrip>` hiển thị các tag phổ biến.
- `<HomeHeroBanner>` banner quảng cáo/sự kiện.
- `<HomeArtworkGrid>` grid artwork nổi bật.
- Sidebar chứa danh sách người dùng gợi ý.

**Responsive:** `<=920px` → `.home-feed-layout` thành 1 cột, sidebar chuyển thành static (không sticky).

---

### 4.2. TypedHomeFeedView (`/illustrations`, `/manga`, `/novels`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .typed-home-main-column (grid, gap: 0.8rem)          │ │
│  │  ├── <HomeTabs />                                    │ │
│  │  ├── .novel-filter-bar (flex, chỉ xuất hiện ở novels)│ │
│  │  ├── <HomeTagStrip />                                │ │
│  │  ├── <HomeHeroBanner />                              │ │
│  │  ├── <HomeArtworkGrid />                             │ │
│  │  └── .typed-home-feed-layout (2-column grid)         │ │
│  │       ├── <HomeFeedColumn> (1fr)                     │ │
│  │       └── <aside> (320px, position: sticky)          │ │
│  │            └── <HomeRecommendedUsers />               │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Khác biệt so với HomePage:**

- Sử dụng class `.typed-home-main-column` thay vì `.home-main-column`.
- Có thêm `.novel-filter-bar` (chỉ xuất hiện ở route `/novels`).
- Các tabs được đồng bộ với route hiện tại.

**Responsive:** `<=920px` → feed layout 1 cột.

---

### 4.3. DiscoveryView (`/discovery`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .following-newest-page                               │ │
│  │  ├── .page-title                                     │ │
│  │  ├── .top-nav-tabs (flex, gap: 1.5rem)               │ │
│  │  ├── .filter-bar (flex, space-between)               │ │
│  │  │    ├── .left-pills (bộ lọc bên trái)              │ │
│  │  │    └── .right-pills (bộ lọc bên phải)             │ │
│  │  ├── .result-grid (auto-fill, minmax(180px))         │ │
│  │  │    └── <ArtworkCard /> × N                        │ │
│  │  └── .load-more-container (flex, center)             │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Grid kết quả sử dụng `auto-fill` với `minmax(180px)` — tự động điều chỉnh số cột.
- Filter bar chia làm 2 nhóm: left pills và right pills.
- Có nút "Load more" ở cuối thay vì phân trang.

**Responsive:** `<=920px` → grid chỉ còn 2 cột.

---

### 4.4. NewestByAllView (`/newest_by_all`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .newest-all-page (padding: 0 72px 48px)              │ │
│  │  ├── .page-title                                     │ │
│  │  ├── .navigation-bar (flex, space-between)           │ │
│  │  │    ├── .sub-tabs (flex, gap: 28px)                │ │
│  │  │    └── .r18-pills (flex, gap: 6px)                │ │
│  │  ├── .artwork-grid (6 columns, gap: 20px 14px)       │ │
│  │  │    └── <ArtworkCard /> × N                        │ │
│  │  └── .pagination-footer (flex, center)               │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Grid artwork cố định 6 cột với `gap: 20px 14px`.
- Navigation bar chứa sub-tabs và bộ lọc R18.
- Sử dụng phân trang (pagination) thay vì "Load more".

**Responsive breakpoints:**

| Màn hình | Số cột |
|---|---|
| ≥ 1400px | 6 cột |
| ≤ 1400px | 5 cột |
| ≤ 1100px | 4 cột |
| ≤ 900px | 3 cột |
| ≤ 600px | 2 cột |

---

### 4.5. FollowingNewestView (`/newest_by_followed`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .following-newest-page                               │ │
│  │  ├── .top-nav-tabs (flex)                            │ │
│  │  ├── .filter-bar (flex, space-between)               │ │
│  │  ├── .result-grid (auto-fill, minmax(180px))        │ │
│  │  └── .load-more-container                            │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Grid kết quả tương tự Discovery (auto-fill, minmax 180px).
- Dùng "Load more" thay vì phân trang.
- Cấu trúc đơn giản hơn NewestByAll.

---

### 4.6. SearchResultsView (`/search`, `/search/users`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .search-result-page (grid, gap: 0.95rem)             │ │
│  │  ├── .result-header (flex, space-between)            │ │
│  │  ├── .tag-strip (flex, overflow-x: auto)             │ │
│  │  ├── .result-tabs (flex, border-bottom)              │ │
│  │  ├── .filter-row (flex, wrap)                        │ │
│  │  └── [Nội dung thay đổi theo loại tìm kiếm]          │ │
│  │                                                       │ │
│  │       ┌─── User Search ──────────────────────────┐   │ │
│  │       │ .user-search-row (2-column grid)          │   │ │
│  │       │  ├── .user-profile-column                 │   │ │
│  │       │  └── .user-preview-rail (4 columns)       │   │ │
│  │       └───────────────────────────────────────────┘   │ │
│  │                                                       │ │
│  │       ┌─── Novel Search ─────────────────────────┐   │ │
│  │       │ .novel-result-stack (max-width: 920px)    │   │ │
│  │       └───────────────────────────────────────────┘   │ │
│  │                                                       │ │
│  │       ┌─── Illustration/Manga Search ────────────┐   │ │
│  │       │ .result-grid-wrap (6 columns)             │   │ │
│  │       └───────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Layout thay đổi linh hoạt theo loại nội dung tìm kiếm.
- `result-tabs` cho phép chuyển giữa Illustrations / Manga / Novels / Users.
- User search dùng 2-column grid với profile bên trái và preview rail 4 cột bên phải.
- Novel search dùng stack layout với max-width 920px để dễ đọc.
- Artwork search dùng grid 6 cột.

---

### 4.7. RankingsView (`/rankings`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .rankings-container (max-width: 1200px)              │ │
│  │  ├── .type-tabs (flex, border-bottom)                │ │
│  │  │    [Daily / Weekly / Monthly / Yearly]            │ │
│  │  ├── .period-bar (flex, space-between)               │ │
│  │  │    ├── .period-tabs (flex, background pill)       │ │
│  │  │    └── .date-indicator                            │ │
│  │  └── .ranking-content > .ranking-list                │ │
│  │       └── .ranking-item (flex, align-items: center)  │ │
│  │            ├── .rank-side (width: 60px)              │ │
│  │            ├── .rank-image-link (200px × 200px)       │ │
│  │            ├── .rank-info (flex: 1)                  │ │
│  │            └── .rank-actions (width: 120px)          │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Container giới hạn `max-width: 1200px`.
- Type tabs chuyển đổi giữa Daily / Weekly / Monthly / Yearly.
- Period bar có tabs dạng background pill + date indicator.
- Ranking items dùng flex layout ngang.

**Responsive:** `<=768px` → image 120px, padding info giảm.

---

### 4.8. ArtworkDetailView (`/artworks/:id`, `/novels/:id`)

Trang này có **2 biến thể layout** tùy theo loại nội dung:

#### Illust / Manga:

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .detail-page-content (display: grid, gap: 3)         │ │
│  │                                                       │ │
  │  │  ┌─ .detail-main (2-column grid: 1fr 290px) ───────┐ │ │
│  │  │  ├── .left-col (flex, column)                    │ │ │
│  │  │  │    ├── <ArtworkDetailViewer>                  │ │ │
│  │  │  │    │    (overlay viewer cho ảnh/manga)        │ │ │
│  │  │  │    ├── <ArtworkDetailCaption>                 │ │ │
│  │  │  │    │    (tiêu đề + mô tả)                     │ │ │
│  │  │  │    ├── <ArtworkDetailStats>                   │ │ │
│  │  │  │    │    (lượt thích, bookmark, views)         │ │ │
│  │  │  │    └── <ArtworkDetailCommentsCard>            │ │ │
│  │  │  │         (phần bình luận)                      │ │ │
│  │  │  └── .right-col (290px)                          │ │ │
│  │  │       └── <ArtworkDetailSidebar>                 │ │ │
│  │  │            (thông tin tác giả, tag, related)     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                       │ │
│  │  ┌─ <ArtworkDetailRelatedGrid> (full width) ───────┐ │ │
│  │  │    (grid artwork liên quan)                      │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

#### Novel:

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .detail-page-content (display: grid, gap: 3)         │ │
│  │                                                       │ │
│  │  ┌─ .novel-detail-layout (max-width: 1120px) ──────┐ │ │
  │  │  │  └── .detail-main (2-column grid: 1fr 290px)    │ │ │
│  │  │       ├── .left-col                              │ │ │
│  │  │       │    ├── <ChapterManager>                  │ │ │
│  │  │       │    │    (quản lý chapter)                │ │ │
│  │  │       │    ├── <NovelReader>                     │ │ │
│  │  │       │    │    (reader đọc novel)               │ │ │
│  │  │       │    ├── .in-content-author-card           │ │ │
│  │  │       │    │    (thẻ tác giả trong nội dung)     │ │ │
│  │  │       │    └── <ArtworkDetailCommentsCard>       │ │ │
│  │  │       │         (phần bình luận)                 │ │ │
│  │  │       └── <ArtworkDetailSidebar>                 │ │ │
│  │  │            (thông tin tác giả, tag, related)     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                       │ │
│  │  ┌─ <ArtworkDetailRelatedGrid> (full width) ───────┐ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm chung:**

- Cả 2 biến thể đều dùng grid 2 cột cho `detail-main`: nội dung chính (`1fr`) và sidebar (`290px`).
- Có `<ArtworkDetailRelatedGrid>` full-width ở cuối trang.
- Novel được bọc thêm `.novel-detail-layout` với `max-width: 1120px`.

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=1200px` | Sidebar mở rộng từ 290px → 300px |
| `<=1000px` | Chuyển từ 2 cột → 1 cột (sidebar xuống dưới) |

---

### 4.9. TagDetailView (`/tags/:tagName`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .tag-detail (display: grid, gap: 3)                  │ │
│  │  ├── .page-block > .tag-head (flex)                  │ │
│  │  │    (tên tag, số lượng artwork, nút follow)        │ │
│  │  └── <HomeArtworkGrid />                             │ │
│  │       (grid artwork của tag)                         │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Layout đơn giản: header tag + grid artwork.
- Dùng lại `<HomeArtworkGrid>` component.

---

### 4.10. AccountView (`/account`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ├── <AccountProfileSection />  (khi có user)            │
│  └── <AccountLoggedOutPrompt /> (khi guest)              │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Layout được ủy quyền hoàn toàn cho component con.
- Hiển thị profile nếu user đã đăng nhập, hoặc prompt đăng nhập nếu guest.

---

### 4.11. DashboardView (`/dashboard`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .dashboard-page > .dashboard-wrap                    │ │
│  │  (max-width: 960px, margin: 0 auto)                   │ │
│  │                                                       │ │
│  │  ├── .dashboard-head (grid)                           │ │
│  │  │    ├── .dashboard-title-row (flex)                 │ │
│  │  │    └── <CreatorDashboardTabs>                     │ │
│  │  │         (tab: Dashboard / Posts / Plans)          │ │
│  │  │                                                   │ │
│  │  ├── <CreatorRecentlyUploadedPanel>                  │ │
│  │  │    (bảng upload gần đây)                          │ │
│  │  │                                                   │ │
│  │  └── .dashboard-grid (3 columns)                     │ │
│  │       ├── <CreatorReactionsCard>                     │ │
│  │       │    (thống kê tương tác)                      │ │
│  │       ├── <CreatorThemeCard>                         │ │
│  │       │    (cài đặt theme)                           │ │
│  │       ├── <CreatorContestCard>                       │ │
│  │       │    (thông tin contest)                       │ │
│  │       └── .pr-card                                   │ │
│  │            (thẻ khác - promotion)                    │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Wrap container `max-width: 960px`, centered.
- Dashboard head dùng grid layout.
- Dashboard grid 3 cột chứa các thẻ thống kê.

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=1100px` | Grid 3 cột từ `300px 1fr 300px` |
| `<=960px` | Dashboard grid chuyển sang 1 cột |

---

### 4.12. AdminManagementView (`/admin`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .admin-page (page-block)                             │ │
│  │  ├── .admin-head (flex)                              │ │
│  │  │    (tiêu đề + thông tin admin)                    │ │
│  │  ├── <AdminOverviewCards>                            │ │
│  │  │    (các thẻ tổng quan: users, artworks, ...)     │ │
│  │  ├── <AdminSectionTabs>                              │ │
│  │  │    (tab điều hướng giữa các panel)                │ │
│  │  └── [Nội dung panel tương ứng]                      │ │
│  │       ├── <AdminUserManagementPanel>                 │ │
│  │       │    (quản lý người dùng)                      │ │
│  │       ├── <AdminArtworkModerationPanel>              │ │
│  │       │    (duyệt artwork)                           │ │
│  │       ├── <AdminCommentModerationPanel>              │ │
│  │       │    (duyệt bình luận)                         │ │
│  │       ├── <AdminPaymentManagementPanel>              │ │
│  │       │    (quản lý thanh toán)                      │ │
│  │       ├── <AdminReportReviewPanel>                   │ │
│  │       │    (xem xét báo cáo)                         │ │
│  │       └── <AdminTagManagementPanel>                  │ │
│  │            (quản lý tag)                             │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Dùng `.page-block` làm container chính.
- Tab-based navigation: nội dung thay đổi theo tab được chọn.
- Mỗi panel là một component riêng biệt.

---

### 4.13. UploadArtworkView (`/upload/:kind`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .upload-page (max-width: 1040px)                     │ │
│  │  ├── <UploadTypeHero>                                │ │
│  │  │    (hero header theo loại upload)                 │ │
│  │  └── <form> (display: grid, gap: 3)                  │ │
│  │       ├── <UploadContentDetails>                     │ │
│  │       │    (chi tiết nội dung: file, title, desc)    │ │
│  │       ├── <UploadTagSelector>                        │ │
│  │       │    (chọn tag cho artwork)                    │ │
│  │       ├── <UploadPublicationSettings>                │ │
│  │       │    (cài đặt xuất bản: public/private, ...)   │ │
│  │       └── .d-flex (action buttons)                   │ │
│  │            (nút Submit / Cancel)                     │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Container `max-width: 1040px`.
- Form dùng grid layout với gap.
- Các section được tổ chức thành component riêng.

---

### 4.14. MessagesView (`/messages`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .message-shell (grid: 340px 1fr)                     │ │
│  │                                                       │ │
│  │  ├── .thread-list-pane (grid: auto 1fr)              │ │
│  │  │    ├── .pane-head                                 │ │
│  │  │    │    (tiêu đề "Messages" + search)             │ │
│  │  │    └── .thread-list (overflow-y: auto)            │ │
│  │  │         └── .thread-item (3-column grid)          │ │
│  │  │              ├── avatar                           │ │
│  │  │              ├── thread-info                      │ │
│  │  │              └── thread-time                      │ │
│  │  │                                                   │ │
│  │  └── .thread-pane (grid: auto 1fr auto)              │ │
│  │       ├── .pane-head.thread-head (flex)              │ │
│  │       │    (avatar + tên + actions)                  │ │
│  │       ├── .thread-body (overflow-y: auto)             │ │
│  │       │    └── .message-flow > .bubble               │ │
│  │       │         (các bubble tin nhắn)                │ │
│  │       ├── .reply-context-bar                         │ │
│  │       │    (context trả lời tin nhắn)                │ │
│  │       └── .compose-row-advanced (grid: 1fr auto)     │ │
│  │            (input + nút gửi + advanced options)      │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Layout 2 cột: danh sách thread (340px) + nội dung thread (1fr).
- Thread list pane dùng grid `auto 1fr` (header chiếm auto, list chiếm phần còn lại).
- Thread pane dùng grid `auto 1fr auto` (header, body, compose).
- Thread body có `overflow-y: auto` để scroll tin nhắn.

**Responsive:** `<=920px` → chuyển thành 1 cột, có nút back để quay lại danh sách thread.

---

### 4.15. NotificationsView (`/notifications`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .page-block (display: grid, gap: 3)                  │ │
│  │  ├── <header> (flex, space-between)                  │ │
│  │  │    (tiêu đề + "Mark all as read")                 │ │
│  │  └── .d-grid.gap-2 (notification cards)              │ │
│  │       └── <NotificationCard /> × N                   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Dùng `.page-block` làm container.
- Header với nút "Mark all as read".
- Notification cards dùng grid.

---

### 4.16. FavoritesView (`/favorites`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .favorites-wrap (max-width: 980px, margin: 0 auto)  │ │
│  │  ├── .favorites-head (flex, wrap)                   │ │
│  │  │    (tiêu đề + bộ lọc)                            │ │
│  │  ├── .favorites-overview (flex, wrap)               │ │
│  │  │    (tổng quan: số lượng, categories)             │ │
│  │  ├── .favorite-type-tabs (flex, wrap)               │ │
│  │  │    (tab phân loại: illustrations, manga, ...)    │ │
│  │  ├── .favorites-grid (4 columns)                    │ │
│  │  │    └── .favorite-card × N                        │ │
│  │  └── .favorites-empty (border: dashed)              │ │
│  │       (hiển thị khi chưa có favorite)               │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Responsive breakpoints:**

| Màn hình | Số cột |
|---|---|
| ≥ 1080px | 4 cột |
| ≤ 1080px | 3 cột |
| ≤ 860px | 2 cột |
| ≤ 520px | 1 cột |

---

### 4.17. FollowUsersView (`/users/:id/following`, `/users/:id/followers`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .follow-users-page                                   │ │
│  │  ├── .profile-hero (height: 164px, gradient, center) │ │
│  │  │    (hero banner của user)                         │ │
│  │  └── .follow-content (max-width: 1220px)             │ │
│  │       ├── .follow-header (back link + avatar)        │ │
│  │       ├── .follow-tabs (flex, border-bottom)         │ │
│  │       │    (Following / Followers)                   │ │
│  │       ├── .follow-topline (flex, space-between)      │ │
│  │       │    (số lượng + search)                       │ │
│  │       └── .follow-grid (3 columns)                   │ │
│  │            └── <FollowUserCard /> × N                │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=1200px` | Grid 3 → 2 cột |
| `<=920px` | Grid 2 → 1 cột |

---

### 4.18. RequestManagementView (`/requests/manage`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .request-management (page-block)                     │ │
│  │  ├── .request-header (flex, max-width: 1180px)      │ │
│  │  │    (tiêu đề + mô tả)                             │ │
│  │  └── .management-grid (420px 1fr)                   │ │
│  │       │                                               │ │
│  │       ├── .term-card (form, grid gap: 0.9rem)        │ │
│  │       │    ├── .section-title                        │ │
│  │       │    └── .form-section                         │ │
│  │       │         (border, border-radius: 14px)        │ │
│  │       │         ├── .form-section-head               │ │
│  │       │         ├── .form-grid (2 columns)           │ │
│  │       │         └── .chip-row (flex, wrap)           │ │
│  │       │                                               │ │
│  │       └── .request-list-card                         │ │
│  │            ├── .section-title                        │ │
│  │            └── .request-row (flex, space-between)    │ │
│  │                 (mỗi dòng là một request)            │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Grid 2 cột: form term card (420px) + danh sách request (1fr).
- Form section có `border-radius: 14px`.
- Form grid 2 cột bên trong section.

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=960px` | Layout chuyển từ 2 cột → 1 cột |
| `<=680px` | Form grid bên trong chuyển từ 2 cột → 1 cột |

---

### 4.19. PaymentSandboxView (`/payments/sandbox`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .payment-sandbox (page-block)                        │ │
│  │  ├── .sandbox-header (flex, max-width: 1120px)      │ │
│  │  │    (tiêu đề + thông tin sandbox)                 │ │
│  │  └── .sandbox-grid (380px 1fr)                      │ │
│  │       │                                               │ │
│  │       ├── .sandbox-card (form)                       │ │
│  │       │    └── .form-grid (2 columns)                │ │
│  │       │         (các field thanh toán test)          │ │
│  │       │                                               │ │
│  │       ├── .sandbox-card (QR preview)                 │ │
│  │       │    ├── .qr-preview (grid)                    │ │
│  │       │    │    (hiển thị QR code)                   │ │
│  │       │    ├── dl (display: grid)                    │ │
│  │       │    │    (danh sách thông tin giao dịch)      │ │
│  │       │    └── .fee-box (border-radius: 10px)        │ │
│  │       │         (hiển thị phí)                       │ │
│  │       │                                               │ │
│  │       └── .sandbox-card.result-card (grid-column: 2) │ │
│  │            └── .result-box (grid, gap: 0.45rem)      │ │
│  │                 (kết quả thanh toán test)            │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Grid 2 cột: form (380px) + QR preview (1fr).
- Result card đặt ở `grid-column: 2`.

**Responsive:**

| Breakpoint | Thay đổi |
|---|---|
| `<=860px` | Layout chuyển từ 2 cột → 1 cột |
| `<=620px` | Form grid bên trong chuyển từ 2 cột → 1 cột |

---

### 4.20. NotFoundView (`/*`)

```text
┌──────────────────────────────────────────────────────────┐
│ MainLayoutTemplate                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ .not-found-wrap (max-width: 740px)                   │ │
│  │  ├── .error-code (font-size: clamp(...))             │ │
│  │  │    (số lỗi hiển thị lớn, responsive)             │ │
│  │  ├── <h1> (tiêu đề lỗi)                             │ │
│  │  └── .d-flex (action buttons)                        │ │
│  │       (nút "Go Home" + "Search")                    │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- Container `max-width: 740px`, centered.
- Error code dùng `clamp()` để responsive font-size.
- Action buttons ở cuối.

---

## 5. Standalone Pages (Không Dùng MainLayoutTemplate)

### 5.1. FeedView (`/feed`)

```text
┌──────────────────────────────────────────────────────────┐
│ .search-page (page-block, padding: 1.3rem)               │
│  ├── .search-header (flex)                               │
│  │    (tiêu đề + search bar)                             │
│  ├── .tag-strip (flex, wrap)                             │
│  │    (dải tag phổ biến)                                 │
│  ├── .result-tabs (flex, border-bottom)                  │
│  │    (tab: Illustrations / Manga / Novels)              │
│  ├── .toolbar (flex, wrap)                               │
│  │    (thanh công cụ: sort, filter)                     │
│  ├── .search-callout (max-width: 340px)                  │
│  │    (callout hướng dẫn tìm kiếm)                      │
│  ├── .result-grid (auto-fill, minmax(178px))            │
│  │    └── <ArtworkCard /> × N                           │
│  └── <SearchOptionsModal />                              │
│       (modal tùy chọn tìm kiếm nâng cao)                │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- **Không dùng `MainLayoutTemplate`** — dùng `.page-block` trực tiếp.
- Grid kết quả `auto-fill` với `minmax(178px)`.
- Có `SearchOptionsModal` cho tìm kiếm nâng cao.

---

### 5.2. LoginView (`/login`) & SignUpView (`/signup`)

```text
┌──────────────────────────────────────────────────────────┐
│ .auth-shell (100vh, background: dark, place-items: center)│
│  ├── <AppSearchBar variant="showcase" />                  │
│  │    (search bar dạng showcase)                         │
│  ├── .auth-overlay (position: absolute, inset: 0)        │
│  │    (lớp phủ gradient/overlay)                         │
│  └── .auth-card (max-width: 500px, position: relative)   │
│       ├── .brand-wrap (text-align: center)               │
│       │    (logo + brand name)                           │
│       ├── .social-icons (flex, center) [Login]           │
│       │    hoặc .social-stack (grid) [SignUp]            │
│       │    (các nút đăng nhập qua mạng xã hội)          │
│       └── <form> (display: grid, gap: 2)                 │
│            (form đăng nhập / đăng ký)                    │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- **Không dùng `MainLayoutTemplate`** — dùng `.auth-shell` full-viewport.
- Background tối, layout centered với `place-items: center`.
- Auth card `max-width: 500px`.
- Login dùng `.social-icons` (flex), SignUp dùng `.social-stack` (grid).

---

### 5.3. ~~PremiumView (`/premium`)~~ — **Removed**

Trang Premium đã được gỡ bỏ khỏi hệ thống. Route `/premium` không còn tồn tại.

---

### 5.4. AIView (`/ai`)

```text
┌──────────────────────────────────────────────────────────┐
│ .ai-test-page (100vh, dark gradient, padding: 40px)      │
│  └── .container (max-width: 800px)                       │
│       ├── <h1> (tiêu đề)                                  │
│       ├── .tabs (flex)                                   │
│       │    (Chat / Detect)                               │
│       └── .tab-content                                   │
│            │                                              │
│            ├── [Chat Tab] .chat-container (height: 500px) │
│            │    ├── .messages (flex: 1, overflow-y: auto) │
│            │    │    (lịch sử chat)                      │
│            │    └── .chat-input (flex)                   │
│            │         (input + nút gửi)                   │
│            │                                              │
│            └── [Detect Tab] .detect-container            │
│                 ├── .upload-area (border: dashed)         │
│                 │    (khu vực upload ảnh)                │
│                 └── .result (border-radius: 12px)        │
│                      (kết quả phát hiện)                 │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- **Không dùng `MainLayoutTemplate`** — full-screen standalone.
- Background gradient tối, padding 40px.
- Container `max-width: 800px`.
- Tab-based: Chat và Detect.

---

### 5.5. DrawingView (`/draw`)

```text
┌──────────────────────────────────────────────────────────┐
│ .drawing-app (100vw × 100vh, display: flex, flex-direction: column)
│  ├── .top-bar (height: 48px, flex, space-between)       │
│  │    ├── .top-bar-left                                 │
│  │    │    (menu, undo/redo)                            │
│  │    ├── .top-bar-center (tools)                       │
│  │    │    (công cụ vẽ: brush, eraser, shapes)         │
│  │    └── .top-bar-right (actions)                      │
│  │         (save, export, settings)                     │
│  │                                                       │
│  └── .main-area (flex: 1, display: flex, overflow: hidden)
│       ├── .left-toolbar (width: 220px, flex, column)    │
│       │    ├── .tool-section (color: 6-column grid)     │
│       │    │    (bảng màu 6 cột)                        │
│       │    ├── .tool-section (size slider)              │
│       │    │    (thanh trượt kích thước brush)          │
│       │    ├── .tool-section (opacity slider)           │
│       │    │    (thanh trượt độ mờ)                     │
│       │    └── .stroke-preview-section                   │
│       │         (xem trước nét vẽ)                      │
│       │                                                  │
│       ├── .canvas-container (flex: 1, overflow: hidden) │
│       │    └── <v-stage> (Konva canvas)                 │
│       │         (canvas vẽ chính - Konva.js)            │
│       │                                                  │
│       └── .layers-panel (width: 200px, flex, column)    │
│            ├── .panel-header (flex, space-between)       │
│            │    (tiêu đề Layers + nút thêm layer)       │
│            ├── .layer-list (flex: 1, overflow-y: auto)  │
│            │    (danh sách layer)                        │
│            └── .layer-actions                            │
│                 (actions: merge, delete, duplicate)      │
└──────────────────────────────────────────────────────────┘
```

> **Ghi chú:** ASCII art trên được xuống dòng để dễ đọc, cấu trúc thực tế là flex column toàn bộ.

**Đặc điểm:**

- **Không dùng `MainLayoutTemplate`** — full-screen canvas app.
- Chiếm toàn bộ viewport (`100vw × 100vh`).
- Layout flex column: topbar + main area.
- Main area flex row: left toolbar (220px) + canvas (flex:1) + layers panel (200px).
- Sử dụng Konva.js (`<v-stage>`) cho canvas.

---

### 5.6. AuthCallbackView (`/auth/callback`)

```text
┌──────────────────────────────────────────────────────────┐
│ .auth-callback-shell (100vh, display: flex, center)      │
│  └── .text-center                                        │
│       ├── .spinner-border                                │
│       │    (spinner loading)                             │
│       └── <p>Signing in with Google...</p>               │
│            (thông báo đang xử lý)                        │
└──────────────────────────────────────────────────────────┘
```

**Đặc điểm:**

- **Không dùng `MainLayoutTemplate`** — full-viewport centered.
- Hiển thị spinner + thông báo trong khi xử lý OAuth callback.
- Đơn giản nhất trong tất cả các layout.

---

## 6. Bảng Tổng Hợp Layout Patterns

| Pattern | Các trang sử dụng |
|---|---|
| **MainLayoutTemplate + grid slot** | Home, TypedHomeFeed, Discovery, NewestByAll, FollowingNewest, SearchResults, Rankings, ArtworkDetail, TagDetail, Account, Dashboard, Admin, Upload, Messages, Notifications, Favorites, FollowUsers, RequestManagement, PaymentSandbox, NotFound |
| **Auth shell + auth-card (centered)** | Login, SignUp |
| **Standalone page-block** | FeedView |
| **Full-screen standalone** | AI, Drawing, AuthCallback |
| **2-column (sidebar + main)** | Messages, HomeFeed (trong feed layout), ArtworkDetail (trên 1000px), SearchResults (user), RequestManagement, PaymentSandbox |
| **3-column dashboard** | Dashboard |
| **Multi-column CSS Grid** | Discovery, NewestByAll, FollowingNewest, Rankings, SearchResults (illust), Favorites, FollowUsers |
| **Flex filter/toolbar bars** | Discovery, NewestByAll, FollowingNewest, Rankings, SearchResults |
| **Full-screen canvas app** | Drawing |

---

## 7. Bảng Responsive Breakpoints

| Breakpoint | Ảnh hưởng |
|---|---|
| `<=1400px` | NewestByAll grid: 6 → 5 cột |
| `<=1200px` | MainLayout padding giảm; FollowUsers grid 3 → 2 cột; ArtworkDetail sidebar 290 → 300px |
| `<=1100px` | NewestByAll grid 5 → 4 cột; Dashboard grid từ `300px 1fr 300px` |
| `<=1080px` | Favorites grid 4 → 3 cột |
| `<=1000px` | ArtworkDetail 2 cột → 1 cột |
| `<=960px` | Dashboard grid 3 → 1 cột; RequestManagement grid 2 → 1 cột |
| `<=920px` | MainLayout margin giảm; HomeFeed 2 → 1 cột; Messages 2 → 1 cột; FeedView grid; Discovery grid |
| `<=900px` | NewestByAll grid 4 → 3 cột; Drawing toolbar/layers thu hẹp |
| `<=860px` | Favorites grid 3 → 2 cột; PaymentSandbox 2 → 1 cột |
| `<=768px` | Rankings container padding giảm, image 120px |
| `<=680px` | RequestManagement form-grid 2 → 1 cột |
| `<=640px` | Auth card padding giảm; Drawing toolbar/layers chuyển fixed |
| `<=620px` | PaymentSandbox form-grid 2 → 1 cột |
| `<=600px` | NewestByAll grid 3 → 2 cột |
| `<=520px` | Favorites grid 2 → 1 cột |

---

> **Ghi chú:** Tài liệu này được tạo dựa trên phân tích mã nguồn thực tế. Khi có thay đổi về layout, vui lòng cập nhật tài liệu tương ứng.
