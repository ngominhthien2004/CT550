# IlluWrl — MongoDB Schema (Tiếng Việt)

> **Ngày tạo:** 2026-06-11
> **Số collection:** 18
> **Mô tả:** Chi tiết các collection trong MongoDB, bao gồm kiểu dữ liệu, khoá chính, khoá ngoại, ràng buộc Not Null và diễn giải.

---

## USER — Người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `email` | string |  |  |  | Email đăng nhập duy nhất |
| `username` | string |  |  |  | Tên hiển thị duy nhất |
| `displayName` | string |  |  |  | — |
| `avatar` | string |  |  |  | — |
| `coverImage` | string |  |  |  | — |
| `bio` | string |  |  |  | — |
| `gender` | string |  |  |  | — |
| `location` | string |  |  |  | — |
| `birthday` | date |  |  |  | — |
| `occupation` | string |  |  |  | — |
| `website` | string |  |  |  | — |
| `socialLinks` | object |  |  |  | Nhúng {x,facebook,instagram} |
| `role` | string |  |  |  | người dùng | quản trị viên |
| `aiDetectionEnabled` | boolean |  |  |  | — |
| `password` | string |  |  |  | đã mã hoá |
| `googleId` | string |  |  |  | — |
| `facebookId` | string |  |  |  | — |
| `twitterId` | string |  |  |  | — |

## FOLLOW — Theo dõi

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `follower` | objectId |  | X | X | Người theo dõi |
| `following` | objectId |  | X | X | Người được theo dõi |

## USER_BLOCK — Chặn người dùng

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `blocker` | objectId |  | X | X | Tham chiếu User |
| `blocked` | objectId |  | X | X | Tham chiếu User |

## MESSAGE — Tin nhắn

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `sender` | objectId |  | X | X | Tham chiếu User |
| `recipient` | objectId |  | X | X | Tham chiếu User |
| `content` | string |  |  |  | — |
| `images` | array |  |  |  | — |
| `isRead` | boolean |  |  |  | — |
| `readAt` | date |  |  |  | — |
| `deletedFor` | array |  |  |  | Tham chiếu User[] |

## NOTIFICATION — Thông báo

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `user` | objectId |  | X | X | Người nhận thông báo |
| `actor` | objectId |  | X | X | Người kích hoạt thông báo |
| `artwork` | objectId |  | X | X | Tác phẩm liên quan (tuỳ chọn) |
| `type` | string |  |  |  | follow|like|bookmark|comment|request|system |
| `message` | string |  |  |  | — |
| `isRead` | boolean |  |  |  | — |
| `readAt` | date |  |  |  | — |

## ARTWORK — Tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `user` | objectId |  | X | X | Người sáng tạo |
| `title` | string |  |  |  | — |
| `description` | string |  |  |  | — |
| `type` | string |  |  |  | illust|manga|gif|novel |
| `images` | array |  |  |  | — |
| `tags` | array |  |  |  | Tham chiếu Tag[] |
| `ageRating` | string |  |  |  | Tất cả | R-18 | R-18G |
| `viewCount` | number |  |  |  | — |
| `likeCount` | number |  |  |  | — |
| `bookmarkCount` | number |  |  |  | — |
| `commentCount` | number |  |  |  | — |
| `reportCount` | number |  |  |  | — |
| `gifNotes` | object |  |  |  | — |
| `novelContent` | string |  |  |  | — |
| `novelFormat` | string |  |  |  | oneshot|series |
| `novelSeriesName` | string |  |  |  | — |
| `chapterCount` | number |  |  |  | — |
| `wordCount` | number |  |  |  | — |
| `isHidden` | boolean |  |  |  | — |
| `hiddenBy` | objectId |  | X | X | Người kiểm duyệt |
| `hiddenAt` | date |  |  |  | — |
| `hiddenReason` | string |  |  |  | — |

## TAG — Thẻ

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `name` | string |  |  |  | — |
| `translations` | object |  |  |  | Nhúng {en,vi,ja} |
| `usageCount` | number |  |  |  | — |
| `isLocked` | boolean |  |  |  | — |

## COMMENT — Bình luận

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `user` | objectId |  | X | X | Tác giả bình luận |
| `content` | string |  |  |  | — |
| `parentComment` | objectId |  | X | X | Tham chiếu Comment — self for replies |
| `stickerUrl` | string |  |  |  | — |

## LIKE — Lượt thích

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |

## BOOKMARK — Đánh dấu

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `folder` | string |  |  |  | — |

