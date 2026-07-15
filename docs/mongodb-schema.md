# IlluWrl — MongoDB Schema (Tiếng Việt)

> **Cập nhật:** 2026-07-15
> **Số collection:** 27
> **Mô tả:** Chi tiết các collection trong MongoDB, bao gồm kiểu dữ liệu, khoá chính, khoá ngoại, ràng buộc Not Null và diễn giải.

---

## USER — Người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã người dùng (tự động sinh) |
| `email` | string |  |  |  | Email đăng nhập (duy nhất) |
| `username` | string |  |  |  | Tên người dùng (duy nhất) |
| `displayName` | string |  |  |  | Tên hiển thị của người dùng |
| `avatar` | string |  |  |  | Đường dẫn ảnh đại diện |
| `coverImage` | string |  |  |  | Đường dẫn ảnh bìa |
| `bio` | string |  |  |  | Tiểu sử người dùng |
| `gender` | string |  |  |  | Giới tính |
| `location` | string |  |  |  | Địa điểm |
| `birthYear` | number |  |  |  | Năm sinh |
| `birthdayMonth` | number |  |  |  | Tháng sinh |
| `birthdayDay` | number |  |  |  | Ngày sinh |
| `website` | string |  |  |  | Trang web cá nhân |
| `socialLinks` | object |  |  |  | Liên kết mạng xã hội (X, Facebook, Instagram) — object nhúng trong document User |
| `isSuspended` | boolean |  |  |  | Tài khoản có bị treo hay không |
| `role` | string |  |  |  | Vai trò: user | admin |
| `password` | string |  |  |  | Mật khẩu (đã mã hoá) |
| `googleId` | string |  |  |  | ID tài khoản Google (dùng cho đăng nhập OAuth) |
| `facebookId` | string |  |  |  | ID tài khoản Facebook (dùng cho đăng nhập OAuth) |
| `twitterId` | string |  |  |  | ID tài khoản Twitter (dùng cho đăng nhập OAuth) |
| `createdAt` | date |  |  |  | Thời điểm tạo tài khoản |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## FOLLOW — Theo dõi

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã theo dõi (tự động sinh) |
| `follower` | objectId |  | X | X | Người theo dõi |
| `following` | objectId |  | X | X | Người được theo dõi |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## USER_BLOCK — Chặn người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chặn (tự động sinh) |
| `blocker` | objectId |  | X | X | Người thực hiện chặn |
| `blocked` | objectId |  | X | X | Người bị chặn |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## SETTING — Cấu hình hệ thống

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | string | X |  | X | Khoá singleton (global) |
| `aiDetectionEnabled` | boolean |  |  |  | Bật/tắt tính năng phát hiện AI trên toàn hệ thống |
| `autoTaggingEnabled` | boolean |  |  |  | Bật/tắt tính năng tự động gắn thẻ AI |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## MESSAGE — Tin nhắn

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tin nhắn (tự động sinh) |
| `sender` | objectId |  | X | X | Người gửi tin nhắn |
| `recipient` | objectId |  | X | X | Người nhận tin nhắn |
| `content` | string |  |  |  | Nội dung tin nhắn |
| `images` | array |  |  |  | Danh sách ảnh đính kèm |
| `isRead` | boolean |  |  |  | Đánh dấu đã đọc |
| `readAt` | date |  |  |  | Thời điểm người nhận đọc tin nhắn |
| `deletedFor` | array |  |  |  | Danh sách người dùng đã xóa tin nhắn này |
| `createdAt` | date |  |  |  | Thời điểm gửi tin nhắn |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## NOTIFICATION — Thông báo

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã thông báo (tự động sinh) |
| `user` | objectId |  | X | X | Người nhận thông báo |
| `actor` | objectId |  | X | X | Người kích hoạt thông báo |
| `artwork` | objectId |  | X | X | Tác phẩm liên quan (tuỳ chọn) |
| `type` | string |  |  |  | Loại thông báo: follow | like | bookmark | comment | request | system |
| `message` | string |  |  |  | Nội dung thông báo |
| `metadata` | mixed |  |  |  | Dữ liệu ngữ cảnh động (tuỳ chọn) |
| `isRead` | boolean |  |  |  | Đánh dấu đã đọc |
| `createdAt` | date |  |  |  | Thời điểm gửi thông báo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## ARTWORK — Tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tác phẩm (tự động sinh) |
| `user` | objectId |  | X | X | Người đăng tác phẩm |
| `title` | string |  |  |  | Tiêu đề tác phẩm |
| `description` | string |  |  |  | Mô tả tác phẩm |
| `type` | string |  |  |  | Loại tác phẩm: illust | manga | gif | novel |
| `images` | array |  |  |  | Danh sách đường dẫn ảnh/tệp của tác phẩm |
| `tags` | array |  |  |  | Danh sách thẻ gắn vào tác phẩm |
| `ageRating` | string |  |  |  | Tất cả | R-18 |
| `viewCount` | number |  |  |  | Số lượt xem (duy trì tự động bằng $inc) |
| `likeCount` | number |  |  |  | Số lượt thích (duy trì tự động bằng $inc) |
| `bookmarkCount` | number |  |  |  | Số lượt đánh dấu (duy trì tự động bằng $inc) |
| `commentCount` | number |  |  |  | Số bình luận (duy trì tự động bằng $inc) |
| `reportCount` | number |  |  |  | Số lần bị báo cáo (duy trì tự động bằng $inc) |
| `novelContent` | string |  |  |  | Nội dung tiểu thuyết (dạng văn bản) |
| `chapterCount` | number |  |  |  | Số chương (mặc định 1) |
| `wordCount` | number |  |  |  | Số từ (tự động tính từ novelContent) |
| `series` | objectId |  | X |  | Series chứa tác phẩm (tuỳ chọn, ref Series) |
| `commentsEnabled` | boolean |  |  |  | Cho phép bình luận trên tác phẩm |
| `isHidden` | boolean |  |  |  | Tác phẩm có bị ẩn (bởi kiểm duyệt) hay không |
| `hiddenBy` | objectId |  | X |  | Người kiểm duyệt ẩn tác phẩm |
| `hiddenAt` | date |  |  |  | Thời điểm bị ẩn |
| `hiddenReason` | string |  |  |  | Lý do bị ẩn |
| `createdAt` | date |  |  |  | Thời điểm đăng tác phẩm |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## TAG — Thẻ

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã thẻ (tự động sinh) |
| `name` | string |  |  |  | Tên thẻ (duy nhất) |
| `translations` | object |  |  |  | Bản dịch đa ngôn ngữ {en,vi,ja} |
| `usageCount` | number |  |  |  | Số lần thẻ được sử dụng |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## COMMENT — Bình luận

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã bình luận (tự động sinh) |
| `artwork` | objectId |  | X | X | Tác phẩm được bình luận |
| `user` | objectId |  | X | X | Tác giả bình luận |
| `content` | string |  |  |  | Nội dung bình luận |
| `parentComment` | objectId |  | X | X | Bình luận cha (tự tham chiếu cho trả lời) |
| `emoji` | string |  |  |  | Biểu tượng cảm xúc (emoji) đính kèm bình luận |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## LIKE — Lượt thích

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã lượt thích (tự động sinh) |
| `user` | objectId |  | X | X | Người thích |
| `artwork` | objectId |  | X | X | Tác phẩm được thích |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## BOOKMARK — Đánh dấu

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã đánh dấu (tự động sinh) |
| `user` | objectId |  | X | X | Người đánh dấu |
| `artwork` | objectId |  | X | X | Tác phẩm được đánh dấu |
| `folder` | string |  |  |  | Tên thư mục lưu đánh dấu |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## CHAPTER — Chương

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chương (tự động sinh) |
| `artwork` | objectId |  | X | X | Tác phẩm chứa chương |
| `title` | string |  |  |  | Tiêu đề chương |
| `content` | string |  |  |  | Nội dung chương |
| `chapterNumber` | number |  |  |  | duy nhất trong tác phẩm |
| `wordCount` | number |  |  |  | Số từ trong chương |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## READING_PROGRESS — Tiến độ đọc

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tiến độ đọc (tự động sinh) |
| `user` | objectId |  | X | X | Người đọc |
| `artwork` | objectId |  | X | X | Tác phẩm đang đọc |
| `chapter` | objectId |  | X | X | Chương đang đọc |
| `progressPercent` | number |  |  |  | Phần trăm hoàn thành (0-100) |
| `scrollPosition` | number |  |  |  | Vị trí cuộc đang đọc (dùng để khôi phục) |
| `lastReadAt` | date |  |  |  | Thời điểm đọc gần nhất |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## SERIES —.Series tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã series (tự động sinh) |
| `user` | objectId |  | X | X | Chủ sở hữu series |
| `title` | string |  |  |  | Tiêu đề series |
| `description` | string |  |  |  | Mô tả series |
| `type` | string |  |  |  | Loại series: manga | novel | illust |
| `coverImage` | string |  |  |  | Ảnh bìa series |
| `novelArtwork` | objectId |  | X |  | Tác phẩm chứa chương cho series tiểu thuyết (tuỳ chọn) |
| `artworks` | array |  | X |  | Danh sách tác phẩm trong series (manga/illust), theo thứ tự |
| `artworkCount` | number |  |  |  | Số lượng tác phẩm trong series |
| `totalViews` | number |  |  |  | Tổng lượt xem của series |
| `totalLikes` | number |  |  |  | Tổng lượt thích của series |
| `isCompleted` | boolean |  |  |  | Series đã hoàn thành hay chưa |
| `tags` | array |  | X |  | Danh sách thẻ gắn vào series |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## BROWSE_HISTORY — Lịch sử duyệt

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã lịch sử (tự động sinh) |
| `user` | objectId |  | X | X | Người dùng duyệt |
| `artwork` | objectId |  | X | X | Tác phẩm đã xem |
| `createdAt` | date |  |  |  | Thời điểm xem |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## BANNER — Banner

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã banner (tự động sinh) |
| `image` | string |  |  |  | Đường dẫn ảnh banner |
| `link` | string |  |  |  | Đường dẫn liên kết |
| `title` | string |  |  |  | Tiêu đề banner |
| `type` | string |  |  |  | Loại: home | illust | manga | gif | novel |
| `isActive` | boolean |  |  |  | Banner có đang hiển thị hay không |
| `sortOrder` | number |  |  |  | Thứ tự hiển thị |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## VIEW_EVENT — Sự kiện xem

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã sự kiện xem (tự động sinh) |
| `artwork` | objectId |  | X | X | Tác phẩm được xem |
| `user` | objectId |  | X |  | Người dùng xem (có thể null nếu chưa đăng nhập) |
| `createdAt` | date |  |  |  | Thời điểm xem |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## CHAT_SESSION — Phiên AI Chat

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã phiên (tự động sinh) |
| `user` | objectId |  | X | X | Người dùng sở hữu phiên |
| `title` | string |  |  |  | Tiêu đề phiên (mặc định: Cuộc trò chuyện mới) |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## CHAT_MESSAGE — Tin nhắn AI Chat

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tin nhắn (tự động sinh) |
| `session` | objectId |  | X | X | Phiên chứa tin nhắn |
| `role` | string |  |  |  | Vai trò: user | assistant | system |
| `content` | string |  |  |  | Nội dung tin nhắn |
| `toolUsed` | boolean |  |  |  | Có sử dụng tool (search, recommend) hay không |
| `isError` | boolean |  |  |  | Tin nhắn có phải lỗi hay không |
| `isWelcome` | boolean |  |  |  | Tin nhắn chào mừng hay không |
| `createdAt` | date |  |  |  | Thời điểm tạo |

