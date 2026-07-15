# Thanh Trên cùng (AppTopBar)

## Tổng quan

`AppTopBar` là thanh điều hướng nằm ở đầu trang, cố định phía trên cùng của vùng nội dung chính. Component này chịu trách nhiệm hiển thị các điều khiển điều hướng và thông tin người dùng.

Hình 1: Giao diện AppTopBar khi đã đăng nhập.

## Bố trí

Thanh trên cùng được chia làm hai khu vực chính: **bên trái** và **bên phải**.

### Khu vực bên trái

| Thành phần | Mô tả |
|------------|-------|
| **Toggle sidebar** | Nút hamburger (☰) để mở/đóng sidebar. Ẩn khi sidebar đang ở chế độ expanded. |
| **Site name** | Liên kết "IlluWrl" dẫn về trang chủ (`/`). |
| **Search controls** | `AppTopBarSearchControls` — thanh tìm kiếm tích hợp với bộ chọn phạm vi (scope selector), ô nhập truy vấn và nút tuỳ chọn tìm kiếm. |

### Khu vực bên phải

| Thành phần | Mô tả |
|------------|-------|
| **Post menu** | `AppTopBarPostMenu` — menu đăng tải tác phẩm mới (Illustration, Manga, GIF, Novel). |
| **Messages panel** | `AppTopBarMessagePanel` — biểu tượng phong bì, hiển thị số tin nhắn chưa đọc. Nhấp vào mở panel tin nhắn. |
| **Notifications panel** | `AppTopBarNotificationPanel` — biểu tượng chuông, hiển thị số thông báo chưa đọc. Nhấp vào mở panel thông báo. |
| **User menu** | `AppTopBarUserMenu` — avatar người dùng, nhấp vào mở dropdown menu. |
| **Services menu** | `AppTopBarServicesMenu` — menu dịch vụ, chứa liên kết đến Drawing Tool. |

## Trạng thái chưa đăng nhập

Khi người dùng chưa đăng nhập, giao diện thay đổi như sau:

- Biểu tượng tin nhắn và thông báo trở thành liên kết đơn giản (dẫn đến trang đăng nhập).
- Menu người dùng được thay thế bằng nút **"Đăng nhập"** (login button).
- Menu đăng tải được ẩn hoặc thay bằng nút đăng nhập.

## Cập nhật thời gian thực

`AppTopBar` sử dụng **Socket.IO** để nhận cập nhật thời gian thực:

- Số lượng thông báo chưa đọc được cập nhật tự động khi có thông báo mới.
- Số lượng tin nhắn chưa đọc được cập nhật khi có tin nhắn mới.
- Badge hiển thị số lượng được làm mới mà không cần tải lại trang.

Hình 2: AppTopBar với badge thông báo và tin nhắn.

## Props

Component này nhận các props: `siteName` (String, default 'IlluWrl'), `searchPlaceholder` (String, default 'Search by title, tag, or artist') — phần còn lại của dữ liệu được lấy từ store (Pinia) và Socket.IO.

## Hành vi tương tác

- **Hover**: Các biểu tượng và nút có hiệu ứng chuyển màu nền nhẹ.
- **Click mở panel**: Messages panel và Notifications panel mở dạng dropdown hoặc modal nhỏ.
- **Click ngoài**: Các panel tự động đóng khi nhấp ra ngoài.

## Phạm vi tìm kiếm

Scope selector cho phép chọn phạm vi tìm kiếm: Illustrations, Manga, GIF, Novels, User. Khi thay đổi phạm vi, hành vi của ô nhập và nút tìm kiếm thay đổi tương ứng (ví dụ: chọn User sẽ điều hướng đến `/search/users`).
