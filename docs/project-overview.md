# Tổng quan dự án: Hệ thống Chia sẻ Tranh minh họa & Truyện tranh (Pixiv Clone)

> **Cập nhật:** 20/06/2026 — Trạng thái triển khai các chức năng.
> - ✅ **Hoàn thành:** Chức năng đã code đầy đủ và hoạt động.
> - ⚠️ **Một phần:** Code đã có nhưng chưa hoàn thiện (còn stub, thiếu mảnh ghép).
> - ❌ **Chưa triển khai:** Chưa có code hoặc mới chỉ có kế hoạch.

Xây dựng hệ thống website chuyên biệt để chia sẻ, lưu trữ và khám phá các tác phẩm minh họa (illustrations), truyện tranh (manga/comic) và tiểu thuyết (novels) trực tuyến, tích hợp các tính năng xã hội và công nghệ AI hiện đại.

## 1. Công nghệ sử dụng

- **Front-end:** Vue.js (Vite, Pinia, Vue Router)
- **Back-end:** Node.js + Express.js
- **Database:** MongoDB (Mongoose)
- **Công nghệ bổ trợ:** Cloudinary CDN cho lưu trữ ảnh, Konva.js (WebGL) cho công cụ vẽ online.

## 2. Phân quyền người dùng

- **Khách vãng lai (Guest):** ✅ Xem nội dung công khai, tìm kiếm cơ bản, không thể tương tác sâu (like, comment, upload).
- **Người dùng thành viên (Member):** ✅ Đăng tải tác phẩm, tương tác đầy đủ (like, bookmark, follow, comment), quản lý gallery cá nhân.
- **Thành viên Premium:** 🗑️ Đã loại bỏ hoàn toàn khỏi hệ thống (removed).
- **Quản trị viên (Admin):** ✅ Kiểm duyệt nội dung, quản lý người dùng, dashboard thống kê, xử lý báo cáo vi phạm.

## 3. Danh sách chức năng chi tiết

### A. Quản lý Người dùng (User Management)

- **Đăng ký/Đăng nhập:**
  - ✅ Đăng ký/đăng nhập bằng Email (bcrypt + JWT)
  - ✅ Đăng nhập Google OAuth (Passport.js)
  - ✅ Facebook OAuth (Passport.js) — Đã triển khai đầy đủ route/controller + frontend button
  - 🗑️ Twitter/X OAuth — Đã loại bỏ khỏi giao diện
  - 🗑️ Apple OAuth — Đã loại bỏ khỏi giao diện
- **Hồ sơ Cá nhân (Artist Profile):**
  - ✅ Tùy chỉnh Avatar, Cover image (local + Cloudinary), Bio, Display Name
  - ✅ Liên kết mạng xã hội (socialLinks) và Portfolio cá nhân
  - ✅ Thống kê lượt bài đăng, lượt yêu thích và danh sách tác phẩm
- **Hệ thống Theo dõi (Follow System):** ✅ Theo dõi/hủy theo dõi, danh sách follower/following, kiểm tra trạng thái follow
- **Chặn người dùng (Block):** ✅ Chặn người dùng, tự động hủy follow và illuwrl request đang chờ
- **Tìm kiếm người dùng:** ✅ Tìm kiếm theo username/displayName

### B. Quản lý Tác phẩm (Artwork Management)

- **Đăng tải đa dạng nội dung:**
  - ✅ **Illustrations:** Ảnh đơn hoặc bộ sưu tập ảnh (Gallery) — hỗ trợ multi-image
  - ✅ **Manga/Comic:** Hỗ trợ xem dạng cuộn, nhiều ảnh theo thứ tự trang
  - ✅ **GIF:** Định dạng ảnh động — có policy riêng (`backend/docs/GIF_UPLOAD_POLICY.md`)
  - ✅ **Novels:** Trình soạn thảo nội dung, đọc truyện chữ (`NovelReader.vue`), quản lý chương (`ChapterManager.vue`), lưu tiến độ đọc (ReadingProgress)
  - ✅ **Chỉnh sửa thông tin artwork (Edit artwork):** PUT /api/artworks/:id — sửa title, description, ageRating, tags. Owner và admin được phép. Modal EditArtworkModal.vue trên DashboardWorksPanel (dấu ba chấm → Edit). Tag usageCount được cập nhật đúng (tăng cho tag mới, giảm cho tag bị xóa). Kèm xóa artwork ngay trên Dashboard.
