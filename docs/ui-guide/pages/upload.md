# Trang Tải lên (UploadArtworkView)

## Tổng quan

`UploadArtworkView` là trang cho phép người dùng đăng tải tác phẩm mới lên IlluWrl. Hỗ trợ bốn loại nội dung: illustration, manga, GIF và novel. Trang yêu cầu người dùng đã đăng nhập.

Hình 1: Giao diện trang tải lên với khu vực kéo-thả tệp.

## Route

| Route | Loại | Mô tả |
|-------|------|-------|
| `/upload/illust` | illustration | Đăng tải tranh minh hoạ |
| `/upload/manga` | manga | Đăng tải truyện tranh (nhiều trang) |
| `/upload/gif` | gif | Đăng tải truyện tranh động |
| `/upload/novel` | novel | Đăng tải tiểu thuyết |

## Các thành phần

### 1. UploadTypeHero — Khu vực tải tệp lên

- **Kéo và thả (drag & drop)** hoặc **chọn tệp (file picker)**.
- Hỗ trợ nhiều tệp cùng lúc (cho manga).
- Xem trước hình ảnh (image preview) sau khi chọn.
- Hiển thị số lượng và kích thước tệp đã chọn.

### 2. UploadContentDetails — Thông tin chi tiết tác phẩm

| Trường | Mô tả |
|--------|-------|
| **Title (Tiêu đề)** | Ô nhập văn bản, bắt buộc |
| **Caption / Novel text** | Mô tả cho illustration/manga/GIF; nội dung chính cho novel |
| **Series name (cho manga)** | Tên series nếu tác phẩm thuộc một bộ |

### 3. UploadTagSelector — Chọn tag

- Ô nhập tag với **autocomplete** gợi ý từ hệ thống.
- Tag đã chọn hiển thị dạng badge, có thể xoá từng tag.
- **Giới hạn tối đa 10 tag**.
- Hỗ trợ tag đa ngôn ngữ.

### 4. UploadPublicationSettings — Cài đặt xuất bản

| Cài đặt | Tuỳ chọn |
|---------|----------|
| **Age rating** | All (mọi lứa tuổi) / R-18 (người lớn) |
| **AI-generated** | Bật/tắt — đánh dấu tác phẩm do AI tạo |
| **Comments** | Bật/tắt bình luận trên tác phẩm |
| **Scheduled posting** | Hẹn giờ đăng bài |

## AI Detection (Phát hiện AI)

- Tự động chạy phát hiện AI trên hình ảnh tải lên qua `/api/ai/detect-image`.
- Nếu phát hiện AI, tag `ai` được tự động thêm vào.
- Người dùng có thể ghi đè cài đặt nếu cần.

## Auto-tagging (Gợi ý tag tự động)

- Hệ thống AI tự động phân tích nội dung hình ảnh.
- Đề xuất tag phù hợp dựa trên nội dung.
- Người dùng có thể chọn tag từ danh sách gợi ý.

## Validation

| Quy tắc | Mô tả |
|---------|-------|
| **Title** | Bắt buộc, không được để trống |
| **Content (novel)** | Bắt buộc đối với novel — phải có nội dung văn bản |
| **File count** | Tối đa 50 tệp cho manga/illust |
| **File count (GIF)** | Chỉ chấp nhận 1 tệp `.gif` |
| **Minimum files** | Phải có ít nhất 1 tệp (trừ novel) |
| **Kích thước tệp** | Tuân theo cấu hình `MAX_UPLOAD_FILE_SIZE_MB` (mặc định 10MB) |

## Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Thanh tiến trình tải lên, spinner |
| **Validation error** | Thông báo lỗi hiển thị cạnh trường tương ứng |
| **Upload error** | Thông báo lỗi tổng thể với chi tiết |
| **Success** | Tự động chuyển hướng đến trang chi tiết tác phẩm |

## Hành động

| Nút | Mô tả |
|-----|-------|
| **Submit (Đăng)** | Xác thực và gửi tác phẩm lên server |
| **Reset** | Xoá toàn bộ form và quay lại trạng thái ban đầu |

Hình 2: UploadTagSelector với các tag đã chọn và gợi ý autocomplete.