## ARTWORK_REPORT — Báo cáo tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã báo cáo (tự động sinh) |
| `artwork` | objectId |  | X | X | Tác phẩm bị báo cáo |
| `reportedBy` | objectId |  | X | X | Người báo cáo |
| `reason` | string |  |  |  | spam|inappropriate|copyright|harassment|nsfw|other |
| `description` | string |  |  |  | Mô tả chi tiết lý do báo cáo |
| `status` | string |  |  |  | Trạng thái xử lý: pending | resolved | dismissed |
| `resolvedBy` | objectId |  | X | X | Người xử lý |
| `resolvedAt` | date |  |  |  | Thời điểm xử lý báo cáo |
| `resolutionNote` | string |  |  |  | Ghi chú của người xử lý |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## USER_REPORT — Báo cáo người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã báo cáo (tự động sinh) |
| `reportedUser` | objectId |  | X | X | Người dùng bị báo cáo |
| `reportedBy` | objectId |  | X | X | Người báo cáo |
| `reason` | string |  |  |  | spam|inappropriate|harassment|impersonation|other |
| `description` | string |  |  |  | Mô tả chi tiết lý do báo cáo |
| `status` | string |  |  |  | Trạng thái xử lý: pending | resolved | dismissed |
| `resolvedBy` | objectId |  | X | X | Người xử lý |
| `resolvedAt` | date |  |  |  | Thời điểm xử lý báo cáo |
| `resolutionNote` | string |  |  |  | Ghi chú của người xử lý |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## COMMENT_REPORT — Báo cáo bình luận

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã báo cáo (tự động sinh) |
| `comment` | objectId |  | X | X | Bình luận bị báo cáo |
| `reportedBy` | objectId |  | X | X | Người báo cáo |
| `reason` | string |  |  |  | spam|inappropriate|harassment|other |
| `description` | string |  |  |  | Mô tả chi tiết lý do báo cáo |
| `status` | string |  |  |  | Trạng thái xử lý: pending | resolved | dismissed |
| `resolvedBy` | objectId |  | X | X | Người xử lý |
| `resolvedAt` | date |  |  |  | Thời điểm xử lý báo cáo |
| `resolutionNote` | string |  |  |  | Ghi chú của người xử lý |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## REQUEST_TERM — Điều khoản ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã điều khoản (tự động sinh) |
| `creator` | objectId |  | X | X | Người sáng tạo (cung cấp dịch vụ) |
| `title` | string |  |  |  | Tiêu đề gói điều khoản |
| `tier` | string |  |  |  | Hạng mục (cấp độ dịch vụ) |
| `targetPrice` | number |  |  |  | Giá mục tiêu cho một yêu cầu |
| `currency` | string |  |  |  | Đơn vị tiền tệ (VD: USD, VND) |
| `acceptedWorkTypes` | array |  |  |  | Danh sách loại công việc chấp nhận |
| `estimatedDays` | number |  |  |  | Số ngày ước tính hoàn thành |
| `maxOpenRequests` | number |  |  |  | Số yêu cầu mở tối đa cùng lúc |
| `acceptedAgeRatings` | array |  |  |  | Độ tuổi chấp nhận (all, r-18) |
| `rules` | string |  |  |  | Nội quy / quy tắc khi đặt hàng |
| `forbiddenTopics` | array |  |  |  | Danh sách chủ đề không nhận |
| `preferredStyles` | array |  |  |  | Phong cách ưa thích |
| `strengths` | string |  |  |  | Thế mạnh của người sáng tạo |
| `commercialUse` | object |  |  |  | Cấu hình sử dụng thương mại {allowed, feeMultiplier, notes} — object nhúng trong RequestTerm |
| `isOpen` | boolean |  |  |  | Đang mở nhận ủy thác hay không |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## REQUEST — Yêu cầu ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã yêu cầu (tự động sinh) |
| `term` | objectId |  | X | X | Điều khoản áp dụng cho yêu cầu |
| `creator` | objectId |  | X | X | Người sáng tạo nhận yêu cầu |
| `requester` | objectId |  | X | X | Người đặt yêu cầu (khách hàng) |
| `title` | string |  |  |  | Tiêu đề yêu cầu |
| `description` | string |  |  |  | Mô tả chi tiết yêu cầu |
| `workType` | string |  |  |  | Loại công việc yêu cầu |
| `tags` | array |  |  |  | Danh sách thẻ liên quan |
| `specifics` | object |  |  |  | Chi tiết yêu cầu {pose, outfit, mood, lighting, angle, other} — object nhúng trong Request |
| `proposedAmount` | number |  |  |  | Số tiền đề xuất |
| `currency` | string |  |  |  | Đơn vị tiền tệ |
| `visibility` | string |  |  |  | Chế độ hiển thị (public | private) |
| `isAnonymous` | boolean |  |  |  | Yêu cầu có ẩn danh hay không |
| `ageRating` | string |  |  |  | Độ tuổi của yêu cầu |
| `status` | string |  |  |  | pending|in_progress|draft_submitted|revision|completed|rejected|cancelled |
| `referenceImages` | array |  |  |  | Danh sách ảnh tham khảo (mảng object nhúng, không phải ref) |
| `draftFiles` | array |  |  |  | Danh sách tệp nháp (mảng object nhúng) |
| `finalFiles` | array |  |  |  | Danh sách tệp hoàn thiện (mảng object nhúng) |
| `giftFiles` | array |  |  |  | Danh sách tệp quà tặng (mảng object nhúng) |
| `revisionCount` | number |  |  |  | Số lần chỉnh sửa đã thực hiện |
| `autoCompleteAt` | date |  |  |  | Thời điểm tự động đánh dấu hoàn thành |
| `dueAt` | date |  |  |  | Thời hạn hoàn thành |
| `extensionRequestedAt` | date |  |  |  | Thời điểm yêu cầu gia hạn |
| `extensionDays` | number |  |  |  | Số ngày gia hạn thêm |
| `chatClosedAt` | date |  |  |  | Thời điểm đóng chat của yêu cầu |
| `licenseTier` | string |  |  |  | Cấp giấy phép sử dụng: personal | commercial |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tin nhắn (tự động sinh) |
| `request` | objectId |  | X | X | Yêu cầu chứa tin nhắn |
| `sender` | objectId |  | X | X | Người gửi tin nhắn |
| `content` | string |  |  |  | Nội dung tin nhắn |
| `attachments` | array |  |  |  | Tệp đính kèm (hình ảnh, tệp) |
| `isSystem` | boolean |  |  |  | Tin nhắn hệ thống (tự động sinh bởi state machine) |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## REQUEST_EVENT — Sự kiện ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã sự kiện (tự động sinh) |
| `request` | objectId |  | X | X | Yêu cầu chứa sự kiện |
| `actor` | objectId |  | X | X | Người thực hiện hành động |
| `type` | string |  |  |  | Loại sự kiện (request_submitted, accepted, rejected, ...) |
| `fromStatus` | string |  |  |  | Trạng thái trước khi chuyển |
| `toStatus` | string |  |  |  | Trạng thái sau khi chuyển |
| `metadata` | object |  |  |  | Dữ liệu ngữ cảnh động, chứa thông tin chi tiết theo từng loại sự kiện (VD: lý do từ chối, thông tin revision, số ngày gia hạn, chi tiết báo cáo) |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

## REQUEST_REVISION — Chỉnh sửa ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chỉnh sửa (tự động sinh) |
| `request` | objectId |  | X | X | Yêu cầu cần chỉnh sửa |
| `requester` | objectId |  | X | X | Người yêu cầu chỉnh sửa |
| `round` | number |  |  |  | 1 | 2 — Duy nhất trong yêu cầu |
| `notes` | string |  |  |  | Nội dung yêu cầu chỉnh sửa |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

---

*Cập nhật lần cuối: 2026-07-15 — 27 collection.*