- **Hệ thống Tags nâng cao:**
  - ✅ Gắn thẻ đa ngôn ngữ (hỗ trợ en/vi/ja), đếm lượt dùng (usageCount)
  - ✅ Gợi ý thẻ thông minh (auto-tagging) — Google Cloud Vision, tự động gợi ý 10 tags khi upload
  - ✅ Khóa thẻ (Tag lock) để bảo vệ tính chính xác của dữ liệu
  - ✅ Gộp thẻ (Tag merge) — quản trị viên
- **Cài đặt hiển thị & Bảo mật:**
  - ✅ Chế độ Công khai / Nháp (isDraft)
  - ✅ Phân loại độ tuổi (All ages, R-18)
  - ❌ Quản lý bản quyền chuyên biệt cho tác giả

### C. Tính năng AI tích hợp

- ⚠️ **Auto-captioning:** Tự động tạo mô tả ngắn cho ảnh — còn ở trạng thái Planned
- ✅ **AI Recommendation:** Gợi ý tác phẩm dựa trên BrowseHistory + For You Feed
- ❌ **AI Enhancement:** Công cụ nâng cấp độ phân giải (Upscaling) và làm nét ảnh — chưa triển khai
- ✅ **AI Detection:** Tự động phát hiện và gắn nhãn AI-generated — dùng HuggingFace (`umm-maybe/AI-image-detector`) + phân tích metadata dự phòng; chạy tự động khi upload artwork
- ✅ **AI Art Assistant (Chatbot):** Chat với AI (Ollama) hỗ trợ gợi ý ý tưởng — `POST /api/ai/chat`, giao diện `AIView.vue`
- ✅ **AI Search:** Tìm kiếm tác phẩm bằng ngôn ngữ tự nhiên — `POST /api/ai/search`
- ✅ **AI Summarize:** Tóm tắt nội dung tác phẩm — `POST /api/ai/summarize/:artworkId`

### D. Tương tác và Cộng đồng

- **Yêu thích & Lưu trữ:**
  - ✅ Like/Unlike tác phẩm (Like model + likeCount)
  - ✅ Bookmark tác phẩm vào thư mục (folder), công khai hoặc riêng tư
- ❌ **Favorite Tags cá nhân:** Lưu tag yêu thích theo từng người dùng (localStorage, tối đa 10) — chưa triển khai
- **Bình luận & Phản hồi:**
  - ✅ Bình luận bằng văn bản hoặc emoji/sticker
  - ✅ Trả lời bình luận (parentComment), xóa bình luận
- **Bảng xếp hạng (Ranking):** ✅ Tính toán top tác phẩm theo ngày, tuần, tháng (Daily/Weekly/Monthly/Rookie) dựa trên lượt like/bookmark/view
- **Ủy thác (Commission/Requests):** ✅ Hệ thống đầy đủ — tạo term, đặt hàng, chấp nhận/từ chối, bản nháp, revision, hoàn thành, phê duyệt, fan letter, chat, báo cáo vi phạm
- ✅ **Tin nhắn trực tiếp (Direct Messages):** Gửi/nhận, đánh dấu đã đọc, xóa mềm, tìm kiếm thread, đính kèm ảnh
- ✅ **Thông báo (Notifications):** Tự động tạo khi follow/like/bookmark/comment/request, đánh dấu đã đọc
- ✅ **Công cụ vẽ (Drawing Tool):** Trang vẽ online dùng Konva.js (`/draw`)

### E. Tìm kiếm & Khám phá

- **Tìm kiếm:**
  - ✅ Tìm kiếm theo từ khóa (title, description) — regex + type/ageRating/novelFormat filters
  - ✅ Tìm kiếm theo thẻ (tag)
  - ✅ Lọc theo loại (illust/manga/gif/novel), độ tuổi, sort (views/likes/newest/longest/shortest)
  - ❌ Bộ lọc nâng cao: tỉ lệ khung hình, số lượt bookmark (vd: 100+, 500+) — chưa triển khai
- **Khám phá (Discovery):**
  - ✅ Trang Discovery riêng (`/discovery`) với phân trang
  - ✅ Tác phẩm liên quan (Related Works) trên trang chi tiết dựa trên tag và nội dung
- ✅ **Lịch sử tìm kiếm (Search History):** Lưu trên component `AppSearchHistoryPanel.vue`

### F. Quản trị & Kỹ thuật

