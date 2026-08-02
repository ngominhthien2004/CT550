# Báo cáo nâng cấp hệ thống tin nhắn thành hệ thống "mark-read hiện đại"

- **Ngày:** 02/08/2026
- **Phạm vi:** `frontend/src/components/messages/`, `frontend/src/components/layout/AppTopBar/`, `frontend/src/views/MessagesView.vue`, `frontend/src/stores/message.store.js`, `frontend/src/services/api.js`, `backend/controllers/message.controller.js`, `backend/routes/message.routes.js`
- **Trạng thái:** Hoàn tất & đã kiểm chứng (backend test 10/10, build frontend PASS, browser E2E 7/7 phase PASS)

---

## 1. Bối cảnh và vấn đề trước khi cải tiến

Trước khi nâng cấp, cơ chế đánh dấu đã đọc của hệ thống tin nhắn (`/messages`) hoạt động theo hướng **per-message (từng tin một)**, gây trải nghiệm kém cho người dùng và tạo ra nhiều request API không cần thiết:

- `frontend/src/components/messages/MessageBubble.vue`: mỗi tin chưa đọc hiển thị một nút **"Mark read"** riêng → user phải click **từng tin một** mới xóa được trạng thái chưa đọc.
- `frontend/src/components/layout/AppTopBar/AppTopBarMessagePanel.vue`: mỗi tin trong dropdown topbar cũng có nút "Mark read" riêng, cùng hạn chế trên.
- `frontend/src/views/MessagesView.vue`, hàm `selectThread()`: khi mở một thread, code chạy `Promise.all` gọi `PATCH /messages/:id/read` **N lần** (một lần cho mỗi tin chưa đọc) — số request tỉ lệ thuận với số tin tồn đọng.
- Không có **read receipt đẩy realtime** về người gửi: người gửi không biết khi nào tin của mình được đọc.

| Khía cạnh | Trước (lạc hậu) | Sau (hiện đại) |
|-----------|------------------|------------------|
| Đánh dấu đã đọc trong bubble | Nút "Mark read" trên từng tin, click thủ công | Tự động đọc khi thread được mở (watch timeline); xóa hẳn nút "Mark read" khỏi `MessageBubble.vue` |
| Đánh dấu đã đọc trong topbar | Nút "Mark read" trên từng tin trong dropdown | Một nút **"Mark all read"** ở header panel, đánh dấu toàn bộ inbox |
| Số request API khi mở thread | `Promise.all` gọi `PATCH /messages/:id/read` N lần (1/tin) | `PATCH /messages/threads/:peerId/read` — một `updateMany` cho toàn bộ thread; có guard `threadReadInFlight` chỉ gọi khi thực sự có tin chưa đọc |
| Read receipt realtime | Không có | Socket `message:read` đẩy về người gửi (`readerId` + `count`), cập nhật tick đôi (check-double) ngay lập tức |
| Đồng bộ notification bell | Không rõ ràng | Các endpoint mới tự đồng bộ notification loại `message` (theo `metadata.messageId`) → bell tự sạch |

---

## 2. Giải pháp đã implement

### 2.1 Backend

File thay đổi: `backend/controllers/message.controller.js`, `backend/routes/message.routes.js`.

- **`PATCH /messages/threads/:peerId/read`** → hàm `markThreadRead`: một `updateMany` đánh dấu toàn bộ tin chưa đọc đến từ peer (bỏ qua tin soft-deleted), trả về `modifiedCount` + `unreadCount` mới; emit socket `message:read` (`readerId`, `count`) cho peer.
- **`PATCH /messages/read-all`** → hàm `markAllRead`: đánh dấu toàn bộ inbox, broadcast `message:read` tới **từng sender** có tin vừa được đọc.
- Hàm `markMessageRead` cũ được **giữ lại để tương thích ngược**, nhưng giờ cũng emit read receipt + đồng bộ notification.
- Cả hai endpoint mới đều đồng bộ notification loại `message` (theo `metadata.messageId`) → badge trên bell tự sạch.

### 2.2 Frontend — API service & store

File thay đổi: `frontend/src/services/api.js`, `frontend/src/stores/message.store.js`.

- `services/api.js`: thêm `messageApi.markThreadRead(peerId)` và `messageApi.markAllRead()`; đồng thời export named `markThreadRead`, `markAllMessagesRead`.
- `stores/message.store.js`: thêm các action:
  - `readThread(peerId)` — gọi API đánh dấu đã đọc theo thread.
  - `markAllRead()` — gọi API đánh dấu toàn bộ inbox đã đọc.
  - `applyReadReceipt(readerId)` — mirror trạng thái đọc vào `inboxItems`/`sentItems` và tính lại `inboxUnreadCount`.

### 2.3 Frontend — MessagesView

File thay đổi: `frontend/src/views/MessagesView.vue`.

- Bỏ `markAsRead` per-message.
- `selectThread` gọi `markThreadReadIfNeeded()`: có guard `threadReadInFlight`, chỉ gọi API khi thread đang mở thực sự còn tin chưa đọc.
- Watch `threadMessages`: mỗi khi timeline thay đổi (mở thread, socket, poll) → tự động auto-read.
- `handleIncomingMessage`: tin mới tới khi thread đang mở → tự mark đọc; ngược lại mới play sound.
- Visibility handler: khi tab quay lại visible → auto-read phần tin bỏ lỡ.
- Socket `message:read` → `handleReadReceipt` cập nhật tick đôi (check-double) cho tin đã gửi đi.
- Watch `messageStore.inboxUnreadCount` giảm → mirror mark đọc cache local (giúp mark-all-read đồng bộ ngay khi đang ở `/messages`, không cần reload).

