# Trang Quản trị (AdminManagementView)

## Tổng quan

`AdminManagementView` là trang quản trị hệ thống — cho phép admin quản lý users, artworks, reports, tags, AI settings, và banners. Giao diện hub với overview cards và 6 tab quản lý.

Hình 1: Giao diện Admin Hub với overview cards và section tabs.

## Route

| Route | Yêu cầu | Mô tả |
|-------|---------|-------|
| `/admin` | Admin role | Quản trị hệ thống |

## Quyền truy cập

- **Not logged in** → "You are not logged in" + nút login.
- **Not admin** → "You do not have permission to access this page."
- **Admin** → Hiển thị toàn bộ giao diện.

## Cấu trúc trang

### 1. Admin Header

- Title: "Admin Management Hub"
- Mô tả: "Manage users, monitor key metrics, and moderate content."
- Nút "Refresh all" — tải lại toàn bộ dữ liệu.

### 2. AdminOverviewCards — Tổng quan

- Hiển thị các metric cards: tổng users, artworks, reports, v.v.
- Component `AdminOverviewCards`.

### 3. AdminSectionTabs — Tab điều hướng

6 tab chính:

| Tab | ID | Mô tả |
|-----|-----|-------|
| **Users** | `users` | Quản lý người dùng |
| **Artworks** | `artworks` | Quản lý tác phẩm |
| **Reports** | `reports` | Xử lý báo cáo |
| **Tags** | `tags` | Quản lý tag |
| **AI Settings** | `ai` | Cài đặt AI |
| **Banners** | `banners` | Quản lý banner |

Tab state sync với URL: `?tab=users|artworks|reports|tags|ai|banners`.

### 4. Tab Users — AdminUserManagementPanel

- Search by username/email.
- Filter by role.
- Table: Username, Email, Role, Created, Actions.
- Actions: Set role (user/admin), Delete user.

### 5. Tab Artworks — AdminArtworkManagementPanel

- Search by title.
- Filter by type (illust/manga/gif/novel).
- Table: Title (linked), Owner, Type, Created, Delete.
- Pagination.

### 6. Tab Reports — AdminReportPanel + AdminHiddenArtworksPanel

Sub-filters (pill buttons):

| Sub-tab | Mô tả |
|---------|-------|
| **Artwork** | Báo cáo artwork |
| **Comment** | Báo cáo comment |
| **User** | Báo cáo user |
| **Hidden** | Artwork đã ẩn |

- **Artwork reports**: Resolve (với prompt nhập lý do) + Hide artwork.
- **Comment reports**: Resolve/Delete comment.
- **User reports**: Warn/Suspend/Dismiss.
- **Hidden artworks**: Unhide.

### 7. Tab Tags — AdminTagManagementPanel

- Search by tag name.
- Table: Tag name, Created, Actions.
- Actions: Edit, Delete (confirm modal), Merge tags (prompt modal).

### 8. Tab AI Settings — AdminAISettingsPanel

- Component `AdminAISettingsPanel`.

### 9. Tab Banners — AdminBannerPanel

- Component `AdminBannerPanel` — CRUD banners.

### 10. Modals

| Modal | Mô tả |
|-------|-------|
| **AdminConfirmModal** | Xác nhận hành động (delete, hide, unhide) |
| **AdminPromptModal** | Nhập text (resolve reason, merge tag name) |

## Dữ liệu được tải

| API endpoint | Dữ liệu |
|--------------|---------|
| `useAdminOverview` | Overview stats |
| `useAdminUsers` | Users list + pagination |
| `useAdminArtworks` | Artworks list + pagination |
| `useAdminReports` | Reports (artwork/comment/user/hidden) |
| `useAdminTags` | Tags list + pagination |

## Responsive

- Responsive theo MainLayoutTemplate.
- Sub-filter bar wrap khi hẹp.

## Tương tác

- **Tab switching** → URL sync, load data
- **Search/Filter** → load lại danh sách
- **Delete user/artwork** → confirm modal → API call
- **Resolve report** → prompt modal (nhập lý do) → API call
- **Hide/Unhide artwork** → confirm modal → API call
- **Merge tags** → prompt modal (nhập tag đích) → API call
- **Refresh all** → tải lại toàn bộ

## Ghi chú

- Sử dụng 5 composables: `useAdminOverview`, `useAdminUsers`, `useAdminArtworks`, `useAdminReports`, `useAdminTags` + 1 modal composable `useAdminModals`.
- Delete user does NOT cascade — related documents (artworks, comments, etc.) are not cleaned up.
- Comment report resolve = delete comment + resolve report.
- User report actions: warn (WARNING note), ban (isSuspended=true), dismiss.
- Admin buttons use `action-pill` classes from shared CSS.
- Report sub-filters: Artwork, Comment, User, Hidden (no Request tab).
