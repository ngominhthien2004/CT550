# Trang Tính năng AI (AIView)

## Tổng quan

`AIView` là trang test/demo các tính năng AI của IlluWrl — bao gồm AI Chat và Phát hiện ảnh AI. Giao diện dark theme với hai tab.

Hình 1: Giao diện AIView với tab Phát hiện ảnh AI.

## Route

| Route | Mô tả |
|-------|-------|
| `/ai` | Các tính năng AI (standalone, không dùng MainLayoutTemplate) |

## Cấu trúc trang

### 1. Tabs

| Tab | Giá trị mặc định | Mô tả |
|-----|-----------------|-------|
| **AI Chat** | `chat` | Chat với AI assistant |
| **Phát hiện ảnh AI** | `detect` (mặc định) | Upload ảnh để kiểm tra AI-generated |

Tab active nền `#4a90d9` (xanh dương).

### 2. Tab AI Chat

- **Messages area**: Hiển thị tin nhắn user/assistant.
  - User: căn phải, nền `#4a90d9`.
  - Assistant: căn trái, nền `rgba(255,255,255,0.1)`.
  - Welcome message: "Xin chào! Tôi có thể giúp bạn tìm tác phẩm, gợi ý tác phẩm hay."
- **Input form**: Input + nút "Gửi".
- API: `POST /api/ai/chat` với `{ message, history }`.

### 3. Tab Phát hiện ảnh AI

#### Upload area

- Khu vực upload drag & drop (300px height, dashed border).
- Click hoặc kéo ảnh vào.
- Hỗ trợ: JPG, PNG, GIF, WEBP.
- Preview ảnh sau khi chọn.

#### Controls

| Nút | Mô tả |
|-----|-------|
| **Phân tích ảnh** | Gọi API phân tích (hiển thị khi có preview + chưa phân tích) |
| **Xóa ảnh** | Xóa preview, reset kết quả |

#### Kết quả phân tích

| Loại | Hiển thị |
|------|----------|
| **Ảnh AI** | Badge "⚠️ Ảnh AI" + nền gradient đỏ |
| **Ảnh thật** | Badge "✅ Ảnh thật" + nền gradient xanh lá |

- Hiển thị: confidence %, lý do, kích thước ảnh, loại file.

#### Loading state

- Spinner xoay + "Đang phân tích..."

## Dữ liệu được tải

| API endpoint | Dữ liệu |
|--------------|---------|
| `POST /api/ai/chat` | `{ message, history }` → `{ reply }` |
| `POST /api/ai/detect-image` | FormData (image) → `{ isAI, confidence, reason, imageSize, imageType }` |

## Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 800px | Max-width 800px, padding 40px |
| < 800px | Padding thu hẹp 20px |

## Tương tác

- **Chat**: Nhập tin nhắn → Gửi → Hiển thị response
- **Detect**: Upload ảnh → Phân tích → Hiển thị kết quả
- **Drag & drop**: Kéo ảnh vào upload area
- **Clear**: Xóa ảnh và kết quả

## Ghi chú

- Trang standalone — không dùng MainLayoutTemplate.
- Dark theme: nền gradient `#1a1a2e` → `#16213e`.
- Default tab is `'detect'` — AI image detection is the primary use case.
- Chat history gửi kèm trong request để AI có context.
- AI detection threshold: 70% (configurable via `AI_DETECTION_THRESHOLD` env var).