### 2.4 Frontend — Components & CSS

- `components/messages/MessageBubble.vue`: **xóa** nút "Mark read", emit tương ứng và CSS liên quan.
- `components/messages/ThreadChatPane.vue`: bỏ emit `mark-read`.
- `components/layout/AppTopBar/AppTopBarMessagePanel.vue`: thay nút từng tin bằng một nút **"Mark all read"** ở header panel.
- `components/layout/AppTopBar/AppTopBar.vue`: `handleMarkAllMessagesRead()` gọi `messageStore.markAllRead()`.
- `styles/MessagesView.css`: xóa CSS `.mark-read` còn sót lại.

---

## 3. Kiểm chứng kỹ thuật

| Kiểm tra | Lệnh | Kết quả |
|----------|------|---------|
| Backend test | `cd backend && npm test` | **10/10 PASS** |
| Backend route load | `require('./routes/message.routes.js')` | Load OK |
| Frontend build | `cd frontend && npm run build` | **PASS** (757 modules; chỉ còn warning chunk-size cũ, không liên quan) |

---

## 4. Browser test E2E (Chrome DevTools MCP)

### Cấu hình

- **Tài khoản A:** `johnny.brooks@gmail.com` / `Test12345!`
- **Tài khoản B:** `goku.tanaka@gmail.com` / `Test12345!`
- Nguồn tài khoản: tài khoản có sẵn từ `docs/reports/auth-test-accounts-2026-04-05.md` (tuân thủ quy tắc tái sử dụng tài khoản test).
- Hai tab Chrome ở **isolated context riêng** (mỗi tài khoản một phiên đăng nhập độc lập).
- Server: backend `localhost:5000`, frontend `localhost:5173` (đã chạy sẵn).
- Toàn bộ screenshot bằng chứng lưu tại `test-artifacts/`.

### Kết quả theo phase

| # | Phase | Kết quả | Bằng chứng |
|---|-------|---------|------------|
| 1 | Đăng nhập 2 tài khoản (A, B) | PASS | — |
| 2 | A gửi 3 tin cho B (B không mở `/messages`) | PASS | `msgs-p1-a-sent.png` |
| 3 | B mở `/messages`: badge unread 3→0 tự động; không còn nút "Mark read" trong bubble; `PATCH /messages/threads/.../read` trả [200]; console sạch | PASS | `msgs-p3-b-unread-badge.png`, `msgs-p3-b-chats-unread0.png`, `msgs-p3-b-thread-open-read.png` |
| 4 | Read receipt realtime cho A: 9 tin chuyển Sent→Read ngay khi B mở thread, không cần refresh | PASS | `msgs-p4-a-read-receipt.png` |
| 5 | B gửi 2 tin khi A đang mở thread → A tự đọc, B thấy tick đôi | PASS | `msgs-p5-a-auto-read-new.png`, `msgs-p5-b-seen.png` |
| 6 | Mark all read ở topbar: `PATCH /messages/read-all` [200], badge về 0 | PASS | `msgs-p6-b-mark-all-read.png`, `msgs-p6-b-after-reload-unread0.png` |
| 7 | Notification bell đồng bộ: notification loại message chuyển đã đọc | PASS | `msgs-p7-b-notif-before-read.png`, `msgs-p7-b-notifications-synced.png` |

**Kết quả tổng:** 7/7 phase PASS.

### Gap phát hiện & đã fix

- **Gap:** sau khi bấm "Mark all read" ở topbar, danh sách Chats trong `MessagesView` không cập nhật trạng thái `Unread` cho tới khi reload.
- **Fix:** thêm watch `messageStore.inboxUnreadCount` trong `MessagesView` để mirror mark đọc cache local.
- **Re-verify:** Chrome MCP PASS — Unread chuyển 1→0 ngay lập tức, không cần reload. Bằng chứng: `test-artifacts/msgs-fix-markall-sync.png`.

### Danh sách screenshot bằng chứng (tất cả trong `test-artifacts/`)

`msgs-p1-a-sent.png`, `msgs-p3-b-unread-badge.png`, `msgs-p3-b-chats-unread0.png`, `msgs-p3-b-thread-open-read.png`, `msgs-p4-a-read-receipt.png`, `msgs-p5-a-auto-read-new.png`, `msgs-p5-b-seen.png`, `msgs-p6-b-mark-all-read.png`, `msgs-p6-b-after-reload-unread0.png`, `msgs-p7-b-notif-before-read.png`, `msgs-p7-b-notifications-synced.png`, `msgs-fix-markall-sync.png`

---

## 5. Ghi chú / hạn chế

- Khi vào `/messages`, UI tự động chọn thread đầu tiên và auto-read ngay — về mặt sản phẩm điều này hợp lý (mở trang = mở cuộc trò chuyện), nhưng user có thể không kịp thấy badge unread trước khi nó tự về 0.
- WebSocket warning `WebSocket connection to ws://localhost:5173/socket.io/... failed` xuất hiện 1 lần lúc mở tab; socket tự reconnect và realtime vẫn hoạt động xuyên suốt — không phải lỗi chặn.
- Đã xóa 16 file script/data e2e test message cũ (theo yêu cầu user), gồm `frontend/temp_user_search.spec.js`, `test-artifacts/test1-socket-e2e.js`, `test1-socket-sim.js`, `test3-allowlist.js`, `send-fresh-msgs.ps1`, `msg-*.json`, `test2-*.json`. Từ nay quy trình test message dùng Chrome DevTools MCP, không dùng script.
- Chưa commit git (không nằm trong phạm vi yêu cầu).
