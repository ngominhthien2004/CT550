# Menu Người dùng (AppTopBarUserMenu)

## Tổng quan

`AppTopBarUserMenu` là dropdown menu xuất hiện khi nhấp vào avatar người dùng trên `AppTopBar`. Menu này cung cấp các liên kết nhanh đến các trang cá nhân và quản lý tài khoản.

Hình 1: AppTopBarUserMenu dropdown mở rộng với các mục.

## Trigger

| Yếu tố | Mô tả |
|--------|-------|
| **Avatar** | Hình ảnh đại diện của người dùng, hình tròn, kích thước 32x32px. |
| **Hành vi** | Nhấp chuột mở dropdown; nhấp ra ngoài hoặc nhấp lại để đóng. |

## Cấu trúc Menu

### Hàng thông tin thống kê (Stats Row)

Hiển thị hai số liệu chính:

- **Đang theo dõi (Following)**: Số lượng người dùng mà người dùng hiện tại đang theo dõi.
- **Người theo dõi (Followers)**: Số lượng người dùng đang theo dõi người dùng hiện tại.

### Liên kết chính (Main Links)

| Mục | Route | Mô tả |
|-----|-------|-------|
| **Dashboard** | `/dashboard` | Trang tổng quan hoạt động và thống kê cá nhân. |
| **Requests** | `/requests/manage` | Quản lý yêu cầu (commission) — tạo, duyệt, theo dõi trạng thái. |
| **Admin** | `/admin` | Trang quản trị hệ thống. **Chỉ hiển thị khi role = `admin`**. |

### Thư viện (Library Links)

| Mục | Route | Mô tả |
|-----|-------|-------|
| **My Favorite** | `/favorites` | Tác phẩm yêu thích — tất cả tác phẩm đã like. |
| **Bookmarks** | `/bookmarks` | Tác phẩm đã đánh dấu, có tổ chức theo thư mục. |
| **Browsing history** | `/history` | Lịch sử xem tác phẩm gần đây. |

### Cài đặt (Settings Link)

| Mục | Route | Mô tả |
|-----|-------|-------|
| **Account settings** | `/account` | Cài đặt tài khoản: thông tin cá nhân, mật khẩu, thông báo, giao diện. |

### Nút đăng xuất (Logout Button)

Nút **"Đăng xuất"** ở cuối menu, ngăn cách bởi đường kẻ ngang:

- Màu đỏ hoặc màu cảnh báo.
- Icon thoát (sign-out-alt) bên trái.
- Khi nhấp: xoá token và thông tin người dùng khỏi localStorage, chuyển hướng về trang chủ.

## Mô tả các trang liên quan

- **Dashboard**: Tổng quan về hoạt động của người dùng — số tác phẩm đã đăng, lượt xem, lượt thích, lượt đánh dấu và biểu đồ thống kê.
- **Requests**: Hệ thống yêu cầu vẽ tranh (commission) — người dùng có thể gửi yêu cầu và theo dõi trạng thái xử lý.
- **My Favorite**: Danh sách tác phẩm người dùng đã thích, có bộ lọc theo loại (Illustration, Manga, Novel, GIF).
- **Bookmarks**: Danh sách tác phẩm đã đánh dấu, hỗ trợ tổ chức theo thư mục.
- **Browsing history**: Lịch sử xem, hỗ trợ tìm kiếm và lọc theo ngày.
- **Account settings**: Trang cài đặt tài khoản với nhiều tab: Profile, Account, Notifications, Appearance, Blocked Users.

Hình 2: Menu người dùng với các mục mở rộng.

## Hành vi

- **Hover**: Các mục trong menu đổi màu nền khi di chuột qua.
- **Logout**: Xác nhận (tuỳ chọn) trước khi đăng xuất, sau đó chuyển hướng về `/` và xoá toàn bộ session.
