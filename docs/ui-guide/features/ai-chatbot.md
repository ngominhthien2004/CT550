# AI Chatbot — Trợ lý ảo thông minh

## 1. Tổng quan

**AI Chatbot** là trợ lý ảo tích hợp trong nền tảng IlluWrl, cho phép người dùng tương tác bằng ngôn ngữ tự nhiên để thực hiện các tác vụ liên quan đến nội dung nghệ thuật. Chatbot có khả năng:

- **Tìm kiếm tác phẩm**: Tra cứu artwork, người dùng, và plan (commission) theo từ khoá.
- **Gợi ý tác phẩm cá nhân hoá**: Dựa trên lịch sử yêu thích và bookmark của người dùng.
- **Tóm tắt nội dung**: Tóm tắt thông tin chi tiết của một tác phẩm cụ thể.
- **Tư vấn nghệ thuật**: Trả lời câu hỏi về phong cách vẽ, kỹ thuật illustration, manga.
- **Hỗ trợ đa phiên**: Quản lý nhiều cuộc hội thoại song song với lịch sử đầy đủ.

Chatbot sử dụng **Ollama** (model mặc định `qwen2.5-coder:32b`) chạy local qua giao thức HTTP — không gọi API cloud trực tiếp từ frontend, đảm bảo quyền riêng tư và kiểm soát dữ liệu.

## 2. Giao diện người dùng

### 2.1. Truy cập

```
Nút AI Chat FAB (góc dưới phải)
        │
        ├── Trên mọi trang (có MainLayoutTemplate)
        │   Icon: fa-robot, gradient tím–xanh dương
        │   Kích thước: 52×52px, hình tròn
        │
        └── Click → điều hướng đến /chat
```

Hình 1: Nút AI Chat FAB ở góc dưới bên phải màn hình.

### 2.2. Trang Chat (ChatView)

Trang `/chat` có bố cục hai cột:

