# Trang Thông báo (NotificationsView)

## Tổng quan

`NotificationsView` hiển thị danh sách thông báo cho người dùng — bao gồm thông báo về tương tác (like, bookmark, follow), comment, và các sự kiện khác. Hỗ trợ đánh dấu đã đọc, lọc chưa đọc, và infinite scroll.

Hình 1: Giao diện trang Notifications với danh sách thông báo.

## Route

| Route | Yêu cầu | Mô tả |
|-------|---------|-------|
| `/notifications` | Đăng nhập | Danh sách thông báo |

## Cấu trúc trang

### 1. Header

| Thành phần | Mô tả |
|------------|-------|
| **Title** | "Notifications" (h4) |
| **Unread count** | "Unread: {count}" — số thông báo chưa đọc |
| **Checkbox "Unread only"** | Lọc chỉ hiển thị thông báo chưa đọc |
| **Nút "Mark all read"** | Đánh dấu tất cả đã đọc (hiển thị khi có unread > 0) |
| **Nút "Refresh"** | Tải lại danh sách thông báo |

### 2. Danh sách thông báo

Mỗi thông báo hiển thị dạng card (`card border-0 shadow-sm`):

| Thành phần | Mô tả |
|------------|-------|
| **Avatar** | Avatar người thực hiện hành động (actor). Fallback: icon `fa-regular fa-user` |
| **Message** | Nội dung thông báo (ví dụ: "User X liked your artwork") |
| **Actor name + time** | Tên actor · thời gian tương đối (formatRelativeTime) |
| **Unread indicator** | Nền xanh nhạt (`rgba(59,130,246,0.04)`) + viền trái xanh 3px |

### 3. Infinite scroll

- Sentinel element ở cuối danh sách.
- `IntersectionObserver` với `rootMargin: 200px` — tải thêm khi scroll gần cuối.
- Hiển thị "Loading more..." khi đang tải.
- Hiển thị "No more notifications." khi đã hết.

## Dữ liệu được tải

| API endpoint | Dữ liệu | Phân trang |
|--------------|---------|------------|
| `notificationStore.fetchNotifications({ unread, limit: 20 })` | Thông báo | 20/trang |
| `notificationStore.loadMoreNotifications(...)` | Thêm thông báo | Infinite scroll |

## Polling

- Tự động poll mỗi `POLL_INTERVAL` (không xác định trong source — có thể cấu hình).
- Poll chỉ chạy khi user authenticated và page visible.

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Not logged in** | "You are not logged in" + nút "Go to login" |
| **Loading** | "Loading notifications..." |
| **Error** | Thông báo lỗi (text-danger) |
| **Empty** | "No notifications yet." |

## Tương tác

- **Click "Mark all read"** → đánh dấu tất cả đã đọc
- **Click "Refresh"** → tải lại danh sách
- **Toggle "Unread only"** → lọc thông báo
- **Scroll** → infinite scroll tải thêm

## Ghi chú

- Thông báo使用 `formatRelativeTime()` từ `utils/date.js` (ví dụ: "2 hours ago").
- Actor data populated từ backend (userId, avatar, displayName).
- IntersectionObserver disconnect khi component unmount.
- Poll timer clear khi component unmount.
