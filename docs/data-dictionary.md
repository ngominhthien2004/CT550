# IlluWrl — Data Dictionary (Tiếng Việt)

> **Ngày tạo:** 2026-06-11
> **Số thực thể:** 18
> **Số quan hệ:** 35
> **Mô tả:** Tài liệu tham chiếu chi tiết tất cả trường (field) của các Mongoose model

---

## Mục lục

### Thực thể
- [USER — Người dùng](#user)
- [FOLLOW — Theo dõi](#follow)
- [USER_BLOCK — Chặn người dùng](#user_block)
- [MESSAGE — Tin nhắn](#message)
- [NOTIFICATION — Thông báo](#notification)
- [ARTWORK — Tác phẩm](#artwork)
- [TAG — Thẻ](#tag)
- [COMMENT — Bình luận](#comment)
- [LIKE — Lượt thích](#like)
- [BOOKMARK — Đánh dấu](#bookmark)
- [CHAPTER — Chương](#chapter)
- [READING_PROGRESS — Tiến độ đọc](#reading_progress)
- [ARTWORK_REPORT — Báo cáo tác phẩm](#artwork_report)
- [REQUEST_TERM — Điều khoản ủy thác](#request_term)
- [REQUEST — Yêu cầu ủy thác](#request)
- [REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác](#request_chat_message)
- [REQUEST_EVENT — Sự kiện ủy thác](#request_event)
- [REQUEST_REVISION — Chỉnh sửa ủy thác](#request_revision)

### Quan hệ
- [Các quan hệ](#các-quan-hệ)

---

## USER — Người dùng

> Tài khoản người dùng — định danh trung tâm của toàn bộ nền tảng

Thực thể **USER** là thực thể trung tâm của toàn bộ nền tảng, lưu trữ tất cả thông tin liên quan đến tài khoản người dùng như tên đăng nhập, email, mật khẩu đã mã hoá, vai trò (người dùng/quản trị viên), tiểu sử, avatar và các thiết lập cá nhân.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `email` | string | UK | unique login email |
| `username` | string | UK | unique display handle |
| `displayName` | string | — | — |
| `avatar` | string | — | — |
| `coverImage` | string | — | — |
| `bio` | string | — | — |
| `gender` | string | — | — |
| `location` | string | — | — |
| `birthday` | date | — | — |
| `occupation` | string | — | — |
| `website` | string | — | — |
| `socialLinks` | json | — | Nhúng {x,facebook,instagram} |
| `role` | string | — | người dùng | quản trị viên |
| `aiDetectionEnabled` | boolean | — | — |
| `password` | string | — | đã mã hoá |
| `googleId` | string | — | — |
| `facebookId` | string | — | — |
| `twitterId` | string | — | — |

## FOLLOW — Theo dõi

> Quan hệ theo dõi giữa người dùng với người dùng

Thực thể **FOLLOW** lưu trữ mối quan hệ theo dõi giữa các người dùng, cho biết ai đang theo dõi ai trên nền tảng.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `follower` | ObjectId | FK | Tham chiếu User — who follows |
| `following` | ObjectId | FK | Tham chiếu User — being followed |

## USER_BLOCK — Chặn người dùng

> Quan hệ chặn giữa người dùng với người dùng

Thực thể **USER_BLOCK** lưu trữ mối quan hệ chặn giữa các người dùng, cho biết ai chặn ai và lý do chặn nhằm kiểm soát tương tác.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `blocker` | ObjectId | FK | Tham chiếu User |
| `blocked` | ObjectId | FK | Tham chiếu User |

## MESSAGE — Tin nhắn

> Tin nhắn trực tiếp giữa các người dùng

Thực thể **MESSAGE** lưu trữ các tin nhắn trực tiếp giữa người dùng với người dùng, bao gồm nội dung văn bản và tệp đính kèm.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `sender` | ObjectId | FK | Tham chiếu User |
| `recipient` | ObjectId | FK | Tham chiếu User |
| `content` | string | — | — |
| `images` | array | — | — |
| `isRead` | boolean | — | — |
| `readAt` | datetime | — | — |
| `deletedFor` | array | — | Tham chiếu User[] |

## NOTIFICATION — Thông báo

> Thông báo cho người dùng về các sự kiện trên nền tảng

Thực thể **NOTIFICATION** lưu trữ các thông báo gửi đến người dùng khi có sự kiện xảy ra như thích, bình luận, theo dõi hoặc tin nhắn mới.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `user` | ObjectId | FK | Tham chiếu User — recipient |
| `actor` | ObjectId | FK | Tham chiếu User — trigger |
| `artwork` | ObjectId | FK | Tham chiếu Artwork — optional context |
| `type` | string | — | follow|like|bookmark|comment|request|system |
| `message` | string | — | — |
| `isRead` | boolean | — | — |
| `readAt` | datetime | — | — |

## ARTWORK — Tác phẩm

> Nội dung chính — tranh minh hoạ, manga, GIF, tiểu thuyết

Thực thể **ARTWORK** là thực thể nội dung chính, lưu trữ tất cả các tác phẩm bao gồm tranh minh hoạ, manga, ảnh động GIF và tiểu thuyết, với đầy đủ thông tin như tiêu đề, mô tả, tập tin, thể loại và trạng thái kiểm duyệt.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `user` | ObjectId | FK | Tham chiếu User — creator |
| `title` | string | — | — |
| `description` | string | — | — |
| `type` | string | — | illust|manga|gif|novel |
| `images` | array | — | — |
| `tags` | array | — | Tham chiếu Tag[] |
| `ageRating` | string | — | all|r-18|r-18g |
| `viewCount` | number | — | — |
| `likeCount` | number | — | — |
| `bookmarkCount` | number | — | — |
| `commentCount` | number | — | — |
| `reportCount` | number | — | — |
| `gifNotes` | json | — | — |
| `novelContent` | string | — | — |
| `novelFormat` | string | — | oneshot|series |
| `novelSeriesName` | string | — | — |
| `chapterCount` | number | — | — |
| `wordCount` | number | — | — |
| `isHidden` | boolean | — | — |
| `hiddenBy` | ObjectId | FK | Tham chiếu User — moderator |
| `hiddenAt` | datetime | — | — |
| `hiddenReason` | string | — | — |

## TAG — Thẻ

> Thẻ nội dung với bản dịch đa ngôn ngữ

Thực thể **TAG** lưu trữ các thẻ nội dung với bản dịch đa ngôn ngữ, giúp phân loại và tìm kiếm tác phẩm theo chủ đề.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `name` | string | UK | — |
| `translations` | json | — | Nhúng {en,vi,ja} |
| `usageCount` | number | — | — |
| `isLocked` | boolean | — | — |

## COMMENT — Bình luận

> Bình luận trên tác phẩm (hỗ trợ trả lời lồng nhau)

Thực thể **COMMENT** lưu trữ các bình luận của người dùng trên tác phẩm, hỗ trợ trả lời lồng nhau với cấu trúc bình luận cha-con.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |
| `user` | ObjectId | FK | Tham chiếu User — author |
| `content` | string | — | — |
| `parentComment` | ObjectId | FK | Tham chiếu Comment — self for replies |
| `stickerUrl` | string | — | — |

## LIKE — Lượt thích

> Lượt thích trên tác phẩm (duy nhất theo người dùng + tác phẩm)

Thực thể **LIKE** lưu trữ các lượt thích của người dùng trên tác phẩm, đảm bảo mỗi người dùng chỉ thích một tác phẩm một lần.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `user` | ObjectId | FK | Tham chiếu User |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |

## BOOKMARK — Đánh dấu

> Đánh dấu với phân loại theo thư mục

Thực thể **BOOKMARK** lưu trữ các đánh dấu tác phẩm của người dùng, được phân loại theo thư mục (public, private, v.v.).

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `user` | ObjectId | FK | Tham chiếu User |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |
| `folder` | string | — | — |

## CHAPTER — Chương

> Chương tiểu thuyết theo từng tác phẩm

Thực thể **CHAPTER** lưu trữ các chương của tác phẩm dạng tiểu thuyết, bao gồm nội dung văn bản, số thứ tự chương và các tập tin đính kèm hình ảnh.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |
| `title` | string | — | — |
| `content` | string | — | — |
| `chapterNumber` | number | — | duy nhất trong tác phẩm |
| `wordCount` | number | — | — |

## READING_PROGRESS — Tiến độ đọc

> Tiến độ đọc của người dùng trên các chương tác phẩm

Thực thể **READING_PROGRESS** theo dõi tiến độ đọc của người dùng trên từng chương, ghi nhận vị trí đọc hiện tại và trạng thái hoàn thành.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `user` | ObjectId | FK | Tham chiếu User |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |
| `chapter` | ObjectId | FK | Tham chiếu Chapter |
| `progressPercent` | number | — | — |
| `scrollPosition` | number | — | — |
| `lastReadAt` | datetime | — | — |

## ARTWORK_REPORT — Báo cáo tác phẩm

> Báo cáo kiểm duyệt đối với tác phẩm

Thực thể **ARTWORK_REPORT** lưu trữ các báo cáo kiểm duyệt đối với tác phẩm, bao gồm lý do báo cáo, người báo cáo và trạng thái xử lý.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `artwork` | ObjectId | FK | Tham chiếu Artwork |
| `reportedBy` | ObjectId | FK | Tham chiếu User |
| `reason` | string | — | spam|inappropriate|copyright|harassment|nsfw|other |
| `description` | string | — | — |
| `status` | string | — | pending|resolved|dismissed |
| `resolvedBy` | ObjectId | FK | Tham chiếu User |
| `resolvedAt` | datetime | — | — |
| `resolutionNote` | string | — | — |

## REQUEST_TERM — Điều khoản ủy thác

> Điều khoản ủy thác do người sáng tạo thiết lập

Thực thể **REQUEST_TERM** lưu trữ các điều khoản ủy thác do người sáng tạo thiết lập, bao gồm loại dịch vụ, giá cả và thời gian thực hiện.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `creator` | ObjectId | FK | Tham chiếu User |
| `title` | string | — | — |
| `tier` | string | — | — |
| `targetPrice` | number | — | — |
| `currency` | string | — | — |
| `acceptedWorkTypes` | array | — | — |
| `estimatedDays` | number | — | — |
| `maxOpenRequests` | number | — | — |
| `acceptedAgeRatings` | array | — | — |
| `rules` | string | — | — |
| `forbiddenTopics` | array | — | — |
| `preferredStyles` | array | — | — |
| `strengths` | array | — | — |
| `commercialUse` | json | — | Nhúng {allowed,feeMultiplier,notes} |
| `isOpen` | boolean | — | — |

## REQUEST — Yêu cầu ủy thác

> Yêu cầu ủy thác cá nhân giữa người dùng

Thực thể **REQUEST** lưu trữ các yêu cầu ủy thác cá nhân giữa người dùng, bao gồm trạng thái, mô tả công việc và thông tin thanh toán.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `term` | ObjectId | FK | Tham chiếu RequestTerm |
| `creator` | ObjectId | FK | Tham chiếu User — provider |
| `requester` | ObjectId | FK | Tham chiếu User — client |
| `title` | string | — | — |
| `description` | string | — | — |
| `workType` | string | — | — |
| `tags` | array | — | — |
| `specifics` | json | — | Nhúng {pose,outfit,mood,lighting,angle,other} |
| `proposedAmount` | number | — | — |
| `currency` | string | — | — |
| `visibility` | string | — | — |
| `isAnonymous` | boolean | — | — |
| `ageRating` | string | — | — |
| `status` | string | — | pending|accepted|in_progress|draft_submitted|revision|completed|rejected|cancelled |
| `referenceImages` | array | — | Nhúng |
| `draftFiles` | array | — | Nhúng |
| `finalFiles` | array | — | Nhúng |
| `giftFiles` | array | — | Nhúng |
| `revisionCount` | number | — | — |
| `autoCompleteAt` | datetime | — | — |
| `dueAt` | datetime | — | — |
| `extensionRequestedAt` | datetime | — | — |
| `extensionDays` | number | — | — |
| `chatClosedAt` | datetime | — | — |
| `licenseTier` | string | — | — |

## REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác

> Tin nhắn trò chuyện trong một yêu cầu ủy thác

Thực thể **REQUEST_CHAT_MESSAGE** lưu trữ các tin nhắn trao đổi trong quá trình thực hiện yêu cầu ủy thác.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `request` | ObjectId | FK | Tham chiếu Request |
| `sender` | ObjectId | FK | Tham chiếu User |
| `content` | string | — | — |
| `attachments` | array | — | Nhúng |
| `isSystem` | boolean | — | — |

## REQUEST_EVENT — Sự kiện ủy thác

> Nhật ký kiểm tra state machine cho yêu cầu ủy thác

Thực thể **REQUEST_EVENT** lưu trữ nhật ký các sự kiện trên yêu cầu ủy thác, bao gồm thay đổi trạng thái, gia hạn và báo cáo.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `request` | ObjectId | FK | Tham chiếu Request |
| `actor` | ObjectId | FK | Tham chiếu User |
| `type` | string | — | — |
| `fromStatus` | string | — | — |
| `toStatus` | string | — | — |
| `metadata` | json | — | Mixed |

## REQUEST_REVISION — Chỉnh sửa ủy thác

> Yêu cầu chỉnh sửa trên một ủy thác (tối đa 2 vòng)

Thực thể **REQUEST_REVISION** lưu trữ các yêu cầu chỉnh sửa trên một ủy thác, giới hạn tối đa 2 vòng chỉnh sửa.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | — |
| `request` | ObjectId | FK | Tham chiếu Request |
| `requester` | ObjectId | FK | Tham chiếu User |
| `round` | number | — | 1 | 2 — unique per request |
| `notes` | string | — | — |

---

## Các quan hệ

Mô hình dữ liệu mức quan niệm gồm có 18 thực thể. Trong đó, thực thể **USER** (Người dùng) là thực thể trung tâm, với khoá chính là `_id`.

- **USER — ARTWORK**: Thực thể USER liên kết với thực thể ARTWORK (Tác phẩm) để cho biết người dùng tạo ra những tác phẩm nào. Một người dùng có thể tạo nhiều tác phẩm, và mỗi tác phẩm thuộc về một người dùng. Ngoài ra, người dùng có vai trò kiểm duyệt có thể ẩn tác phẩm.
- **USER — COMMENT**: Thực thể USER liên kết với thực thể COMMENT (Bình luận) để cho biết ai là người viết bình luận. Một người dùng có thể viết nhiều bình luận.
- **USER — LIKE**: Thực thể USER liên kết với thực thể LIKE (Lượt thích) để cho biết người dùng thích những tác phẩm nào.
- **USER — BOOKMARK**: Thực thể USER liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết người dùng đánh dấu những tác phẩm nào.
- **USER — FOLLOW**: Thực thể USER liên kết với thực thể FOLLOW (Theo dõi) để cho biết người dùng theo dõi những ai và được ai theo dõi. Quan hệ này có hai chiều: follows as follower (người dùng là người theo dõi) và is followed as following (người dùng là người được theo dõi).
- **USER — NOTIFICATION**: Thực thể USER liên kết với thực thể NOTIFICATION (Thông báo) để cho biết người dùng nhận thông báo và là tác nhân kích hoạt thông báo.
- **USER — MESSAGE**: Thực thể USER liên kết với thực thể MESSAGE (Tin nhắn) để cho biết người dùng gửi và nhận tin nhắn trực tiếp.
- **USER — USER_BLOCK**: Thực thể USER liên kết với thực thể USER_BLOCK (Chặn người dùng) để cho biết người dùng chặn ai và bị ai chặn.
- **USER — ARTWORK_REPORT**: Thực thể USER liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết người dùng báo cáo hoặc xử lý báo cáo tác phẩm.
- **USER — REQUEST_TERM**: Thực thể USER liên kết với thực thể REQUEST_TERM (Điều khoản ủy thác) để cho biết người dùng tạo ra các điều khoản nhận ủy thác.
- **USER — REQUEST**: Thực thể USER liên kết với thực thể REQUEST (Yêu cầu ủy thác) theo hai vai trò: là người sáng tạo/cung cấp dịch vụ hoặc là người yêu cầu/khách hàng.
- **USER — REQUEST_CHAT_MESSAGE**: Thực thể USER liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết người dùng gửi tin nhắn trong quá trình ủy thác.
- **USER — REQUEST_EVENT**: Thực thể USER liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại các thao tác của người dùng trên yêu cầu ủy thác.
- **USER — REQUEST_REVISION**: Thực thể USER liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết người dùng yêu cầu chỉnh sửa.
- **USER — READING_PROGRESS**: Thực thể USER liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc tác phẩm của người dùng.

- **ARTWORK — TAG**: Thực thể ARTWORK (Tác phẩm) liên kết với thực thể TAG (Thẻ) qua quan hệ nhiều-nhiều tagged with để cho biết tác phẩm được gắn những thẻ nào và ngược lại.
- **ARTWORK — COMMENT**: Thực thể ARTWORK liên kết với thực thể COMMENT (Bình luận) để cho biết tác phẩm có những bình luận nào.
- **ARTWORK — LIKE**: Thực thể ARTWORK liên kết với thực thể LIKE (Lượt thích) để cho biết tác phẩm nhận được những lượt thích nào.
- **ARTWORK — BOOKMARK**: Thực thể ARTWORK liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết tác phẩm được người dùng đánh dấu như thế nào.
- **ARTWORK — NOTIFICATION**: Thực thể ARTWORK liên kết với thực thể NOTIFICATION (Thông báo) để kích hoạt các thông báo liên quan đến tác phẩm.
- **ARTWORK — ARTWORK_REPORT**: Thực thể ARTWORK liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết tác phẩm bị báo cáo vì những lý do gì.
- **ARTWORK — CHAPTER**: Thực thể ARTWORK liên kết với thực thể CHAPTER (Chương) để cho biết tác phẩm (tiểu thuyết) gồm có những chương nào.
- **ARTWORK — READING_PROGRESS**: Thực thể ARTWORK liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc của người dùng trên tác phẩm.

- **CHAPTER — READING_PROGRESS**: Thực thể CHAPTER (Chương) liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để cho biết mỗi chương có tiến độ đọc tương ứng của từng người dùng.

- **REQUEST_TERM — REQUEST**: Thực thể REQUEST_TERM (Điều khoản ủy thác) liên kết với thực thể REQUEST (Yêu cầu ủy thác) để định nghĩa các yêu cầu dựa trên điều khoản đó. Một điều khoản có thể có nhiều yêu cầu.
- **REQUEST — REQUEST_CHAT_MESSAGE**: Thực thể REQUEST liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết yêu cầu ủy thác có những tin nhắn trao đổi nào.
- **REQUEST — REQUEST_EVENT**: Thực thể REQUEST liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại nhật ký các sự kiện (thay đổi trạng thái, gia hạn, báo cáo) trên yêu cầu ủy thác.
- **REQUEST — REQUEST_REVISION**: Thực thể REQUEST liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết yêu cầu ủy thác có những lần chỉnh sửa nào (tối đa 2 vòng).

---
*Được tạo bởi `scripts/generate-data-dictionary.js` vào 2026-06-11 — 18 thực thể, 35 quan hệ.*
