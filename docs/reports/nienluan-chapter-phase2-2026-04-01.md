# PHẦN NỘI DUNG

## I. Đặc tả yêu cầu
### 1. Mô tả hệ thống
- Bối cảnh bài toán: Xây dựng nền tảng chia sẻ tranh minh họa/comic theo định hướng Pixiv Clone, ưu tiên trải nghiệm cộng đồng và khám phá nội dung.
- Đối tượng sử dụng: Khách vãng lai, thành viên, thành viên premium, quản trị viên.
- Chức năng chính: Auth/profile/follow (Phase 1), artwork CRUD (Phase 1), social workflows gồm comment, bookmark, feed, ranking/discovery (Phase 2), và chuẩn bị nền cho moderation/reporting.

### 2. Công nghệ sử dụng
- Frontend: Vue 3 + Vite + Pinia + Vue Router.
- Backend: Node.js + Express + middleware auth/error.
- Database: MongoDB + Mongoose.
- Công cụ hỗ trợ: Git/GitHub, VS Code, npm scripts, tài liệu chuẩn hóa tracker/plan/contract.

## II. Thiết kế giải pháp
### 1. Sơ đồ use case
- Mô tả actors:
  - Member: xem feed, bookmark, comment, xem ranking.
  - Guest: xem ranking công khai.
  - Admin: có quyền mở rộng cho moderation/reporting (đang planned).
- Mô tả các use case chính:
  - Tạo/Xóa comment theo artwork.
  - Tạo/Xóa bookmark và xem danh sách bookmark cá nhân.
  - Xem feed cá nhân dựa trên quan hệ follow.
  - Xem ranking theo chu kỳ ngày/tuần/tháng.

### 2. Mô hình mức quan niệm
- Thực thể chính:
  - User, Artwork, Follow, Comment, Bookmark, Tag.
- Liên kết giữa các thực thể:
  - User 1-N Artwork.
  - User N-N User qua Follow.
  - Artwork 1-N Comment, User 1-N Comment.
  - User 1-N Bookmark và Bookmark N-1 Artwork.

### 3. Mô hình mức luận lý
- Lược đồ dữ liệu:
  - Comment(artwork, user, content, createdAt, updatedAt).
  - Bookmark(user, artwork, folder, createdAt, updatedAt).
  - Artwork có denormalized counters: viewCount, likeCount, bookmarkCount, commentCount.
- Quy tắc ràng buộc:
  - Bookmark unique theo (user, artwork).
  - Comment/Bookmark delete yêu cầu owner hoặc admin.
  - Feed yêu cầu xác thực; ranking public.

### 4. Mô hình mức vật lý (nếu áp dụng)
- Cách triển khai lưu trữ:
  - MongoDB collections: users, artworks, follows, comments, bookmarks, tags.
- Chỉ mục/hiệu năng:
  - comments: { artwork: 1, createdAt: -1 }, { user: 1, createdAt: -1 }.
  - bookmarks: unique { user: 1, artwork: 1 }, { user: 1, createdAt: -1 }.
  - counters trên artworks giúp giảm chi phí aggregate ở luồng đọc nhanh.

## III. Cài đặt giải pháp và giới thiệu chương trình
### 1. Giao diện người dùng
- Màn hình chính:
  - HomePage theo phong cách Pixiv-like với dữ liệu mock/ảnh để chốt UI flow.
  - Các route chính: `/`, `/feed`, `/bookmarks`, `/rankings`, `/artworks/:id/comments`.
- Luồng thao tác:
  - Member mở feed, thêm/xóa bookmark, thêm/xóa comment, xem ranking.
  - UI đã tích hợp action thực cho comment/bookmark qua store + API service.

### 2. Giao diện quản trị
- Quản lý dữ liệu:
  - Chưa triển khai dashboard quản trị riêng trong Phase 2 Social Features.
- Kiểm soát quyền:
  - Backend đã có middleware `protect` và nền role `admin` để mở rộng moderation/reporting.

### 3. API và xử lý dữ liệu
- Endpoint tiêu biểu:
  - POST/GET/DELETE `/api/comments`.
  - POST/GET/DELETE `/api/bookmarks`.
  - GET `/api/feed`.
  - GET `/api/feed/rankings`.
- Luồng xác thực/ủy quyền:
  - Token Bearer từ frontend (axios interceptor) vào backend middleware `protect`.
  - Endpoint tạo/xóa dữ liệu yêu cầu xác thực; ranking cho phép public.

## IV. Đánh giá kiểm thử
### 1. Kiểm thử chức năng người dùng
- Danh sách test case:
  - Build frontend.
  - Smoke start backend.
  - Luồng API social: comments/bookmarks/feed/ranking theo contract.
- Kết quả:
  - Frontend build thành công.
  - Backend boot thành công và kết nối MongoDB thành công.
  - Feature tracker ghi nhận Phase 2 Social Features trạng thái Done.

### 2. Kiểm thử chức năng quản trị
- Danh sách test case:
  - Kiểm thử moderation/reporting admin.
- Kết quả:
  - Chưa triển khai đầy đủ trong phạm vi phase social hiện tại; đang ở Planned.

## V. Kết luận
### 1. Kết quả đạt được
- Hoàn thiện luồng social nền tảng theo backend-first: comment, bookmark, feed, ranking.
- Đồng bộ API contract, DB index/counter considerations và frontend integration.
- Chuẩn hóa quy trình tài liệu, tracker, plan cho các phase tiếp theo.

### 2. Hạn chế
- Moderation/reporting admin chưa hoàn tất trong nhánh feature này.
- Một số phần UI hiện dùng dữ liệu mock để chốt trải nghiệm trước khi bind đầy đủ dữ liệu thật.

### 3. Hướng phát triển
- Hoàn thiện Phase 2 moderation/reporting workflow.
- Bổ sung test case tự động (unit/integration/e2e) cho social flows.
- Tối ưu ranking bằng cơ chế cache/snapshot nếu dữ liệu tăng lớn.
