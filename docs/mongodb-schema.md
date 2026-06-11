# IlluWrl — MongoDB Schema (Tiếng Việt)

> **Ngày tạo:** 2026-06-11
> **Số collection:** 19
> **Mô tả:** Chi tiết các collection trong MongoDB, bao gồm kiểu dữ liệu, khoá chính, khoá ngoại, ràng buộc Not Null và diễn giải.

---

## USER — Người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã người dùng (tự động sinh) |
| `email` | string |  |  |  | Email đăng nhập duy nhất |
| `username` | string |  |  |  | Tên hiển thị duy nhất |
| `displayName` | string |  |  |  | Tên hiển thị của người dùng |
| `avatar` | string |  |  |  | Đường dẫn ảnh đại diện |
| `coverImage` | string |  |  |  | Đường dẫn ảnh bìa |
| `bio` | string |  |  |  | Tiểu sử người dùng |
| `gender` | string |  |  |  | Giới tính |
| `location` | string |  |  |  | Địa điểm |
| `birthday` | date |  |  |  | Ngày sinh |
| `occupation` | string |  |  |  | Nghề nghiệp |
| `website` | string |  |  |  | Trang web cá nhân |
| `socialLinks` | object |  |  |  | Nhúng {x,facebook,instagram} |
| `role` | string |  |  |  | người dùng | quản trị viên |
| `aiDetectionEnabled` | boolean |  |  |  | Bật/tắt phát hiện AI |
| `password` | string |  |  |  | đã mã hoá |
| `googleId` | string |  |  |  | ID tài khoản Google (dùng cho đăng nhập OAuth) |
| `facebookId` | string |  |  |  | ID tài khoản Facebook (dùng cho đăng nhập OAuth) |
| `twitterId` | string |  |  |  | ID tài khoản Twitter (dùng cho đăng nhập OAuth) |

## FOLLOW — Theo dõi

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã theo dõi (tự động sinh) |
| `follower` | objectId |  | X | X | Người theo dõi |
| `following` | objectId |  | X | X | Người được theo dõi |

## USER_BLOCK — Chặn người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chặn (tự động sinh) |
| `blocker` | objectId |  | X | X | Tham chiếu User |
| `blocked` | objectId |  | X | X | Tham chiếu User |

## SETTING — Cấu hình hệ thống

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | string | X |  | X | singleton key: global |
| `aiDetectionEnabled` | boolean |  |  |  | Bật/tắt tính năng phát hiện AI trên toàn hệ thống |
| `aiDetectionThreshold` | number |  |  |  | 0-100 |

## MESSAGE — Tin nhắn

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tin nhắn (tự động sinh) |
| `sender` | objectId |  | X | X | Tham chiếu User |
| `recipient` | objectId |  | X | X | Tham chiếu User |
| `content` | string |  |  |  | Nội dung tin nhắn |
| `images` | array |  |  |  | Danh sách ảnh đính kèm |
| `isRead` | boolean |  |  |  | Đánh dấu đã đọc |
| `readAt` | date |  |  |  | Thời điểm người nhận đọc tin nhắn |
| `deletedFor` | array |  |  |  | Tham chiếu User[] |

## NOTIFICATION — Thông báo

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã thông báo (tự động sinh) |
| `user` | objectId |  | X | X | Người nhận thông báo |
| `actor` | objectId |  | X | X | Người kích hoạt thông báo |
| `artwork` | objectId |  | X | X | Tác phẩm liên quan (tuỳ chọn) |
| `type` | string |  |  |  | follow|like|bookmark|comment|request|system |
| `message` | string |  |  |  | Nội dung thông báo |
| `isRead` | boolean |  |  |  | Đánh dấu đã đọc |
| `readAt` | date |  |  |  | Thời điểm đọc thông báo |

