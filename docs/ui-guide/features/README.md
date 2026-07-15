# Tính năng AI của IlluWrl

## Tổng quan

IlluWrl tích hợp ba tính năng trí tuệ nhân tạo (AI) nhằm nâng cao trải nghiệm người dùng, hỗ trợ sáng tạo và khám phá nội dung. Các tính năng này được triển khai hoàn toàn trên nền tảng **Express 5** (backend) và **Vue 3** (frontend), sử dụng các dịch vụ AI phổ biến.

| Tính năng | Mô tả | API chính |
|-----------|-------|-----------|
| **AI Detection** | Phát hiện tác phẩm do AI tạo ra khi upload ảnh | `POST /api/ai/detect-image` |
| **Auto Tagging** | Tự động đề xuất tag cho tác phẩm dựa trên nội dung hình ảnh | `POST /api/ai/auto-tag` |
| **AI Chatbot** | Trợ lý ảo thông minh cho tìm kiếm, gợi ý và tóm tắt tác phẩm | `POST /api/ai/chat`, `POST /api/ai/agent-chat` |

## Luồng tích hợp

### 1. Luồng Upload

Khi người dùng upload tác phẩm lên hệ thống, hai tính năng AI chạy song song:

```
Upload ảnh
    │
    ├──→ AI Detection (POST /api/ai/detect-image)
    │       ├── HuggingFace model (umm-maybe/AI-image-detector)
    │       └── Metadata analysis (fallback)
    │
    └──→ Auto Tagging (POST /api/ai/auto-tag)
            ├── HuggingFace image classification
            └── Google Cloud Vision (fallback)
```

- **AI Detection** kiểm tra xem ảnh có phải do AI tạo ra không. Nếu confidence >= threshold, tag `ai` được tự động gắn.
- **Auto Tagging** phân tích nội dung ảnh và đề xuất danh sách tag (tối đa 5 tag).
- Cả hai kết quả được hiển thị trên form upload — người dùng có thể chỉnh sửa, thêm hoặc xoá tag trước khi đăng.

### 2. Luồng Chat

Người dùng tương tác với AI Chatbot qua giao diện chat session:

```
Frontend (ChatView)
    │
    ├──→ POST /api/ai/chat (chat đơn giản, trợ lý nghệ thuật)
    │
    └──→ POST /api/ai/agent-chat (chat với phát hiện ý định)
            ├── Ý định "search" → tìm kiếm artwork/user/plan trong MongoDB
            ├── Ý định "recommend" → gợi ý dựa trên sở thích người dùng
            └── Ý định "summarize" → tóm tắt nội dung tác phẩm
```

- Session và lịch sử hội thoại được lưu trữ trong MongoDB qua models `ChatSession` và `ChatMessage`.
- API session: `GET/POST /api/chat-sessions`, `DELETE /api/chat-sessions/:id`, `PATCH /api/chat-sessions/:id`.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Backend** | Express 5 (Node.js) — CommonJS |
| **Database** | MongoDB + Mongoose ODM |
| **AI Image Detection** | HuggingFace Inference API — model `umm-maybe/AI-image-detector` |
| **AI Auto-Tagging** | HuggingFace — model `google/vit-base-patch16-224` (mặc định) |
| **AI Chat** | Ollama API — model mặc định `qwen2.5-coder:32b` |
| **Vector Search** | Không sử dụng pgvector — tìm kiếm dựa trên regex MongoDB + phân loại ý định heuristic |

## Cấu hình qua biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `AI_DETECTION_THRESHOLD` | `70` | Ngưỡng phát hiện AI (%) |
| `AI_PROVIDER` | `ollama` | Nhà cung cấp AI: `ollama` hoặc `openai` |
| `OLLAMA_HOST` | `http://localhost:11434` | Địa chỉ Ollama server |
| `OLLAMA_MODEL` | `qwen2.5-coder:32b` | Model Ollama sử dụng |
| `HF_TOKEN` | — | HuggingFace API token |
| `AUTO_TAG_MODEL` | `google/vit-base-patch16-224` | Model phân loại ảnh |
| `AUTO_TAG_CONFIDENCE` | `0.2` | Ngưỡng confidence cho tag |
| `AUTO_TAG_MAX_TAGS` | `5` | Số tag tối đa trả về |
| `AUTO_TAG_PROVIDER` | `huggingface` | Provider auto-tag: `huggingface` hoặc `google-vision` |

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Vue 3)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  UploadView   │  │   AIView     │  │   ChatView    │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
    ┌─────▼─────────────────▼──────────────────▼──────────┐
    │              Express 5 Backend                       │
    │  ┌──────────────────────────────────────────────┐   │
    │  │           AI Controller                      │   │
    │  │  detectImage  autoTag  chat  agentChat       │   │
    │  │  recommend  searchByAI  summarizeArtwork     │   │
    │  └──────────┬──────────┬───────────┬───────────┘   │
    │             │          │           │                │
    │    ┌────────▼──┐ ┌────▼────┐ ┌────▼───────┐       │
    │    │HuggingFace│ │Ollama   │ │ MongoDB    │       │
    │    │ Service   │ │ Service │ │ (Sessions) │       │
    │    └───────────┘ └─────────┘ └────────────┘       │
    └─────────────────────────────────────────────────────┘
```

## Tài liệu liên quan

- [Trang AI (AIView)](../pages/ai.md) — Giao diện test/demo các tính năng AI
- [Trang Chat AI (ChatView)](../pages/chat.md) — Giao diện chat với AI Assistant
- [Trang Upload](../pages/upload.md) — Luồng upload tích hợp AI Detection và Auto Tagging
- [Các nút nổi (FAB)](../layout/floating-actions.md) — Nút AI Chat FAB
