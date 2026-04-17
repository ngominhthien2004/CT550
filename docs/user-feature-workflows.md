# User Feature Workflows (Agent Support)

## 1. Mục tiêu tài liệu

Tài liệu này mô tả luồng xử lý chức năng người dùng theo hướng:

- Frontend route -> API endpoint -> Controller -> Model/dữ liệu
- Điều kiện xác thực/quyền
- Side-effects quan trọng (counter, notification, file upload)

Phạm vi: hệ thống MEVN hiện tại trong repository CT550.

## 2. Tổng quan luồng hệ thống

- Frontend Vue Router định tuyến các màn hình user-facing.
- Frontend gọi API về backend qua namespace `/api/*`.
- Backend Express map route -> controller.
- Controller thao tác dữ liệu trên MongoDB qua Mongoose models.
- Middleware `protect` đảm bảo endpoint yêu cầu đăng nhập.
- Utility `createNotification` tạo thông báo khi có hành động tương tác.

## 3. Auth và session

### 3.1 Đăng ký

- Frontend route liên quan: `/signup`
- API: `POST /api/auth/register`
- Controller: `registerUser`
- Workflow:

1. Nhận `username`, `email`, `password`.
2. Kiểm tra trùng email/username.
3. Tạo user mới (password được hash bởi pre-save middleware).
4. Trả về thông tin user + JWT token.

### 3.2 Đăng nhập

- Frontend route liên quan: `/login`
- API: `POST /api/auth/login`
- Controller: `loginUser`
- Workflow:

1. Tìm user theo email.
2. So sánh password bằng `matchPassword`.
3. Thành công thì trả về user + JWT token.

### 3.3 OAuth (chưa hoàn tất)

- API: `POST /api/auth/oauth`
- Trạng thái: trả `501` (not implemented).

## 4. Hồ sơ người dùng và social graph

### 4.1 Xem profile

- API: `GET /api/users/:id/profile`
- Controller: `getUserProfile`
- Workflow: lấy user theo id, loại trừ `password`.

### 4.2 Cập nhật profile (cần login)

- API: `PUT /api/users/profile`
- Middleware: `protect`
- Controller: `updateUserProfile`
- Workflow:

1. Lấy user từ `req.user._id`.
2. Cập nhật trường profile (displayName, avatar, coverImage, bio, socialLinks).
3. Save và trả về thông tin profile đã cập nhật.

### 4.3 Follow/Unfollow (cần login)

- Follow API: `POST /api/users/:id/follow`
- Unfollow API: `DELETE /api/users/:id/follow`
- Follow status API: `GET /api/users/:id/follow-status`
- Controller: `followUser`, `unfollowUser`, `getFollowStatus`
- Workflow follow:

1. Chặn tự-follow.
2. Kiểm tra target user tồn tại.
3. Kiểm tra duplicate follow (model `Follow` có unique index).
4. Tạo quan hệ follow.
5. Tạo notification type `follow` cho target user.

- Workflow unfollow: xóa bản ghi Follow theo cặp `follower/following`.

### 4.4 Danh sách followers/following

- APIs:
  - `GET /api/users/:id/followers`
  - `GET /api/users/:id/following`
- Controller: `getFollowers`, `getFollowing`
- Workflow: query collection `Follow` + populate thông tin user.

## 5. Đăng và quản lý artwork

### 5.1 Upload artwork (cần login)

- Frontend route: `/upload` và `/upload/:kind`
- API: `POST /api/artworks`
- Middleware: `protect`, `multer upload.array('images', 10)`
- Controller: `createArtwork`
- Workflow:

1. Xác định thư mục upload: `public/uploads/{userId}/{type}`.
2. Validate file ảnh (jpg/jpeg/png/webp).
3. Bắt buộc có ít nhất 1 file.
4. Chuẩn hóa đường dẫn ảnh thành URL tương đối (`/uploads/...`).
5. Xử lý tags:
   - Nếu tag chưa tồn tại -> tạo mới.
   - Tăng `usageCount` cho mỗi tag.
