# Auto Tagging — Tự động gắn thẻ cho tác phẩm

## Mục đích

Tính năng **Auto Tagging** tự động đề xuất các tag (thẻ) cho tác phẩm dựa trên nội dung hình ảnh, giúp người dùng tiết kiệm thời gian gắn thẻ thủ công và tăng độ chính xác trong việc phân loại nội dung. Hệ thống sử dụng các model thị giác máy tính (computer vision) để nhận diện đối tượng, phong cảnh, màu sắc và chủ đề trong ảnh.

## Luồng xử lý

```
Người dùng chọn file upload
        │
        ▼
Upload ảnh → gửi đến POST /api/ai/auto-tag
        │
        ▼
Gọi HuggingFace Inference API với model phân loại ảnh
        │
        ├── Mặc định: google/vit-base-patch16-224
        │   (có thể cấu hình qua biến AUTO_TAG_MODEL)
        │
        ├── Lọc kết quả: score >= AUTO_TAG_CONFIDENCE (mặc định 0.2)
        │
        ├── Làm sạch nhãn:
        │   - Lấy phần tử đầu tiên trước dấu phẩy
        │   - Chuyển thành chữ thường
        │   - Thay khoảng trắng bằng dấu gạch dưới
        │   - Xoá ký tự đặc biệt
        │
        └── Thu thập tối đa AUTO_TAG_MAX_TAGS tag (mặc định 5)
        │
        ▼
Trả về danh sách tag đề xuất cho frontend
        │
        ▼
Frontend tự động thêm tag vào form upload
(Người dùng có thể xoá hoặc thêm tag khác)
```

## API endpoint

| Thông tin | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **URL** | `/api/ai/auto-tag` |
| **Xác thực** | JWT (`protect` middleware) |
| **Content-Type** | `multipart/form-data` |
| **Field name** | `image` |
| **Giới hạn file** | 10 MB (cấu hình qua `MAX_UPLOAD_FILE_SIZE_MB`) |

### Request

```
POST /api/ai/auto-tag
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

### Response (thành công)

```json
{
  "success": true,
  "tags": ["mountain", "sunset", "landscape", "sky", "cloud"],
  "count": 5
}
```

### Response (lỗi / disabled)

```json
{
  "success": false,
  "error": "Auto-tagging is currently disabled by admin"
}
```

## Cấu hình

| Biến môi trường | Mặc định | Mô tả |
|-----------------|----------|-------|
| `AUTO_TAG_MODEL` | `google/vit-base-patch16-224` | HuggingFace model phân loại ảnh |
| `AUTO_TAG_CONFIDENCE` | `0.2` | Ngưỡng confidence tối thiểu để chấp nhận tag |
| `AUTO_TAG_MAX_TAGS` | `5` | Số lượng tag tối đa trả về |
| `AUTO_TAG_PROVIDER` | `huggingface` | Provider: `huggingface` hoặc `google-vision` |
| `HF_TOKEN` | — | HuggingFace API token (bắt buộc nếu dùng HF) |

## Tích hợp với Upload

### Quy trình song song

Auto Tagging chạy **đồng thời** với AI Detection khi người dùng upload ảnh:

1. Người dùng chọn file và điền thông tin cơ bản (tiêu đề, mô tả).
2. Hệ thống tự động gọi hai API song song:
   - `POST /api/ai/detect-image` — kiểm tra AI-generated.
   - `POST /api/ai/auto-tag` — đề xuất tag.
3. Kết quả từ auto-tagging được thêm vào danh sách tag của form.
4. Người dùng có thể xem, xoá hoặc thêm tag khác trước khi đăng.

### Giao diện

- Tag được thêm tự động vào component **UploadTagSelector** trên form upload.
- Các tag đề xuất hiển thị cùng với tag do người dùng nhập, không có sự phân biệt về mặt giao diện.
- Người dùng có thể xoá tag đề xuất bằng nút "×" trên mỗi tag, giống như tag thông thường.
- Nếu auto-tagging trả về ít tag hơn mong đợi, người dùng có thể nhập thêm tag thủ công.

### Thứ tự hiển thị

- Tag `ai` (từ AI Detection) hiển thị đầu tiên.
- Tag đề xuất từ Auto Tagging hiển thị tiếp theo.
- Tag do người dùng nhập thêm hiển thị sau cùng.

## Xử lý lỗi

Auto Tagging được thiết kế với nguyên tắc **silent fail** — không làm gián đoạn trải nghiệm upload:

| Tình huống | Xử lý |
|-------------|-------|
| `HF_TOKEN` không cấu hình | Bỏ qua, không thêm tag nào |
| API trả về 403 (disabled by admin) | Bỏ qua, không hiển thị lỗi cho người dùng |
| API timeout hoặc lỗi mạng | Bỏ qua, upload vẫn tiếp tục |
| Model không tải được | Bỏ qua, trả về danh sách tag rỗng |
| File không phải ảnh | API từ chối, auto-tagging không kích hoạt |

Người dùng **không thấy thông báo lỗi** nếu auto-tagging thất bại — hệ thống chỉ bỏ qua bước này và cho phép người dùng nhập tag thủ công.

## Các tệp liên quan

| Tệp | Mô tả |
|-----|-------|
| `backend/controllers/ai.controller.js` | Hàm `autoTagUpload` — xử lý request |
| `backend/routes/ai.routes.js` | Route `POST /ai/auto-tag` |
| `backend/services/autoTag.service.js` | `autoTagImage()`, `autoTagWithHuggingFace()`, `cleanHuggingFaceLabel()` |
| `backend/services/googleVision.service.js` | Fallback provider cho auto-tagging |
| `frontend/src/views/UploadArtworkView.vue` | Tích hợp auto-tagging trong form upload |
| `frontend/src/components/upload/UploadTagSelector.vue` | Component hiển thị và quản lý tag |

## Ghi chú

- Số lượng tag tối đa trên mỗi tác phẩm trong hệ thống là 20 tag.
- Auto Tagging chỉ hỗ trợ ảnh tĩnh (JPEG, PNG, GIF, WEBP) — không hỗ trợ novel.
- Tag đề xuất bằng tiếng Anh (do model HuggingFace chủ yếu là tiếng Anh).
- Admin có thể tắt auto-tagging qua database setting `autoTaggingEnabled`.