```
┌──────────────────────────────────────────────────┐
│ ┌─────────────┐  ┌─────────────────────────────┐ │
│ │ Session     │  │ Chat Header                  │ │
│ │ Sidebar     │  │ 🤖 AI Assistant              │ │
│ │ (260px)     │  │ [New Chat]                   │ │
│ │             │  ├─────────────────────────────┤ │
│ │ Lịch sử     │  │ Messages Area                │ │
│ │ chat        │  │                              │ │
│ │ ─────────── │  │ 👤 User message              │ │
│ │ Session 1   │  │ 🤖 Assistant reply           │ │
│ │ Session 2   │  │                              │ │
│ │ Session 3   │  │                              │ │
│ │             │  ├─────────────────────────────┤ │
│ │             │  │ 🔍 Tìm artwork    💡 Gợi ý  │ │
│ │             │  │ 👤 Tìm user      🎨 Hỏi về   │ │
│ │             │  │           nghệ thuật         │ │
│ │             │  ├─────────────────────────────┤ │
│ │             │  │ [Input message...        📤] │ │
│ └─────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

Hình 2: Giao diện ChatView với session sidebar và khu vực chat.

#### Session Sidebar (trái)

| Thành phần | Mô tả |
|------------|-------|
| **Header** | "Lịch sử chat" + nút "+" tạo session mới |
| **Danh sách session** | Sắp xếp theo `updatedAt` (mới nhất ở trên) |
| **Session item** | Title (truncated 50 ký tự) + thời gian + nút "×" xoá (hiện khi hover) |
| **Toggle sidebar** | Chevron trái/phải để collapse/expand trên mobile |

- Session active có nền accent màu.
- Xoá session có xác nhận trước khi thực hiện.
- Session tự động đặt title từ tin nhắn đầu tiên của người dùng.

#### Khu vực Chat (phải)

| Loại tin nhắn | Hiển thị |
|---------------|----------|
| **User** | Bubble nền accent (xanh dương), căn phải, avatar 👤 |
| **Assistant** | Bubble nền surface-alt, căn trái, avatar 🤖 |
| **Error** | Bubble nền đỏ nhạt, chữ danger |
| **Welcome** | Bubble gradient tím với lời chào + danh sách khả năng |
| **Tool used** | Badge "Sử dụng công cụ" trên tin nhắn assistant |

#### Suggested Prompts

Khi chưa có tin nhắn hoặc đang ở trạng thái rảnh, hiển thị các câu gợi ý:

| Icon | Label | Nội dung gửi |
|------|-------|--------------|
| 🔍 | Tìm artwork | "Tìm artwork về phong cảnh thiên nhiên" |
| 👤 | Tìm user | "Tìm user có tên là minh" |
| 💡 | Gợi ý cho tôi | "Gợi ý cho tôi artwork hay về fantasy" |
| 🎨 | Hỏi về nghệ thuật | "Cho tôi hỏi về phong cách vẽ manga" |

#### Input Area

- Textarea bo tròn (`border-radius: 1.5rem`), placeholder "Nhập tin nhắn...".
- Nút gửi hình tròn (icon `fa-paper-plane`).
- Enter để gửi tin nhắn, Shift+Enter để xuống dòng.
- Disabled khi đang gửi hoặc đang stream response.

### 2.3. Placeholder (khi chưa chọn session)

- Icon robot lớn 🤖 + "Chào bạn!"
- Nút "Tạo chat mới" để bắt đầu cuộc trò chuyện.

## 3. Kiến trúc kỹ thuật

### 3.1. Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Vue 3 / Pinia)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   ChatView (ChatView.vue)                 │  │
│  │  ┌─────────────┐  ┌────────────────────────────────────┐  │  │
│  │  │ChatSession  │  │ ChatMessageList                    │  │  │
│  │  │Sidebar      │  │ ├── ChatBubble (user)              │  │  │
│  │  │             │  │ ├── ChatBubble (assistant)         │  │  │
│  │  │             │  │ └── ChatInput                      │  │  │
│  │  └─────────────┘  └────────────────────────────────────┘  │  │
│  │                     chatStore (Pinia)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Express 5)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Auth Middleware (protect → JWT verification)             │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              AI Controller (ai.controller.js)              │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌────────────┐  │  │
│  │  │ chat()   │  │agentChat │  │search │  │ summarize   │  │  │
│  │  │(đơn giản)│  │(agent)   │  │ByAI   │  │ Artwork     │  │  │
│  │  └──────────┘  └────┬─────┘  └───────┘  └────────────┘  │  │
│  │                     │                                      │  │
│  │                     ▼                                       │  │
│  │           ┌─────────────────┐                               │  │
│  │           │  Intent Detection│                              │  │
│  │           │  (heuristic)     │                              │  │
│  │           └──┬────┬────┬────┘                              │  │
│  │              │    │    │                                    │  │
│  │        ┌─────┘    │    └─────┐                              │  │
│  │        ▼           ▼          ▼                              │  │
│  │  ┌────────┐ ┌─────────┐ ┌──────────┐                       │  │
│  │  │ SEARCH │ │RECOMMEND│ │SUMMARIZE │                       │  │
│  │  │ Tool   │ │ Tool    │ │ Tool     │                       │  │
│  │  └───┬────┘ └────┬────┘ └────┬─────┘                       │  │
│  └──────┼───────────┼───────────┼──────────────────────────────┘  │
│         │           │           │                                  │
│         ▼           ▼           ▼                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │ MongoDB  │ │ MongoDB  │ │ MongoDB  │                          │
│  │ (Search) │ │(Favorites│ │ (Artwork │                          │
│  │          │ │  + Tags) │ │  Detail) │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
│                          │                                         │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              AI Service (ai.service.js)                    │  │
│  │  chatWithAI() / chatStreamWithAI() / buildAgentSystemPrompt│  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          ▼                                       │
│              ┌──────────────────────┐                            │
│              │  Ollama API (HTTP)   │                            │
│              │  qwen2.5-coder:32b   │                            │
│              └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2. Xác thực và phân quyền

- Tất cả API chat đều yêu cầu JWT token hợp lệ (`protect` middleware).
- Người dùng chỉ có thể truy cập session của chính mình.
- Mỗi request chat đều gắn thông tin người dùng (tên, username) để cá nhân hoá phản hồi.

### 3.3. Lưu trữ dữ liệu

#### ChatSession (MongoDB)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `user` | ObjectId (ref: User) | Chủ sở hữu session |
| `title` | String | Tiêu đề session (mặc định "Cuộc trò chuyện mới") |
| `createdAt` | Date | Ngày tạo |
| `updatedAt` | Date | Ngày cập nhật cuối |

#### ChatMessage (MongoDB)

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `session` | ObjectId (ref: ChatSession) | Session chứa tin nhắn |
| `role` | String (`user` / `assistant` / `system`) | Vai trò người gửi |
| `content` | String | Nội dung tin nhắn |
| `toolUsed` | Boolean | Tin nhắn assistant có sử dụng công cụ không |
| `isError` | Boolean | Tin nhắn lỗi |
| `isWelcome` | Boolean | Tin nhắn chào mừng đầu session |
| `createdAt` | Date | Thời gian gửi |

### 3.4. API Session

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/chat-sessions` | Danh sách session của user |
| `POST` | `/api/chat-sessions` | Tạo session mới (kèm welcome message) |
| `GET` | `/api/chat-sessions/:id` | Chi tiết session |
| `PATCH` | `/api/chat-sessions/:id` | Cập nhật title session |
| `DELETE` | `/api/chat-sessions/:id` | Xoá session và tất cả tin nhắn |
| `GET` | `/api/chat-sessions/:id/messages` | Danh sách tin nhắn trong session |

