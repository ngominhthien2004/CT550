# Trang Bảng tổng quan (DashboardView)

## Tổng quan

`DashboardView` là trang tổng quan cho creator — hiển thị thống kê tác phẩm, phản hồi, và cho phép quản lý tác phẩm đã đăng. Trang này sử dụng `MainLayoutTemplate` với hero banner gradient và hệ thống tab.

Hình 1: Giao diện Dashboard với hero banner và thống kê.

## Route

| Route        | Yêu cầu   | Mô tả                  |
| ------------ | --------- | ---------------------- |
| `/dashboard` | Đăng nhập | Bảng tổng quan creator |

## Cấu trúc trang

### 1. Dashboard Hero Banner

- Banner gradient từ `#0096fa` (xanh dương) đến `#7c3aed` (tím), bo tròn 16px.
- Hiển thị:
  - Kicker text: "DASHBOARD" (uppercase, letter-spacing 0.1em).
  - Title: "Welcome back, {displayName}" (font 1.8rem, weight 900).
  - Description: text giới thiệu dashboard.
  - Stats pills: `{count} works` · `{count} views` · `{count} likes` — nền bán trong suốt (`rgba(255,255,255,0.2)`).
- Nút "Guide" (help icon `fa-regular fa-circle-question`) ở góc phải hero.

### 2. Coachmark Onboarding (2 bước)

- Hiển thị lần đầu khi user chưa seen guide (localStorage key: `dashboardOnboardingSeen:<userId>`).
- Bước 1: "Welcome" — giới thiệu dashboard.
- Bước 2: "Discover More" — hướng dẫn探索 tính năng.
- Modal overlay (Teleport to body), nút "Next" / "Try It Now".
- Có thể bật lại bằng nút "Show Guide" / "Start Guide" trên hero.

### 3. CreatorDashboardTabs

- Component tabs underline-style (matching HomeTabs design).
- 3 tabs: **Home** · **Works** · **Reactions**.
- URL sync: `?tab=home|works|reactions`.

### 4. Tab Home

- **CreatorRecentlyUploadedPanel**: Hiển thị 3 artwork gần nhất. Nút "Post" link đến `/upload/illust`.
- **CreatorReactionsCard**: Tổng hợp thống kê views/likes/bookmarks/comments. Nút "View details" chuyển sang tab Reactions.

### 5. Tab Works

- Component `DashboardWorksPanel`: Quản lý danh sách tác phẩm của user.
- CRUD operations cho artwork.

### 6. Tab Reactions

- Component `DashboardReactionsPanel`: Chi tiết thống kê phản hồi (views, likes, bookmarks, comments).

## Dữ liệu được tải

| API endpoint                                | Dữ liệu                 | Giới hạn |
| ------------------------------------------- | ----------------------- | -------- |
| `getArtworks({ user: userId, limit: 120 })` | Tất cả artwork của user | 120      |

## Trạng thái

| Trạng thái        | Hiển thị                        |
| ----------------- | ------------------------------- |
| **Not logged in** | Hero banner + nút "Go to login" |
| **Loading**       | "Loading dashboard..."          |
| **Error**         | Thông báo lỗi                   |

## Responsive

| Kích thước | Hành vi                         |
| ---------- | ------------------------------- |
| ≥ 960px    | Grid 3 cột cho reactions        |
| < 960px    | Grid 1 cột                      |
| < 640px    | Hero co lại, title font 1.35rem |

## Tương tác

- **Click "Post"** → `/upload/illust`
- **Click tab** → chuyển nội dung dashboard
- **Click "Guide"** → mở coachmark modal
- **Click "View details"** → chuyển sang tab Reactions
- **Click "Manage Dashboard"** (từ series detail) → mở tab Works

## Ghi chú

- Trang sử dụng `vue-i18n` cho đa ngôn ngữ.
- Coachmark state tracked per-user qua localStorage, không gọi API.
- Dashboard loads up to 120 artworks để compute thống kê — có thể cần pagination nếu user có nhiều tác phẩm.
