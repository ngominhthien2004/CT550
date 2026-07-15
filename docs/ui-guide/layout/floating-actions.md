# Các Nút Nổi (Floating Action Buttons — FAB)

## Tổng quan

IlluWrl sử dụng hai nút hành động nổi (FAB) được teleport ra ngoài `MainLayoutTemplate`, hiển thị cố định trên mọi trang có sử dụng bố cục chính.

Cả hai nút đều được đặt ở **góc dưới bên phải** của màn hình, xếp chồng lên nhau với khoảng cách phù hợp.

Hình 1: Hai nút FAB ở góc dưới bên phải màn hình — Back-to-top và AI Chat.

---

## 1. Nút Back-to-top

### Mô tả

Nút cuộc lên đầu trang, xuất hiện khi người dùng cuộn xuống một khoảng nhất định.

### Vị trí

- Góc dưới bên phải màn hình.
- Cách mép dưới khoảng 80px, cách mép phải khoảng 20px.
- Z-index cao để luôn hiển thị trên các thành phần khác.

### Hình thức

| Thuộc tính | Giá trị |
|------------|---------|
| **Biểu tượng** | Font Awesome `fa-arrow-up` |
| **Kích thước** | 44x44px, hình tròn |
| **Màu nền** | Màu nền giao diện (`--bg`), viền nhẹ |
| **Hiệu ứng hover** | Đổi màu nền sang màu nhấn (accent color) |

### Hành vi

- **Xuất hiện**: Khi cuộn xuống hơn 300px từ đầu trang.
- **Click**: Cuộn mượt (smooth scroll) lên đầu trang với hành vi `scroll-behavior: smooth`.
- **Ẩn**: Khi ở đầu trang.

---

## 2. Nút AI Chat FAB

### Mô tả

Nút truy cập nhanh đến trang chat AI. Cho phép người dùng mở trò chuyện với trợ lý AI của IlluWrl.

### Vị trí

- Góc dưới bên phải màn hình.
- Cùng vị trí với nút back-to-top, nhưng offset sang trái (right: 6rem).
- Cách mép phải khoảng 20px.

### Hình thức

| Thuộc tính | Giá trị |
|------------|---------|
| **Biểu tượng** | Font Awesome `fa-robot` |
| **Kích thước** | 44x44px, hình tròn |
| **Màu nền** | Gradient màu nhấn của giao diện (`linear-gradient(135deg, var(--accent), #0078d4)`) |
| **Đổ bóng** | Box-shadow nhẹ, tăng lên khi hover |
| **Hiệu ứng hover** | Scale nhẹ (1.05), tăng độ sáng |

### Hành vi

- **Click**: Mở/đóng chat bubble thông qua `chatStore.toggleBubble()`.
- **Trạng thái ẩn**: Tự động ẩn trên trang `/messages` để tránh xung đột giao diện (theo điều kiện router-link check).
- **Luôn hiển thị**: Trên tất cả các trang khác (kể cả khi chưa đăng nhập, nếu AI chat cho phép).

## Tương tác chung

| Hành động | Back-to-top | AI Chat |
|-----------|-------------|---------|
| **Default** | Ẩn (khi ở đầu trang) | Hiển thị |
| **Hover** | Nền chuyển accent color | Scale 1.05, sáng hơn |
| **Click** | Smooth scroll lên đầu | Mở/đóng chat bubble qua `chatStore.toggleBubble()` |
| **Z-index** | `1050` | `1050` (cùng với back-to-top) |

Hình 2: Back-to-top ở trạng thái hover với nền accent color.

## Ghi chú kỹ thuật

- Cả hai FAB đều được render qua Vue Teleport (`<Teleport to="body">`).
- Không sử dụng FAB trên các standalone pages (Login, SignUp, Drawing, etc.).

## Tài liệu liên quan

- [Tính năng AI Chatbot](../features/ai-chatbot.md) — Mô tả chi tiết về trợ lý AI, kiến trúc, endpoint và luồng xử lý tin nhắn.
