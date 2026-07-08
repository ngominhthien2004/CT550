# Trang Tin nhắn (MessagesView)

## Tổng quan

`MessagesView` là giao diện nhắn tin 2 chiều — hiển thị danh sách hội thoại (thread list) ở bên trái và khu vực chat ở bên phải. Hỗ trợ real-time qua Socket.IO, presence tracking, và gửi ảnh đính kèm.

Hình 1: Giao diện MessagesView với thread list và chat pane.

## Route

| Route | Yêu cầu | Mô tả |
|-------|---------|-------|
| `/messages` | Đăng nhập | Tin nhắn |
| `/messages?user=<userId>` | Đăng nhập | Mở thread với user cụ thể |

## Cấu trúc trang

### 1. ThreadListPane — Danh sách hội thoại

- Component bên trái, hiển thị danh sách các cuộc trò chuyện.
- Mỗi thread hiển thị: avatar đối phương, tên, preview tin nhắn cuối, thời gian, unread badge.
- Thread sắp xếp theo thời gian tin nhắn mới nhất.
- Unread messages có thể đánh dấu đã đọc khi chọn thread.

### 2. ThreadChatPane — Khu vực chat

- Component bên phải, hiển thị tin nhắn của thread đã chọn.
- Header: tên đối phương + avatar + presence status (online/typing).
- Timeline tin nhắn phân ngày (day separator).
- Hỗ trợ: reply, delete, search within thread.

### 3. Tìm kiếm trong thread

- Ô tìm kiếm trong ThreadChatPane.
- Gọi `messageApi.searchThread(peerId, query)` để tìm tin nhắn.
- Hiển thị kết quả thay thế timeline gốc.

### 4. Gửi tin nhắn

- Input textarea với nút gửi.
- Hỗ trợ gửi ảnh: chọn file hoặc drag & drop.
- Reply quote: hiển thị "Replying to @username" trước nội dung.
- Enter để gửi, Shift+Enter để xuống dòng.

### 5. Hành động thread

| Hành động | Mô tả |
|-----------|-------|
| **Block user** | Chặn user — không nhận tin nhắn từ họ |
| **Report user** | Báo cáo user với lý do |

## Dữ liệu được tải

| API endpoint | Dữksiąż | Ghi chú |
|--------------|---------|---------|
| `getMyMessages({ box: 'inbox', limit: 120 })` | Tin nhắn nhận | |
| `getMyMessages({ box: 'sent', limit: 120 })` | Tin nhắn gửi | |
| `userApi.getPresence(peerId)` | Trạng thái online/typing | Poll mỗi 30s / 5s |
| `messageApi.searchThread(peerId, q)` | Tìm kiếm trong thread | |

## Real-time

| Cơ chế | Tần suất | Mô tả |
|--------|----------|-------|
| **Socket.IO** | Real-time | Sự kiện `message:new` — tin nhắn mới |
| **Presence polling** | 30s (online) / 5s (typing) | Kiểm tra trạng thái đối phương |
| **Message polling** | 10s | Poll tin nhắn mới từ server |
| **Notification sound** | Khi có tin mới | Web Audio API — oscillator tone |

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Not logged in** | "You are not logged in" + nút "Go to login" |
| **Loading** | Spinner |
| **Empty** | "Select a conversation" |
| **No thread selected** | Placeholder với hướng dẫn |

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 768px | 2 cột: thread list (260px) + chat pane |
| < 768px | Thread list overlay (absolute position), chat占据 toàn bộ |

## Tương tác

- **Chọn thread** → hiển thị tin nhắn, đánh dấu đã đọc
- **Gửi tin nhắn** → optimistic update, Socket.IO broadcast
- **Reply** → quote message trước khi gửi
- **Delete** → soft delete (chỉ xóa phía mình)
- **Block** → xác nhận, chặn user
- **Drag & drop ảnh** → đính kèm hình ảnh

## Ghi chú

- Socket.IO connection managed qua `useSocket()` composable.
- Messages use `formatShortDate()` từ `utils/date.js` cho timestamp.
- Notification sound tạo bằng Web Audio API (oscillator), không dùng file audio.
- Thread timeline format: day separator + messages, sắp xếp theo `createdAt` ASC.
- Reply format: `> Replying to @username\n\ncontent` — backward compatible với format cũ.
