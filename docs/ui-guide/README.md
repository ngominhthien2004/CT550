# Hướng dẫn Giao diện Người dùng IlluWrl

**Phiên bản:** 1.0  
**Ngày cập nhật:** Tháng 7, 2026

## Giới thiệu

Tài liệu này mô tả chi tiết các thành phần giao diện người dùng (UI) và trang (pages) của hệ thống **IlluWrl** — một nền tảng chia sẻ minh hoạ (illustration), manga, truyện tranh động (GIF) và tiểu thuyết (novel) trực tuyến, lấy cảm hứng từ Pixiv.

IlluWrl không chỉ đơn thuần là một trang đọc truyện. Hệ thống tích hợp đầy đủ các tính năng của một cộng đồng sáng tạo nghệ thuật số:

- **Kho tác phẩm**: Đăng tải, duyệt và tương tác với illustration, manga, GIF, novel.
- **Công cụ vẽ**: Trình vẽ tranh trực tuyến (Drawing Tool) với nhiều lớp (layers), bút vẽ và công cụ chỉnh sửa.
- **Trí tuệ nhân tạo**: Phát hiện tác phẩm do AI tạo ra, gợi ý tag tự động, chat với AI, đề xuất tác phẩm cá nhân hoá.
- **Tương tác xã hội**: Theo dõi người dùng, thích, đánh dấu, bình luận, tin nhắn, thông báo thời gian thực.
- **Hệ thống phân hạng**: Bảng xếp hạng tác phẩm theo nhiều tiêu chí.

## Cấu trúc tài liệu

Tài liệu được tổ chức thành ba phần chính:

| Thư mục | Mô tả |
|---------|-------|
| `layout/` | Các thành phần khung bố cục chung: thanh trên, menu bên, bố cục chính, menu người dùng, các nút nổi |
| `pages/` | Mô tả từng trang cụ thể trong hệ thống: trang chủ, tìm kiếm, đánh dấu, lịch sử, khám phá, tải lên, chi tiết tác phẩm |
| `common/` | Các thành phần dùng chung, tái sử dụng trên nhiều trang: thanh tìm kiếm, thẻ tác phẩm, thanh lọc |

## Cách sử dụng tài liệu

- Mỗi tệp mô tả một thành phần UI hoặc một trang cụ thể.
- Các hình ảnh minh hoạ được đánh số theo mẫu **"Hình X: Mô tả giao diện"** — sẽ được bổ sung sau.
- Đối với các thành phần có props (Vue components), các thuộc tính được liệt kê trong bảng.
- Các hành vi tương tác (click, hover, focus) được mô tả chi tiết.
- Thông tin responsive đề cập đến các breakpoint và cách giao diện thay đổi trên các kích thước màn hình khác nhau.

## Quy ước đặt tên

- **PascalCase**: Tên component Vue (ví dụ: `AppTopBar`, `ArtworkCard`).
- **kebab-case**: Tên route, class CSS, thuộc tính HTML.
- **CamelCase**: Tên biến, hàm, props trong JavaScript.

## Công nghệ sử dụng

- **Frontend**: Vue 3 (Composition API) + Vite + Pinia + Vue Router.
- **UI Framework**: Bootstrap 5 CSS + Font Awesome icons.
- **Canvas**: Konva.js (vue-konva) cho Drawing Tool.
- **Thời gian thực**: Socket.IO cho thông báo và tin nhắn.
- **Thiết kế**: CSS thuần với biến tuỳ chỉnh (CSS custom properties) và scoped styles.
