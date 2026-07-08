# Trang Tài khoản / Profile (AccountView)

## Tổng quan

`AccountView` là trang đa năng phục vụ cả hai mục đích: xem/sửa profile cá nhân và xem profile người dùng khác. Trang sử dụng `MainLayoutTemplate` và cung cấp 50+ giá trị qua `provide/inject` cho các child component.

Hình 1: Giao diện trang Account/Profile.

## Route

| Route | Mô tả |
|-------|-------|
| `/account` | Profile của chính mình |
| `/account?user=<userId>` | Profile của user khác |
| `/account?tab=bookmarks` | Tab Bookmarks được chọn sẵn |
| `/account?tab=requests` | Tab Requests được chọn sẵn |
| `/account?user=<id>&tab=requests` | Tab Requests trên profile người khác |

## Cấu trúc trang

### 1. AccountProfileSection — Component chính

- Component duy nhất hiển thị khi có user data.
- Quản lý toàn bộ UI profile thông qua `provide/inject` pattern.

### 2. Các tab chính (Main Tabs)

| Tab | Mô tả |
|-----|-------|
| **Works** | Danh sách artwork đã đăng |
| **Bookmarks** | Tác phẩm đã đánh dấu |
| **Likes** | Tác phẩm yêu thích |
| **Requests** | Commission requests (nếu creator chấp nhận) |
| **Series** | Danh sách series |

### 3. Works tab

- Lọc theo loại: All · Illustrations · Manga · GIF · Novels.
- Hiển thị artwork grid.
- Nút "Show All" / "Load More" phân trang.
- Featured works section (optional).

### 4. Bookmarks tab

- Lọc theo loại: All · Illustrations · Manga · GIF · Novels.
- Sử dụng BookmarkCard component (bookmark icon toggle).

### 5. Likes tab

- Lọc theo loại: All · Illustrations · Manga · GIF · Novels.
- Sử dụng ArtworkCard component (heart icon toggle).

### 6. Requests tab

- Hiển thị khi creator `isAcceptingRequests === true`.
- Danh sách request terms với chi tiết (title, tier, price, slots).

### 7. Edit Modals

| Modal | Mô tả |
|-------|-------|
| **Profile Edit Modal** | Chỉnh sửa displayName, bio, location, gender, birthday |
| **Cover Upload Modal** | Upload/preview/xoá cover image |
| **Avatar Upload Modal** | Upload/preview avatar |

### 8. Delete Cover Confirmation

- Modal xác nhận xoá cover image.
- Nút "Cancel" + "Delete" (danger color).

## Dữ liệu được tải

Dữ liệu quản lý qua `useProfilePage()` composable — load profile user, artworks, bookmarks, likes, series, request terms.

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Not logged in (own profile)** | `AccountLoggedOutPrompt` — hướng dẫn đăng nhập |
| **Loading** | Skeleton |
| **Error** | Thông báo lỗi |

## Responsive

- Responsive theo MainLayoutTemplate (sidebar collapse).

## Tương tác

- **Switch tab** → thay đổi nội dung
- **Click artwork** → điều hướng đến chi tiết
- **Click "Edit Profile"** → mở modal chỉnh sửa
- **Upload avatar/cover** → preview + confirm
- **Follow/Unfollow** (profile người khác) → AJAX toggle
- **Delete cover** → xác nhận trước khi xoá

## Ghi chú

- `provide/inject` pattern: AccountView cung cấp ~50+ values (user, artworks, bookmarks, modals, handlers). Child components nhận qua inject — không dùng props.
- `useProfilePage()` composable quản lý toàn bộ state profile — tránh Pinia store vì state chỉ cần trong scope view.
- Delete cover modal use `Teleport to="body"` — overlay positioned fixed.
- Profile cover chỉ từ user-set (`user.coverImage`), không fallback từ artworks.