## ARTWORK — Tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tác phẩm (tự động sinh) |
| `user` | objectId |  | X | X | Người sáng tạo |
| `title` | string |  |  |  | Tiêu đề tác phẩm |
| `description` | string |  |  |  | Mô tả tác phẩm |
| `type` | string |  |  |  | illust|manga|gif|novel |
| `images` | array |  |  |  | Danh sách đường dẫn ảnh/tệp của tác phẩm |
| `tags` | array |  |  |  | Tham chiếu Tag[] |
| `ageRating` | string |  |  |  | Tất cả | R-18 | R-18G |
| `viewCount` | number |  |  |  | Số lượt xem |
| `likeCount` | number |  |  |  | Số lượt thích |
| `bookmarkCount` | number |  |  |  | Số lượt đánh dấu |
| `commentCount` | number |  |  |  | Số bình luận |
| `reportCount` | number |  |  |  | Số lần bị báo cáo |
| `gifNotes` | object |  |  |  | Ghi chú GIF (thời gian hiển thị từng khung hình) |
| `novelContent` | string |  |  |  | Nội dung tiểu thuyết (dạng văn bản) |
| `novelFormat` | string |  |  |  | oneshot|series |
| `novelSeriesName` | string |  |  |  | Tên series tiểu thuyết |
| `chapterCount` | number |  |  |  | Số chương (nếu là series) |
| `wordCount` | number |  |  |  | Số từ |
| `isHidden` | boolean |  |  |  | Tác phẩm có bị ẩn (bởi kiểm duyệt) hay không |
| `hiddenBy` | objectId |  | X | X | Người kiểm duyệt |
| `hiddenAt` | date |  |  |  | Thời điểm bị ẩn |
| `hiddenReason` | string |  |  |  | Lý do bị ẩn |

## TAG — Thẻ

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã thẻ (tự động sinh) |
| `name` | string |  |  |  | Tên thẻ (duy nhất) |
| `translations` | object |  |  |  | Nhúng {en,vi,ja} |
| `usageCount` | number |  |  |  | Số lần thẻ được sử dụng |
| `isLocked` | boolean |  |  |  | Thẻ có bị khoá (không cho xoá/sửa) hay không |

## COMMENT — Bình luận

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã bình luận (tự động sinh) |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `user` | objectId |  | X | X | Tác giả bình luận |
| `content` | string |  |  |  | Nội dung bình luận |
| `parentComment` | objectId |  | X | X | Tham chiếu Comment — self for replies |
| `stickerUrl` | string |  |  |  | Đường dẫn sticker (nếu có) |

## LIKE — Lượt thích

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã lượt thích (tự động sinh) |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |

## BOOKMARK — Đánh dấu

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã đánh dấu (tự động sinh) |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `folder` | string |  |  |  | Tên thư mục lưu đánh dấu |

## CHAPTER — Chương

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chương (tự động sinh) |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `title` | string |  |  |  | Tiêu đề chương |
| `content` | string |  |  |  | Nội dung chương |
| `chapterNumber` | number |  |  |  | duy nhất trong tác phẩm |
| `wordCount` | number |  |  |  | Số từ trong chương |

## READING_PROGRESS — Tiến độ đọc

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tiến độ đọc (tự động sinh) |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `chapter` | objectId |  | X | X | Tham chiếu Chapter |
| `progressPercent` | number |  |  |  | Phần trăm hoàn thành (0-100) |
| `scrollPosition` | number |  |  |  | Vị trí cuộc đang đọc (dùng để khôi phục) |
| `lastReadAt` | date |  |  |  | Thời điểm đọc gần nhất |

## ARTWORK_REPORT — Báo cáo tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã báo cáo (tự động sinh) |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `reportedBy` | objectId |  | X | X | Tham chiếu User |
| `reason` | string |  |  |  | spam|inappropriate|copyright|harassment|nsfw|other |
| `description` | string |  |  |  | Mô tả chi tiết lý do báo cáo |
| `status` | string |  |  |  | pending|resolved|dismissed |
| `resolvedBy` | objectId |  | X | X | Tham chiếu User |
| `resolvedAt` | date |  |  |  | Thời điểm xử lý báo cáo |
| `resolutionNote` | string |  |  |  | Ghi chú của người xử lý |

