# Menu Bên (AppSidebarMenu)

## Tổng quan

`AppSidebarMenu` là thanh điều hướng dọc nằm ở bên trái giao diện, cung cấp các liên kết đến tất cả trang chính trong hệ thống IlluWrl. Component này nằm bên trong `MainLayoutTemplate`.

Hình 1: Giao diện AppSidebarMenu ở chế độ expanded.

## Các trạng thái

| Trạng thái | Mô tả |
|------------|-------|
| **Collapsed (mặc định)** | Sidebar ẩn hoàn toàn, chỉ hiện khi người dùng nhấn nút toggle. |
| **Expanded** | Sidebar mở rộng, hiển thị đầy đủ icon và nhãn văn bản. Chiều rộng 240px. |
| **Compact** | Chế độ thu gọn (icon-only), chỉ hiển thị biểu tượng, không hiển thị văn bản. |

## Cấu trúc

### Phần thương hiệu (Brand Section)

- Logo/text "IlluWrl" — liên kết đến trang chủ.
- Nút toggle (◀/▶) để đóng/mở sidebar.

### Nhóm điều hướng (Collapsible Navigation Groups)

Sidebar được tổ chức thành các nhóm có thể thu gọn/mở rộng:

**1. Home**
- Mục duy nhất, dẫn về trang chủ.

**2. Nội dung (Content)**
- Illustrations (`/illustrations`)
- Manga (`/manga`)
- GIF (`/gifs`)
- Novels (`/novels`)
- Plans (`/plans`)

**3. Khám phá (Explore)**
- Following (`/newest_by_followed`)
- Discovery (`/discovery`)
- Rankings (`/rankings`)
- My Favorite (`/favorites`)
- Bookmarks (`/bookmarks`)

**4. Tiện ích (Utilities)**
- Drawing (`/draw`)

### Phần quản lý (Manage Section)

Chỉ hiển thị cho người dùng đã đăng nhập:

- Dashboard (`/dashboard`)
- Requests (`/requests/manage`)
- Browsing history (`/history`)
- My Reports (`/my-reports`)
- Admin (`/admin`) — **chỉ hiển thị với người dùng có role `admin`**

### Phần người dùng (User Section)

Hiển thị ở cuối sidebar khi đã đăng nhập:

- Avatar hình tròn
- Tên hiển thị (display name)
- Tên người dùng (@username)
- Nút đăng xuất (Logout)

### Phần khách (Guest Section)

Khi chưa đăng nhập, hiển thị:

- Liên kết "Đăng nhập để khám phá" với kiểu dashed border và icon mũi tên.

## Đánh dấu trang hiện tại (Active Route)

Trang đang được truy cập được đánh dấu bằng:

- **Màu nhấn (accent color)** — màu sắc chủ đạo của sidebar.
- **Viền trái (left border)** — một đường viền dọc bên trái mục đang active.

## Lưu trạng thái

Trạng thái thu gọn/mở rộng của các nhóm điều hướng được lưu vào **localStorage**, giúp duy trì trạng thái qua các lần truy cập.

Hình 2: AppSidebarMenu với các nhóm điều hướng được mở rộng.

## Hành vi tương tác

- **Hover vào mục**: Đổi màu nền nhẹ, cursor pointer.
- **Click vào nhóm**: Mở rộng/thu gọn nhóm con.
- **Click vào mục con**: Điều hướng đến trang tương ứng.
- **Toggle sidebar**: Nút ở góc trên bên phải của sidebar để đóng/mở.