## 4. Xử lý tin nhắn Agent

### 4.1. Luồng xử lý chi tiết

```
Frontend gửi { message, history, sessionId }
        │
        ▼
Express xác thực JWT
        │
        ▼
Lưu tin nhắn user vào MongoDB (nếu có sessionId)
        │
        ▼
Lấy thông tin người dùng (username, displayName)
        │
        ▼
Phát hiện ý định (Intent Detection) qua keyword matching
        │
        ├── "tìm", "search", "tìm kiếm"           → search
        ├── "gợi ý", "đề xuất", "recommend"       → recommend
        ├── "tóm tắt", "summarize", "tổng quan"    → summarize
        └── còn lại                                → chat
        │
        ▼
Nếu ý định là search/recommend/summarize:
        │
        ├── SEARCH:
        │   ├── Regex matching trên Artwork (title, tags)
        │   ├── Regex matching trên User (username, displayName)
        │   ├── Regex matching trên Request (title)
        │   └── Trả về danh sách artwork, user, plan, tag
        │
        ├── RECOMMEND:
        │   ├── Lấy tag từ artwork user đã bookmark
        │   ├── Đếm tần suất tag → lấy top 5 tag
        │   ├── Tìm artwork tương tự (cùng tag, loại trừ của user)
        │   └── Sắp xếp theo lượt thích (likeCount)
        │
        └── SUMMARIZE:
            ├── Trích xuất artworkId từ tin nhắn (regex 24 hex)
            ├── Lấy thông tin artwork từ MongoDB
            └── Trả về { title, description, type, tags, author, stats }
        │
        ▼
Xây dựng system prompt với ngữ cảnh cá nhân hoá:
  "Bạn là trợ lý nghệ thuật IlluWrl. Tên người dùng là {userName}..."
        │
        ▼
Gọi Ollama API (qwen2.5-coder:32b) qua giao thức HTTP
        │
        ├── Có tool → gửi kết quả tool + yêu cầu giải thích
        └── Không tool → gửi hội thoại trực tiếp
        │
        ▼
Lưu tin nhắn assistant vào MongoDB (nếu có sessionId)
        │
        ▼
Cập nhật title session (nếu là tin nhắn đầu tiên)
        │
        ▼
Trả về kết quả cho frontend
```

### 4.2. Streaming (Server-Sent Events)

Phiên bản agent chat hỗ trợ streaming qua SSE (`POST /api/ai/agent-chat/stream`):

- Frontend nhận từng token qua SSE events.
- Các action frames (search, navigate) được gửi trước text tokens.
- Hỗ trợ abort (ngừng sinh) qua `AbortController`.
- Lưu tin nhắn sau khi streaming hoàn tất.

### 4.3. Phát hiện ý định (Intent Detection)

Hệ thống sử dụng phương pháp **keyword matching heuristic** (không dùng model NLP riêng):

```javascript
function detectIntent(message) {
    // Search patterns
    if (/tìm|search|tìm kiếm|cho xem/i.test(message)) return 'search';
    // Recommend patterns
    if (/gợi.ý|đề xuất|recommend|giới thiệu/i.test(message)) return 'recommend';
    // Summarize patterns
    if (/tóm tắt|summarize|tổng quan/i.test(message)) return 'summarize';
    // Default
    return 'chat';
}
```

## 5. Các endpoint AI

| Method | Endpoint | Mô tả | Input | Output |
|--------|----------|-------|-------|--------|
| `POST` | `/api/ai/chat` | Chat đơn giản (trợ lý nghệ thuật tiếng Việt) | `{ message, history }` | `{ reply }` |
| `POST` | `/api/ai/agent-chat` | Chat agent với phát hiện ý định + thực thi công cụ | `{ message, history, sessionId }` | `{ reply, toolUsed, toolResult }` |
| `POST` | `/api/ai/agent-chat/stream` | Chat agent streaming (SSE) | `{ message, history, sessionId }` | Stream `{ type, token }` events |
| `POST` | `/api/ai/recommend` | Gợi ý tác phẩm dựa trên thể loại/mô tả | `{ favoriteGenres, description }` | `{ recommendations }` |
| `POST` | `/api/ai/search` | Phân tích truy vấn, gợi ý từ khoá/thể loại/bộ lọc | `{ query }` | `{ analysis }` |
| `POST` | `/api/ai/summarize/:artworkId` | Tóm tắt nội dung tác phẩm | `artworkId` (params) | `{ summary }` |