## CHAPTER — Chương

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `title` | string |  |  |  | — |
| `content` | string |  |  |  | — |
| `chapterNumber` | number |  |  |  | duy nhất trong tác phẩm |
| `wordCount` | number |  |  |  | — |

## READING_PROGRESS — Tiến độ đọc

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `user` | objectId |  | X | X | Tham chiếu User |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `chapter` | objectId |  | X | X | Tham chiếu Chapter |
| `progressPercent` | number |  |  |  | — |
| `scrollPosition` | number |  |  |  | — |
| `lastReadAt` | date |  |  |  | — |

## ARTWORK_REPORT — Báo cáo tác phẩm

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `artwork` | objectId |  | X | X | Tham chiếu Artwork |
| `reportedBy` | objectId |  | X | X | Tham chiếu User |
| `reason` | string |  |  |  | spam|inappropriate|copyright|harassment|nsfw|other |
| `description` | string |  |  |  | — |
| `status` | string |  |  |  | pending|resolved|dismissed |
| `resolvedBy` | objectId |  | X | X | Tham chiếu User |
| `resolvedAt` | date |  |  |  | — |
| `resolutionNote` | string |  |  |  | — |

## REQUEST_TERM — Điều khoản ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `creator` | objectId |  | X | X | Tham chiếu User |
| `title` | string |  |  |  | — |
| `tier` | string |  |  |  | — |
| `targetPrice` | number |  |  |  | — |
| `currency` | string |  |  |  | — |
| `acceptedWorkTypes` | array |  |  |  | — |
| `estimatedDays` | number |  |  |  | — |
| `maxOpenRequests` | number |  |  |  | — |
| `acceptedAgeRatings` | array |  |  |  | — |
| `rules` | string |  |  |  | — |
| `forbiddenTopics` | array |  |  |  | — |
| `preferredStyles` | array |  |  |  | — |
| `strengths` | array |  |  |  | — |
| `commercialUse` | object |  |  |  | Nhúng {allowed,feeMultiplier,notes} |
| `isOpen` | boolean |  |  |  | — |

## REQUEST — Yêu cầu ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `term` | objectId |  | X | X | Tham chiếu RequestTerm |
| `creator` | objectId |  | X | X | Người cung cấp dịch vụ |
| `requester` | objectId |  | X | X | Khách hàng |
| `title` | string |  |  |  | — |
| `description` | string |  |  |  | — |
| `workType` | string |  |  |  | — |
| `tags` | array |  |  |  | — |
| `specifics` | object |  |  |  | Nhúng {pose,outfit,mood,lighting,angle,other} |
| `proposedAmount` | number |  |  |  | — |
| `currency` | string |  |  |  | — |
| `visibility` | string |  |  |  | — |
| `isAnonymous` | boolean |  |  |  | — |
| `ageRating` | string |  |  |  | — |
| `status` | string |  |  |  | pending|accepted|in_progress|draft_submitted|revision|completed|rejected|cancelled |
| `referenceImages` | array |  |  |  | Nhúng |
| `draftFiles` | array |  |  |  | Nhúng |
| `finalFiles` | array |  |  |  | Nhúng |
| `giftFiles` | array |  |  |  | Nhúng |
| `revisionCount` | number |  |  |  | — |
| `autoCompleteAt` | date |  |  |  | — |
| `dueAt` | date |  |  |  | — |
| `extensionRequestedAt` | date |  |  |  | — |
| `extensionDays` | number |  |  |  | — |
| `chatClosedAt` | date |  |  |  | — |
| `licenseTier` | string |  |  |  | — |

## REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `sender` | objectId |  | X | X | Tham chiếu User |
| `content` | string |  |  |  | — |
| `attachments` | array |  |  |  | Nhúng |
| `isSystem` | boolean |  |  |  | — |

## REQUEST_EVENT — Sự kiện ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `actor` | objectId |  | X | X | Tham chiếu User |
| `type` | string |  |  |  | — |
| `fromStatus` | string |  |  |  | — |
| `toStatus` | string |  |  |  | — |
| `metadata` | object |  |  |  | Linh hoạt |

## REQUEST_REVISION — Chỉnh sửa ủy thác

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | — |
| `request` | objectId |  | X | X | Tham chiếu Request |
| `requester` | objectId |  | X | X | Tham chiếu User |
| `round` | number |  |  |  | 1 | 2 — Duy nhất trong yêu cầu |
| `notes` | string |  |  |  | — |

---
*Được tạo bởi `scripts/generate-data-dictionary.js` vào 2026-06-11 — 18 collection.*