6. Tạo artwork với user, metadata, images, tags.

### 5.2 Danh sách artwork/public listing

- API: `GET /api/artworks`
- Controller: `getArtworks`
- Filter hỗ trợ: `type`, `ageRating`, `user`, `tag`, `q`, `limit`
- Workflow:

1. Build query theo params.
2. Nếu có `tag` thì tra Tag theo tên rồi map sang `_id`.
3. Tìm artwork + populate `user`, `tags`.
4. Sort mới nhất, giới hạn kết quả.

### 5.3 Chi tiết artwork

- Frontend route: `/artworks/:id`
- API: `GET /api/artworks/:id`
- Controller: `getArtworkById`
- Workflow:

1. Tìm artwork theo id, populate user/tags.
2. Tăng `viewCount`.
3. Trả về dữ liệu chi tiết.

### 5.4 Xóa artwork (owner/admin)

- API: `DELETE /api/artworks/:id`
- Middleware: `protect`
- Controller: `deleteArtwork`
- Workflow:

1. Kiểm tra artwork tồn tại.
2. Kiểm tra quyền: owner hoặc admin.
3. Xóa file upload trong disk.
4. Xóa document artwork.

## 6. Tương tác artwork: Like, Bookmark, Comment

### 6.1 Like (cần login)

- APIs:
  - `POST /api/likes` (create)
  - `POST /api/likes/toggle` (toggle)
  - `GET /api/likes/status/:artworkId` (status)
  - `GET /api/likes` (my likes)
  - `DELETE /api/likes/:id` (delete)
- Side-effects:

1. Tăng/giảm `artwork.likeCount`.
2. Tạo notification type `like` cho owner artwork (không tự-notify).
3. Chống duplicate nhờ unique index `(user, artwork)`.

### 6.2 Bookmark (cần login)

- APIs:
  - `POST /api/bookmarks` (create)
  - `POST /api/bookmarks/toggle` (toggle)
  - `GET /api/bookmarks/status/:artworkId` (status)
  - `GET /api/bookmarks` (my bookmarks)
  - `DELETE /api/bookmarks/:id` (delete)
- Side-effects:

1. Tăng/giảm `artwork.bookmarkCount`.
2. Tạo notification type `bookmark` cho owner artwork.
3. Chống duplicate qua unique index `(user, artwork)`.

### 6.3 Comment

- Frontend route liên quan: `/artworks/:id/comments`
- APIs:
  - `POST /api/comments`
  - `GET /api/comments?artworkId=...`
  - `GET /api/comments/replies?commentId=...`
  - `DELETE /api/comments/:id`
- Workflow:

1. Tạo comment top-level cần `artworkId` và ít nhất một trong hai trường: `content` hoặc `stickerUrl`.
2. Tạo reply dùng thêm `parentCommentId` (parent phải thuộc cùng artwork).
3. Lấy danh sách comment chính bằng `GET /api/comments` (top-level), kèm `replyCount`.
4. Lấy replies của một comment bằng `GET /api/comments/replies`.
5. Tăng/giảm `artwork.commentCount` khi tạo/xóa; xóa comment top-level sẽ xóa cả direct replies và trừ counter theo số lượng đã xóa.
6. Tạo notification type `comment`: top-level notify chủ artwork, reply notify chủ comment cha (không self-notify).
7. Xóa comment chỉ owner comment hoặc admin.

## 7. Feed và ranking

### 7.1 Feed theo follow (cần login)

- Frontend route: `/feed`
- API: `GET /api/feed`
- Controller: `getFeed`
- Workflow:

1. Lấy danh sách người đang theo dõi từ `Follow`.
2. Nếu rỗng -> trả feed rỗng.
3. Lấy artwork của những user đang follow, bỏ draft (`isDraft: false`).
4. Sort mới nhất, paginate.

### 7.2 Bảng xếp hạng công khai

