# AI Detection — Phát hiện tác phẩm do AI tạo ra

## Mục đích

Tính năng **AI Detection** cho phép hệ thống IlluWrl tự động phát hiện các tác phẩm được tạo ra bởi trí tuệ nhân tạo (AI) khi người dùng upload ảnh lên nền tảng. Mục tiêu là đảm bảo tính minh bạch trong việc gắn nhãn nội dung, giúp người xem phân biệt giữa tác phẩm vẽ tay truyền thống và tác phẩm do AI sinh ra.

## Luồng xử lý

```
Người dùng chọn file upload
        │
        ▼
Gửi ảnh đến POST /api/ai/detect-image
        │
        ▼
HuggingFace model "umm-maybe/AI-image-detector" phân tích
        │
        ├── Thành công → trả về { isAI, confidence, reason }
        └── Thất bại (không có HF_TOKEN / API lỗi)
                │
                ▼
        Fallback: Metadata analysis
        (phân tích kích thước file, định dạng,
         cấu trúc nén để ước tính)
        │
        ▼
Quyết định isAI dựa trên kết quả từ model
        │
        ├── HF API: so sánh aiScore > realScore → isAI = true → gắn tag "ai"
        │           (confidence = max(aiScore, realScore) * 100)
        └── HF API: aiScore <= realScore → isAI = false → không gắn tag
        │
        ▼
Frontend hiển thị kết quả trên form upload
```

## API endpoint

| Thông tin | Giá trị |
|-----------|---------|
| **Method** | `POST` |
| **URL** | `/api/ai/detect-image` |
| **Xác thực** | JWT (`protect` middleware) |
| **Content-Type** | `multipart/form-data` |
| **Field name** | `image` |

### Request

```
POST /api/ai/detect-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

### Response (thành công)

```json
{
  "success": true,
  "isAI": true,
  "confidence": 85,
  "reason": "Phát hiện đặc trưng AI: kết cấu đồng nhất, hiệu ứng ánh sáng bất thường",
  "model": "umm-maybe/AI-image-detector",
  "method": "huggingface",
  "imageSize": 245760,
  "imageType": "image/png"
}
```

### Response (fallback)

```json
{
  "success": true,
  "isAI": true,
  "confidence": 72,
  "reason": "Metadata analysis: kích thước file lớn, cấu trúc nén đồng nhất",
  "model": "metadata-analysis",
  "method": "huggingface-fallback",
  "imageSize": 245760,
  "imageType": "image/png"
}
```

### Response (lỗi)

```json
{
  "success": false,
  "error": "HF_TOKEN not configured",
  "method": "huggingface-fallback",
  "imageSize": 245760,
  "imageType": "image/png"
}
```

## Cơ chế phát hiện

Hệ thống không sử dụng ngưỡng cấu hình để quyết định AI hay thật. Quyết định dựa trên kết quả từ HuggingFace model:

- **HuggingFace API** (`umm-maybe/AI-image-detector`): Model trả về danh sách label kèm score.
  - `processHFResults()` tìm label có chứa từ khóa AI (`ai`, `generated`, `computer`, `artificial`, `synthetic`) và label thật (`real`, `natural`, `photo`, `human`).
  - So sánh `aiScore > realScore` → nếu score AI cao hơn, `isAI = true`.
  - `confidence = Math.round(Math.max(aiScore, realScore) * 100)` — chỉ là giá trị tham khảo, không dùng để quyết định.

- **Metadata fallback** (khi HuggingFace không khả dụng): Sử dụng hệ thống điểm dựa trên đặc tính file.
  - `aiScore > 30` → `isAI = true`.
  - Công thức: `confidence = Math.min(85, Math.max(30, 50 + aiScore))`.

Admin có thể bật/tắt toàn bộ tính năng qua Setting trong database (`aiDetectionEnabled`).

## Tự động gắn tag

Khi ảnh được xác định là AI-generated (`isAI = true`), hệ thống **tự động** thêm tag `ai` vào tác phẩm. Điều này giúp:

- Người xem dễ dàng lọc tác phẩm theo nguồn gốc.
- Hỗ trợ công tác kiểm duyệt và quản lý nội dung.
- Tăng tính minh bạch cho cộng đồng.

## Giao diện người dùng

### Trên form upload

- **Warning message**: Hiển thị cảnh báo "Ảnh này được phát hiện là AI-generated" trên form upload.
- **AI toggle**: Tự động chuyển toggle "Tác phẩm AI" sang trạng thái "Yes".
- **Tag**: Tag `ai` được tự động thêm vào danh sách tag.

### Trang AI (AIView)

Trang `/ai` có tab "Phát hiện ảnh AI" cho phép người dùng upload ảnh để kiểm tra thủ công:

- Upload area drag & drop (hỗ trợ JPG, PNG, GIF, WEBP).
- Preview ảnh trước khi phân tích.
- Kết quả hiển thị badge "⚠️ Ảnh AI" (nền đỏ) hoặc "✅ Ảnh thật" (nền xanh).
- Hiển thị confidence %, lý do chi tiết, kích thước và loại file.
- Loading state với spinner trong khi phân tích.

## Tích hợp

- Tính năng này chạy **song song** với auto-tagging khi người dùng upload.
- Nếu cả hai API đều được gọi, chúng không phụ thuộc lẫn nhau — một bên lỗi không ảnh hưởng đến bên kia.
- Kết quả AI Detection được hiển thị trước, người dùng có thể đợi hoặc bỏ qua.

## Xử lý fallback

Khi HuggingFace API không khả dụng (thiếu `HF_TOKEN`, model đang tải, lỗi mạng), hệ thống tự động chuyển sang phương pháp phân tích metadata:

- **Kích thước file**: File > 200 KB (+20 điểm).
- **Định dạng**: PNG > 500 KB (+25 điểm).
- **Hiện tượng JPEG**: Phát hiện `ffd9` và `ffda` trong hex (+15 điểm).
- **Cấu trúc đồng nhất**: Byte variance < 500 (+20 điểm).
- **File rất nhỏ**: < 10 KB (−10 điểm).

Công thức: `aiScore > 30 → isAI = true`, `confidence = min(85, max(30, 50 + aiScore))`.

## Các tệp liên quan

| Tệp | Mô tả |
|-----|-------|
| `backend/controllers/ai.controller.js` | Hàm `detectAIImage` — xử lý request |
| `backend/routes/ai.routes.js` | Route `POST /ai/detect-image` |
| `backend/services/huggingface.service.js` | `detectAIWithHuggingFace()`, `processHFResults()`, `detectWithMetadataAnalysis()` |
| `frontend/src/views/AIView.vue` | Giao diện test AI Detection |
| `frontend/src/views/UploadArtworkView.vue` | Tích hợp AI Detection trong form upload |

## Ghi chú

- AI Detection yêu cầu JWT token — người dùng phải đăng nhập.
- Admin có thể tắt hoàn toàn tính năng qua database setting `aiDetectionEnabled`.
- Fallback method chỉ là ước lượng heuristic, không chính xác bằng HuggingFace API.