## 6. Trạng thái và phản hồi

| Trạng thái | Hiển thị |
|-------------|----------|
| **Loading** | 3 dots animation (typing-pulse) |
| **Streaming** | Token xuất hiện dần trong bubble |
| **Error** | Bubble đỏ với icon ❌ + thông báo lỗi |
| **Success** | Bubble xanh (user) / bubble tối (assistant) |
| **Tool used** | Badge "Sử dụng công cụ" trên tin nhắn |

## 7. Ghi chú kỹ thuật

- **Ollama model**: Mặc định sử dụng `qwen2.5-coder:32b`, có thể thay đổi qua biến `OLLAMA_MODEL`.
- **Cấu hình Ollama**: Địa chỉ server mặc định `http://localhost:11434`, cấu hình qua `OLLAMA_HOСТ`.
- **Provider thay thế**: Có thể chuyển sang OpenAI-compatible API bằng cách đặt `AI_PROVIDER=openai`.
- **Session lifecycle**: Session không tự động xoá — người dùng phải xoá thủ công.
- **Welcome message**: Mỗi session mới được tạo kèm welcome message hướng dẫn người dùng.
- **ChatView hiện tại**: Component `ChatView.vue` đang ở trạng thái lưu trữ (`_archive/`), route `/chat` hiện redirect về trang chủ. Giao diện chat hoàn chỉnh đang được phát triển.

## 8. Các tệp liên quan

| Tệp | Mô tả |
|-----|-------|
| `backend/controllers/ai.controller.js` | `chat()`, `agentChat()`, `agentChatStream()`, `detectIntent()`, `executeSearchTool()`, `executeRecommendTool()`, `executeSummarizeTool()` |
| `backend/routes/ai.routes.js` | Route definitions cho tất cả AI endpoints |
| `backend/routes/chatSession.routes.js` | CRUD routes cho chat sessions |
| `backend/services/ai.service.js` | `chatWithAI()`, `chatStreamWithAI()`, `buildAgentSystemPrompt()` |
| `backend/services/agent-tools.js` | `buildAgentActions()` — xây dựng action frames cho frontend |
| `backend/models/ChatSession.js` | Mongoose schema cho session |
| `backend/models/ChatMessage.js` | Mongoose schema cho tin nhắn |
| `frontend/src/stores/chat.store.js` | Pinia store — quản lý session, tin nhắn, streaming |
| `frontend/src/components/chat/ChatBubble.vue` | Component hiển thị tin nhắn |
| `frontend/src/components/chat/ChatMessageList.vue` | Danh sách tin nhắn |
| `frontend/src/components/chat/ChatInput.vue` | Input chat |
| `frontend/src/components/chat/ChatSessionSidebar.vue` | Sidebar danh sách session |
| `frontend/src/components/chat/ChatPanelHeader.vue` | Header khu vực chat |
| `docs/ui-guide/pages/chat.md` | Tài liệu giao diện ChatView |
| `docs/ui-guide/layout/floating-actions.md` | Tài liệu nút AI Chat FAB |

## 9. Kịch bản sử dụng mẫu

### Tìm kiếm artwork

```
User: "Tìm artwork về phong cảnh thiên nhiên"
Intent: search
Action: Regex query trên Artwork.title + Tag.name
Reply: "Mình tìm thấy 3 artwork về phong cảnh:
1. "Hoàng hôn trên núi" — illustration
2. "Rừng thông mùa đông" — illustration
..."
```

### Gợi ý tác phẩm

```
User: "Gợi ý cho tôi artwork hay về fantasy"
Intent: recommend
Action: Lấy tag từ bookmark → tìm artwork tương tự
Reply: "Dựa trên sở thích của bạn, mình gợi ý:
1. "Hiệp sĩ rồng" — fantasy, tác giả: Nguyễn Văn A
..."
```

### Tóm tắt tác phẩm

```
User: "Tóm tắt artwork 507f1f77bcf86cd799439011"
Intent: summarize (trích xuất ID)
Action: Lấy thông tin artwork từ MongoDB
Reply: "Tác phẩm 'Hoàng hôn trên núi' — illustration, tác giả: ...
Đây là bức tranh phong cảnh với..."
```

### Hỏi về nghệ thuật

```
User: "Phong cách vẽ manga khác gì anime?"
Intent: chat (không khớp search/recommend/summarize)
Action: Trực tiếp gọi Ollama với system prompt
Reply: "Phong cách vẽ manga thường có nét vẽ đơn giản hơn,
tập trung vào biểu cảm nhân vật và kể chuyện..."
```