## REQUEST_TERM — Điều khoản ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã điều khoản (tự động sinh) |
| `creator` | objectId |  | X | X | Tham chiếu User |
| `title` | string |  |  |  | Tiêu đề gói điều khoản |
| `tier` | string |  |  |  | Hạng mục (cấp độ dịch vụ) |
| `targetPrice` | number |  |  |  | Giá mục tiêu cho một yêu cầu |
| `currency` | string |  |  |  | Đơn vị tiền tệ (VD: USD, VND) |
| `acceptedWorkTypes` | array |  |  |  | Danh sách loại công việc chấp nhận |
| `estimatedDays` | number |  |  |  | Số ngày ước tính hoàn thành |
| `maxOpenRequests` | number |  |  |  | Số yêu cầu mở tối đa cùng lúc |
| `acceptedAgeRatings` | array |  |  |  | Độ tuổi chấp nhận (all, r-18, r-18g) |
| `rules` | string |  |  |  | Nội quy / quy tắc khi đặt hàng |
| `forbiddenTopics` | array |  |  |  | Danh sách chủ đề không nhận |
| `preferredStyles` | array |  |  |  | Phong cách ưa thích |
| `strengths` | array |  |  |  | Thế mạnh của người sáng tạo |
| `commercialUse` | object |  |  |  | Nhúng {allowed,feeMultiplier,notes} |
| `isOpen` | boolean |  |  |  | Đang mở nhận ủy thác hay không |

## REQUEST — Yêu cầu ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã yêu cầu (tự động sinh) |
| `term` | objectId |  | X | X | Tham chiếu RequestTerm |
| `creator` | objectId |  | X | X | Người cung cấp dịch vụ |
| `requester` | objectId |  | X | X | Khách hàng |
| `title` | string |  |  |  | Tiêu đề yêu cầu |
| `description` | string |  |  |  | Mô tả chi tiết yêu cầu |
| `workType` | string |  |  |  | Loại công việc yêu cầu |
| `tags` | array |  |  |  | Danh sách thẻ liên quan |
| `specifics` | object |  |  |  | Nhúng {pose,outfit,mood,lighting,angle,other} |
| `proposedAmount` | number |  |  |  | Số tiền đề xuất |
| `currency` | string |  |  |  | Đơn vị tiền tệ |
| `visibility` | string |  |  |  | Chế độ hiển thị (public | private) |
| `isAnonymous` | boolean |  |  |  | Yêu cầu có ẩn danh hay không |
| `ageRating` | string |  |  |  | Độ tuổi của yêu cầu |
| `status` | string |  |  |  | pending|accepted|in_progress|draft_submitted|revision|completed|rejected|cancelled |
| `referenceImages` | array |  |  |  | Nhúng |
| `draftFiles` | array |  |  |  | Nhúng |
| `finalFiles` | array |  |  |  | Nhúng |
| `giftFiles` | array |  |  |  | Nhúng |
| `revisionCount` | number |  |  |  | Số lần chỉnh sửa đã thực hiện |
| `autoCompleteAt` | date |  |  |  | Thời điểm tự động đánh dấu hoàn thành |
| `dueAt` | date |  |  |  | Thời hạn hoàn thành |
| `extensionRequestedAt` | date |  |  |  | Thời điểm yêu cầu gia hạn |
| `extensionDays` | number |  |  |  | Số ngày gia hạn thêm |
| `chatClosedAt` | date |  |  |  | Thời điểm đóng chat của yêu cầu |
| `licenseTier` | string |  |  |  | Cấp giấy phép sử dụng: personal | commercial |

## REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã tin nhắn (tự động sinh) |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `sender` | objectId |  | X | X | Tham chiếu User |
| `content` | string |  |  |  | Nội dung tin nhắn |
| `attachments` | array |  |  |  | Nhúng |
| `isSystem` | boolean |  |  |  | Tin nhắn hệ thống (tự động sinh bởi state machine) |

## REQUEST_EVENT — Sự kiện ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã sự kiện (tự động sinh) |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `actor` | objectId |  | X | X | Tham chiếu User |
| `type` | string |  |  |  | Loại sự kiện (request_submitted, accepted, rejected, ...) |
| `fromStatus` | string |  |  |  | Trạng thái trước khi chuyển |
| `toStatus` | string |  |  |  | Trạng thái sau khi chuyển |
| `metadata` | object |  |  |  | Linh hoạt |

## REQUEST_REVISION — Chỉnh sửa ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã chỉnh sửa (tự động sinh) |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `requester` | objectId |  | X | X | Tham chiếu User |
| `round` | number |  |  |  | 1 | 2 — Duy nhất trong yêu cầu |
| `notes` | string |  |  |  | Nội dung yêu cầu chỉnh sửa |

---
*Được tạo bởi `scripts/generate-data-dictionary.js` vào 2026-06-11 — 19 collection.*
