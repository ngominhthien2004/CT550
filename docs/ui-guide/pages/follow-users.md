# Trang Người dùng Theo dõi / Người theo dõi (FollowUsersView)

## Tổng quan

`FollowUsersView` hiển thị danh sách những người mà một user đang theo dõi (following) hoặc những người đang theo dõi user đó (followers). Trang này dùng chung một component cho cả hai chế độ, phân biệt qua tham số route name. Trang sử dụng `MainLayoutTemplate` với grid 3 cột.

Hình 1: Giao diện trang Following/Followers với grid user cards.

## Route

| Route                   | Yêu cầu | Mô tả                              |
| ----------------------- | ------- | ---------------------------------- |
| `/users/:id/following`  | Không   | Danh sách user `:id` đang theo dõi |
| `/users/:id/followers`  | Không   | Danh sách người theo dõi user `:id` |

## Cấu trúc trang

### 1. Header

- **Back link**: Quay lại trang profile (`/account?user=:id`).
- **Avatar + Display Name** của chủ tài khoản (useA). 

### 2. Tab Navigation

- Hai tab route-link: **Following** / **Followers**.
- Tab active được gạch chân (underline style).
- Mặc định active theo route hiện tại.
- Số lượng hiển thị trên mỗi tab.

### 3. Users Count

- Dòng "Users" kèm số lượng hiện tại.

### 4. Follow Grid

- Grid 3 cột (`<div class="follow-grid">`).
- Mỗi ô là component `<FollowUserCard>` hiển thị:
  - Avatar + Display Name.
  - 4 artwork previews nhỏ (thumbnails tác phẩm của user đó).
  - Follow/Unfollow button (nếu đã đăng nhập).
  - Trạng thái đang toggle (loading state cho nút).

## Dữ liệu được tải

| API endpoint                      | Dữ liệu                             |
| --------------------------------- | ----------------------------------- |
| `GET /api/users/:id/following`    | Danh sách following                 |
| `GET /api/users/:id/followers`    | Danh sách followers                 |
| `GET /api/artworks?user=:userId`  | Artwork previews cho mỗi user (4)   |

## Trạng thái

| Trạng thái  | Hiển thị                     |
| ----------- | ---------------------------- |
| **Loading** | Skeleton cards (nhiều ô)     |
| **Error**   | Thông báo "Could not load"   |
| **Empty**   | "No users yet" + icon        |

## Tương tác

- **Click tab** → Chuyển giữa Following / Followers (thay đổi route).
- **Click Follow/Unfollow** → Gọi API toggle follow + cập nhật UI.
- **Click user card** → Điều hướng đến profile của user đó.
- **Click artwork preview** → Điều hướng đến artwork detail.

## Ghi chú

- Trang sử dụng `useFollowStore` để quản lý trạng thái follow.
- Chế độ following/followers được xác định qua route name (`users-following` / `followers`).
- Follow/Unfollow button chỉ hiển thị khi user đã đăng nhập và không phải là chính mình.
