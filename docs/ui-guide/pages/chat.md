# Trang Chat AI (ChatView)

## Tổng quan

`ChatView` là giao diện chat với AI Assistant — hỗ trợ nhiều session, gợi ý nhanh, và đánh dấu tin nhắn sử dụng công cụ. Giao diện 2 cột: sidebar session bên trái và khu vực chat chính bên phải.

Hình 1: Giao diện ChatView với session sidebar và khu vực chat.

## Route

| Route | Mô tả |
|-------|-------|
| `/chat` | Chat với AI Assistant |

## Cấu trúc trang

### 1. Session Sidebar (260px)

| Thành phần | Mô tả |
|------------|-------|
| **Header** | "Lịch sử chat" + nút "+" tạo session mới |
| **Session list** | Danh sách session, sắp xếp theo `updatedAt` |
| **Session item** | Title (truncated 50 chars) + thời gian + nút xóa (hiện khi hover) |
| **Toggle button** | Chevron trái/phải để collapse/expand sidebar |

- Session active có nền accent màu.
- Nút xóa session: `confirm('Xóa cuộc trò chuyện này?')` trước khi xóa.

### 2. Chat Header

- Icon robot 🤖 + "AI Assistant"
- Mô tả: "Trợ lý thông minh cho IlluWrl — tìm kiếm, gợi ý và tóm tắt artwork"
- Nút "New Chat" (+ icon) ở bên phải.

### 3. No Session Placeholder

- Hiển thị khi chưa có session nào được chọn.
- Icon robot lớn 🤖 + "Chào bạn!" + nút "Tạo chat mới".

### 4. Messages Area

| Loại tin nhắn | Hiển thị |
|---------------|----------|
| **User** | Bubble nền accent, căn phải, avatar 👤 |
| **Assistant** | Bubble nền surface-alt, căn trái, avatar 🤖 |
| **Error** | Bubble nền đỏ nhạt, chữ danger |
| **Welcome** | Bubble gradient (purple), chữ trắng |
| **Typing** | 3 dots animation (typing-pulse) |

- Mỗi tin nhắn hiển thị timestamp (formatShortDate) + badge "Sử dụng công cụ" (nếu `toolUsed`).

### 5. Suggested Prompts

Hiển thị khi không đang gửi tin:

| Icon | Label | Prompt |
|------|-------|--------|
| 🔍 | Tìm artwork | "Tìm artwork về phong cảnh thiên nhiên" |
| 👤 | Tìm user | "Tìm user có tên là minh" |
| 💡 | Gợi ý cho tôi | "Gợi ý cho tôi artwork hay về fantasy" |
| 🎨 | Hỏi về nghệ thuật | "Cho tôi hỏi về phong cách vẽ manga" |

- Click vào prompt → tự động gửi tin nhắn.

### 6. Input Area

- Textarea bo tròn (`border-radius: 1.5rem`), placeholder "Nhập tin nhắn...".
- Nút gửi tròn (bo tròn 50%, icon `fa-paper-plane`).
- Enter để gửi, Shift+Enter để xuống dòng.
- Disabled khi đang gửi (`chatStore.isLoading`).

## Dữ liệu được tải

Quản lý qua `chatStore` (Pinia):
- `chatStore.initialize()` — load sessions
- `chatStore.sendMessage(text)` — gửi tin nhắn
- `chatStore.createSession()` — tạo session mới
- `chatStore.switchSession(id)` — chuyển session
- `chatStore.deleteSession(id)` — xóa session

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 768px | 2 cột: sidebar + chat |
| < 768px | Sidebar overlay (absolute), chat占据 toàn bộ |
| < 576px | Chiều cao giảm (100vh - 100px) |

## Tương tác

- **Gửi tin nhắn** → hiển thị optimistic, typing indicator, response
- **Chọn session** → load tin nhắn của session đó
- **Tạo session mới** → empty chat
- **Xóa session** → xác nhận, xóa
- **Click prompt** → tự động gửi
- **Toggle sidebar** → collapse/expand trên mobile

## Ghi chú

- `chatStore.sortedSessions` sắp xếp theo `updatedAt` DESC.
- Session title tự động từ tin nhắn đầu tiên (truncated 50 chars).
- Layout full-height: `calc(100vh - 140px)` — trừ header/topbar.
- Typing indicator dùng CSS animation `typing-pulse` (dots nhảy lên xuống).