- **Dashboard quản trị:** ✅ Tổng quan (users/admins/artworks/comments), 6 bảng quản lý chuyên biệt
- ⚠️ **Quản lý người dùng (Admin):** Danh sách, tìm kiếm, cập nhật role — trường `isPremium` đã loại bỏ (removed)
- ✅ **Kiểm duyệt tác phẩm (Admin):** Xem danh sách, tìm kiếm, xóa tác phẩm
- ✅ **Kiểm duyệt bình luận (Admin):** Xem danh sách, tìm kiếm, xóa bình luận
- ✅ **Quản lý thẻ (Admin):** Sửa tên/bản dịch/isLocked, gộp thẻ, xóa thẻ
- ⚠️ **Tối ưu hóa CDN:** Cloudinary cho upload artwork và avatar/cover (có fallback local)
- 🗑️ **Sự kiện/Cuộc thi (Contests):** Đã loại bỏ (Removed) hoàn toàn khỏi hệ thống (bao gồm CreatorContestCard và các menu liên quan)
- ✅ **Báo cáo (Report):** Xử lý báo cáo vi phạm request — backend + `AdminReportReviewPanel.vue`
- ✅ **Triển khai (Deployment):** Cấu hình Render.com (`render.yaml`), Cloudflare (`wrangler.*`)
- ✅ **Kiểm thử đơn vị:** 2 file test (paymentValidation, requestValidation) — 10 test cases

### Chức năng MỚI (phát sinh ngoài tài liệu gốc)

Những chức năng dưới đây đã được code nhưng chưa có trong tài liệu tổng quan ban đầu:

- ✅ **Novel Chapters:** Quản lý chương truyện (Chapter model + CRUD)
- ✅ **Reading Progress:** Lưu tiến độ đọc novel (progressPercent, lastReadAt)
- ✅ **Direct Messages (nhắn tin):** REST-based inbox/sent/thread search
- ✅ **Notifications (thông báo):** 8 loại sự kiện tự động
- ✅ **User Blocking (chặn người dùng):** Block + hủy follow + hủy request
- ✅ **Drawing Tool (công cụ vẽ):** Konva.js canvas
- ✅ **AI Chat:** Chatbot tư vấn ý tưởng nghệ thuật
- ✅ **AI Search:** Tìm kiếm ngữ nghĩa bằng AI
- ✅ **AI Summarize:** Tóm tắt tác phẩm
- ✅ **Search History:** Component lưu lịch sử tìm kiếm
- ✅ **Facebook OAuth:** Đăng nhập bằng tài khoản Facebook + nút trên Login/SignUp

## 4. Cấu trúc Cơ sở Dữ liệu (thực tế — 25 models)

> Cơ sở dữ liệu thực tế đã phát triển vượt xa thiết kế ban đầu. Dưới đây là danh sách đầy đủ 18 models Mongoose đã được code:

| Model | Mô tả |
|-------|-------|
| **User** | email, password_hash, googleId, facebookId, twitterId, username, displayName, avatar, coverImage, bio, socialLinks, role |
| **Artwork** | user, title, description, type (illust/manga/gif/novel), images[], tags[], ageRating, viewCount, likeCount, bookmarkCount, commentCount, isDraft, gifNotes, novelContent, novelFormat, novelSeriesName, chapterCount, wordCount |
| **Tag** | name (unique), translations (en/vi/ja), usageCount, isLocked |
| **Comment** | artwork, user, content, parentComment, stickerUrl |
| **Like** | user, artwork (unique compound) |
| **Bookmark** | user, artwork, folder (unique compound) |
| **Follow** | follower, following (unique compound) |
| **Notification** | user, actor, artwork, type, message, isRead |
| **Message** | sender, recipient, content, images[], deletedFor[] |
| **UserBlock** | blocker, blocked (unique compound) |
| **Chapter** | artwork, title, content, chapterNumber, wordCount |
| **ReadingProgress** | user, artwork, chapter, progressPercent, scrollPosition |
| **RequestTerm** | creator, title, tier, targetPrice, workTypes[], rules, isOpen |
| **Request** | term, creator, requester, title, description, status, revisionCount |
| **RequestChatMessage** | request, sender, content, isSystem |
| **RequestEvent** | request, actor, type, fromStatus, toStatus |
| **RequestRevision** | request, requester, round, notes, status |
| **IlluWrlRequest** | requester, recipient, message, status |