- Frontend route: `/rankings`
- API: `GET /api/feed/rankings?period=daily|weekly|monthly`
- Controller: `getRankings`
- Workflow:

1. Xác định khoảng thời gian theo period.
2. Lấy artwork không draft trong khoảng thời gian đó.
3. Sort theo `likeCount`, `bookmarkCount`, `viewCount`, `createdAt`.

## 8. Notification

### 8.1 Xem thông báo (cần login)

- Frontend route: `/notifications`
- API: `GET /api/notifications`
- Controller: `getMyNotifications`
- Hỗ trợ query: `page`, `limit`, `unread=true|false`
- Workflow: list thông báo của user, đếm unread, paginate.

### 8.2 Đánh dấu đã đọc

- API: `PATCH /api/notifications/:id/read`
- Controller: `markNotificationRead`
- Workflow: chỉ owner notification mới được mark read.

## 9. Tin nhắn (Messages)

### 9.1 Hộp thư đến/đi (cần login)

- Frontend route: `/messages`
- API: `GET /api/messages?box=inbox|sent`
- Controller: `getMyMessages`
- Workflow:

1. Mặc định `box=inbox`, hỗ trợ `sent`.
2. Lấy danh sách message + đếm unread của inbox.
3. Paginate theo page/limit.

### 9.2 Gửi tin nhắn

- API: `POST /api/messages`
- Controller: `createMessage`
- Workflow:

1. Bắt buộc `recipientId` và `content`.
2. Chặn gửi cho chính mình.
3. Kiểm tra recipient tồn tại.
4. Tạo message và trả về dữ liệu populate.

### 9.3 Đánh dấu tin nhắn đã đọc

- API: `PATCH /api/messages/:id/read`
- Controller: `markMessageRead`
- Workflow: chỉ recipient của message mới được mark read.

## 10. Tag và khả năng khám phá

### 10.1 Tag phổ biến

- API: `GET /api/tags`
- Controller: `listTags`
- Workflow: lấy tag có `usageCount > 0`, sort giảm dần theo usage.

### 10.2 Chi tiết tag

- Frontend route: `/tags/:tagName`
- API: `GET /api/tags/:tagName`
- Controller: `getTagDetail`
- Workflow:

1. normalize tagName.
2. Tìm tag.
3. Trả về danh sách artwork thuộc tag đó.

## 11. Route cần đăng nhập (frontend)

Các route có `meta.requiresAuth = true`:

- `/bookmarks`
- `/favorites`
- `/messages`
- `/notifications`
- `/upload` và `/upload/:kind`
- `/dashboard`

Guard frontend nếu chưa đăng nhập sẽ redirect đến `/login` và giữ query `redirect`.

## 12. Các side-effects và bất biến quan trọng cho agent

- Counter fields trên artwork (`viewCount`, `likeCount`, `bookmarkCount`, `commentCount`) được cập nhật trong controllers liên quan, không qua hook model.
- `createNotification` tự động bỏ qua self-action (actorId == userId).
- Quan hệ duplicate được chặn bởi unique index:
  - Follow: `(follower, following)`
  - Like: `(user, artwork)`
  - Bookmark: `(user, artwork)`
- Upload artwork đang lưu local file system (`backend/public/uploads`) và expose static qua `/uploads`.

## 13. Gợi ý sử dụng tài liệu cho agent

Khi implement/chỉnh sửa tính năng, agent nên:

1. Xác định frontend route bị ảnh hưởng.
2. Liên kết endpoint backend từ route đó.
3. Kiểm tra side-effects (counter, notification, auth).
4. Kiểm tra model index/constraint liên quan trước khi đổi contract.
5. Nếu đổi response API, đổi đồng bộ trên view/store frontend.

## 14. Nguồn tham chiếu trong codebase

- Backend wiring: `backend/server.js`
- Frontend routing: `frontend/src/router/index.js`
- Controllers: `backend/controllers/*.js`
- Models: `backend/models/*.js`
