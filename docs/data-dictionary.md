# IlluWrl — Data Dictionary (Tiếng Việt)

> **Ngày tạo:** 2026-06-11
> **Số thực thể:** 19
> **Số quan hệ:** 35
> **Mô tả:** Tài liệu tham chiếu chi tiết tất cả trường (field) của các Mongoose model

---

## Mục lục

### Thực thể

- [USER — Người dùng](#user)
- [FOLLOW — Theo dõi](#follow)
- [USER_BLOCK — Chặn người dùng](#user_block)
- [SETTING — Cấu hình hệ thống](#setting)
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

| Trường        | Kiểu     | Ràng buộc | Mô tả                                                                            |
| ------------- | -------- | --------- | -------------------------------------------------------------------------------- |
| `_id`         | ObjectId | PK        | Mã người dùng (tự động sinh)                                                     |
| `email`       | string   | UK        | Email đăng nhập (duy nhất)                                                       |
| `username`    | string   | UK        | Tên người dùng (duy nhất)                                                        |
| `avatar`      | string   | —         | Đường dẫn ảnh đại diện                                                           |
| `coverImage`  | string   | —         | Đường dẫn ảnh bìa                                                                |
| `bio`         | string   | —         | Tiểu sử người dùng                                                               |
| `gender`      | string   | —         | Giới tính                                                                        |
| `location`    | string   | —         | Địa điểm                                                                         |
| `birthday`    | date     | —         | Ngày sinh                                                                        |
| `socialLinks` | json     | —         | Liên kết mạng xã hội (X, Facebook, Instagram) — object nhúng trong document User |
| `role`        | string   | —         | Vai trò: user                                                                    |
| `password`    | string   | —         | Mật khẩu (đã mã hoá)                                                             |
| `googleId`    | string   | —         | ID tài khoản Google (dùng cho đăng nhập OAuth)                                   |
| `facebookId`  | string   | —         | ID tài khoản Facebook (dùng cho đăng nhập OAuth)                                 |
| `createdAt`   | datetime | —         | Thời điểm tạo tài khoản                                                          |
| `updatedAt`   | datetime | —         | Thời điểm cập nhật gần nhất                                                      |

## FOLLOW — Theo dõi

> Quan hệ theo dõi giữa người dùng với người dùng

Thực thể **FOLLOW** lưu trữ mối quan hệ theo dõi giữa các người dùng, cho biết ai đang theo dõi ai trên nền tảng.

| Trường      | Kiểu     | Ràng buộc | Mô tả                       |
| ----------- | -------- | --------- | --------------------------- |
| `_id`       | ObjectId | PK        | Mã theo dõi (tự động sinh)  |
| `follower`  | ObjectId | FK        | Người theo dõi              |
| `following` | ObjectId | FK        | Người được theo dõi         |
| `createdAt` | datetime | —         | Thời điểm tạo               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

## USER_BLOCK — Chặn người dùng

> Quan hệ chặn giữa người dùng với người dùng

Thực thể **USER_BLOCK** lưu trữ mối quan hệ chặn giữa các người dùng, cho biết ai chặn ai và lý do chặn nhằm kiểm soát tương tác.

| Trường      | Kiểu     | Ràng buộc | Mô tả                       |
| ----------- | -------- | --------- | --------------------------- |
| `_id`       | ObjectId | PK        | Mã chặn (tự động sinh)      |
| `blocker`   | ObjectId | FK        | Người thực hiện chặn        |
| `blocked`   | ObjectId | FK        | Người bị chặn               |
| `createdAt` | datetime | —         | Thời điểm tạo               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

## SETTING — Cấu hình hệ thống

> Cấu hình toàn cục — các cờ thiết lập cho toàn bộ nền tảng

Thực thể **SETTING** lưu trữ cấu hình toàn cục của hệ thống dưới dạng singleton, bao gồm các cờ bật/tắt tính năng và ngưỡng thiết lập cho toàn bộ nền tảng.

| Trường                 | Kiểu     | Ràng buộc | Mô tả                                             |
| ---------------------- | -------- | --------- | ------------------------------------------------- |
| `_id`                  | string   | PK        | Khoá singleton (global)                           |
| `aiDetectionEnabled`   | boolean  | —         | Bật/tắt tính năng phát hiện AI trên toàn hệ thống |
| `aiDetectionThreshold` | number   | —         | Ngưỡng phát hiện AI (0-100%), mặc định 70%        |
| `createdAt`            | datetime | —         | Thời điểm tạo                                     |
| `updatedAt`            | datetime | —         | Thời điểm cập nhật gần nhất                       |

## MESSAGE — Tin nhắn

> Tin nhắn trực tiếp giữa các người dùng

Thực thể **MESSAGE** lưu trữ các tin nhắn trực tiếp giữa người dùng với người dùng, bao gồm nội dung văn bản và tệp đính kèm.

| Trường       | Kiểu     | Ràng buộc | Mô tả                                    |
| ------------ | -------- | --------- | ---------------------------------------- |
| `_id`        | ObjectId | PK        | Mã tin nhắn (tự động sinh)               |
| `sender`     | ObjectId | FK        | Người gửi tin nhắn                       |
| `recipient`  | ObjectId | FK        | Người nhận tin nhắn                      |
| `content`    | string   | —         | Nội dung tin nhắn                        |
| `images`     | array    | —         | Danh sách ảnh đính kèm                   |
| `isRead`     | boolean  | —         | Đánh dấu đã đọc                          |
| `readAt`     | datetime | —         | Thời điểm người nhận đọc tin nhắn        |
| `deletedFor` | array    | —         | Danh sách người dùng đã xóa tin nhắn này |
| `createdAt`  | datetime | —         | Thời điểm gửi tin nhắn                   |
| `updatedAt`  | datetime | —         | Thời điểm cập nhật gần nhất              |

## NOTIFICATION — Thông báo

> Thông báo cho người dùng về các sự kiện trên nền tảng

Thực thể **NOTIFICATION** lưu trữ các thông báo gửi đến người dùng khi có sự kiện xảy ra như thích, bình luận, theo dõi hoặc tin nhắn mới.

| Trường      | Kiểu     | Ràng buộc | Mô tả                         |
| ----------- | -------- | --------- | ----------------------------- |
| `_id`       | ObjectId | PK        | Mã thông báo (tự động sinh)   |
| `user`      | ObjectId | FK        | Người nhận thông báo          |
| `actor`     | ObjectId | FK        | Người kích hoạt thông báo     |
| `artwork`   | ObjectId | FK        | Tác phẩm liên quan (tuỳ chọn) |
| `type`      | string   | —         | Loại thông báo: follow        |
| `message`   | string   | —         | Nội dung thông báo            |
| `isRead`    | boolean  | —         | Đánh dấu đã đọc               |
| `createdAt` | datetime | —         | Thời điểm gửi thông báo       |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất   |

## ARTWORK — Tác phẩm

> Nội dung chính — tranh minh hoạ, manga, GIF, tiểu thuyết

Thực thể **ARTWORK** là thực thể nội dung chính, lưu trữ tất cả các tác phẩm bao gồm tranh minh hoạ, manga, ảnh động GIF và tiểu thuyết, với đầy đủ thông tin như tiêu đề, mô tả, tập tin, thể loại và trạng thái kiểm duyệt.

| Trường            | Kiểu     | Ràng buộc | Mô tả                                         |
| ----------------- | -------- | --------- | --------------------------------------------- |
| `_id`             | ObjectId | PK        | Mã tác phẩm (tự động sinh)                    |
| `user`            | ObjectId | FK        | Người đăng tác phẩm                           |
| `title`           | string   | —         | Tiêu đề tác phẩm                              |
| `description`     | string   | —         | Mô tả tác phẩm                                |
| `type`            | string   | —         | Loại tác phẩm: illust                         |
| `images`          | array    | —         | Danh sách đường dẫn ảnh/tệp của tác phẩm      |
| `tags`            | array    | —         | Danh sách thẻ gắn vào tác phẩm                |
| `ageRating`       | string   | —         | all                                           |
| `viewCount`       | number   | —         | Số lượt xem (duy trì tự động bằng $inc)       |
| `likeCount`       | number   | —         | Số lượt thích (duy trì tự động bằng $inc)     |
| `bookmarkCount`   | number   | —         | Số lượt đánh dấu (duy trì tự động bằng $inc)  |
| `commentCount`    | number   | —         | Số bình luận (duy trì tự động bằng $inc)      |
| `reportCount`     | number   | —         | Số lần bị báo cáo (duy trì tự động bằng $inc) |
| `novelContent`    | string   | —         | Nội dung tiểu thuyết (dạng văn bản)           |
| `novelFormat`     | string   | —         | Định dạng tiểu thuyết: oneshot (một chương)   |
| `novelSeriesName` | string   | —         | Tên series tiểu thuyết                        |
| `chapterCount`    | number   | —         | Số chương (nếu là series)                     |
| `wordCount`       | number   | —         | Số từ                                         |
| `isHidden`        | boolean  | —         | Tác phẩm có bị ẩn (bởi kiểm duyệt) hay không  |
| `hiddenBy`        | ObjectId | FK        | Người kiểm duyệt ẩn tác phẩm                  |
| `hiddenAt`        | datetime | —         | Thời điểm bị ẩn                               |
| `hiddenReason`    | string   | —         | Lý do bị ẩn                                   |
| `createdAt`       | datetime | —         | Thời điểm đăng tác phẩm                       |
| `updatedAt`       | datetime | —         | Thời điểm cập nhật gần nhất                   |

## TAG — Thẻ

> Thẻ nội dung với bản dịch đa ngôn ngữ

Thực thể **TAG** lưu trữ các thẻ nội dung với bản dịch đa ngôn ngữ, giúp phân loại và tìm kiếm tác phẩm theo chủ đề.

| Trường         | Kiểu     | Ràng buộc | Mô tả                           |
| -------------- | -------- | --------- | ------------------------------- |
| `_id`          | ObjectId | PK        | Mã thẻ (tự động sinh)           |
| `name`         | string   | UK        | Tên thẻ (duy nhất)              |
| `translations` | json     | —         | Bản dịch đa ngôn ngữ {en,vi,ja} |
| `usageCount`   | number   | —         | Số lần thẻ được sử dụng         |
| `createdAt`    | datetime | —         | Thời điểm tạo                   |
| `updatedAt`    | datetime | —         | Thời điểm cập nhật gần nhất     |

## COMMENT — Bình luận

> Bình luận trên tác phẩm (hỗ trợ trả lời lồng nhau)

Thực thể **COMMENT** lưu trữ các bình luận của người dùng trên tác phẩm, hỗ trợ trả lời lồng nhau với cấu trúc bình luận cha-con.

| Trường          | Kiểu     | Ràng buộc | Mô tả                                         |
| --------------- | -------- | --------- | --------------------------------------------- |
| `_id`           | ObjectId | PK        | Mã bình luận (tự động sinh)                   |
| `artwork`       | ObjectId | FK        | Tác phẩm được bình luận                       |
| `user`          | ObjectId | FK        | Tác giả bình luận                             |
| `content`       | string   | —         | Nội dung bình luận                            |
| `parentComment` | ObjectId | FK        | Bình luận cha (tự tham chiếu cho trả lời)     |
| `emoji`         | string   | —         | Biểu tượng cảm xúc (emoji) đính kèm bình luận |
| `createdAt`     | datetime | —         | Thời điểm tạo                                 |
| `updatedAt`     | datetime | —         | Thời điểm cập nhật gần nhất                   |

## LIKE — Lượt thích

> Lượt thích trên tác phẩm (duy nhất theo người dùng + tác phẩm)

Thực thể **LIKE** lưu trữ các lượt thích của người dùng trên tác phẩm, đảm bảo mỗi người dùng chỉ thích một tác phẩm một lần.

| Trường      | Kiểu     | Ràng buộc | Mô tả                        |
| ----------- | -------- | --------- | ---------------------------- |
| `_id`       | ObjectId | PK        | Mã lượt thích (tự động sinh) |
| `user`      | ObjectId | FK        | Người thích                  |
| `artwork`   | ObjectId | FK        | Tác phẩm được thích          |
| `createdAt` | datetime | —         | Thời điểm tạo                |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất  |

## BOOKMARK — Đánh dấu

> Đánh dấu với phân loại theo thư mục

Thực thể **BOOKMARK** lưu trữ các đánh dấu tác phẩm của người dùng, được phân loại theo thư mục (public, private, v.v.).

| Trường      | Kiểu     | Ràng buộc | Mô tả                       |
| ----------- | -------- | --------- | --------------------------- |
| `_id`       | ObjectId | PK        | Mã đánh dấu (tự động sinh)  |
| `user`      | ObjectId | FK        | Người đánh dấu              |
| `artwork`   | ObjectId | FK        | Tác phẩm được đánh dấu      |
| `folder`    | string   | —         | Tên thư mục lưu đánh dấu    |
| `createdAt` | datetime | —         | Thời điểm tạo               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

## CHAPTER — Chương

> Chương tiểu thuyết theo từng tác phẩm

Thực thể **CHAPTER** lưu trữ các chương của tác phẩm dạng tiểu thuyết, bao gồm nội dung văn bản, số thứ tự chương và các tập tin đính kèm hình ảnh.

| Trường          | Kiểu     | Ràng buộc | Mô tả                       |
| --------------- | -------- | --------- | --------------------------- |
| `_id`           | ObjectId | PK        | Mã chương (tự động sinh)    |
| `artwork`       | ObjectId | FK        | Tác phẩm chứa chương        |
| `title`         | string   | —         | Tiêu đề chương              |
| `content`       | string   | —         | Nội dung chương             |
| `chapterNumber` | number   | —         | duy nhất trong tác phẩm     |
| `wordCount`     | number   | —         | Số từ trong chương          |
| `createdAt`     | datetime | —         | Thời điểm tạo               |
| `updatedAt`     | datetime | —         | Thời điểm cập nhật gần nhất |

## READING_PROGRESS — Tiến độ đọc

> Tiến độ đọc của người dùng trên các chương tác phẩm

Thực thể **READING_PROGRESS** theo dõi tiến độ đọc của người dùng trên từng chương, ghi nhận vị trí đọc hiện tại và trạng thái hoàn thành.

| Trường            | Kiểu     | Ràng buộc | Mô tả                                    |
| ----------------- | -------- | --------- | ---------------------------------------- |
| `_id`             | ObjectId | PK        | Mã tiến độ đọc (tự động sinh)            |
| `user`            | ObjectId | FK        | Người đọc                                |
| `artwork`         | ObjectId | FK        | Tác phẩm đang đọc                        |
| `chapter`         | ObjectId | FK        | Chương đang đọc                          |
| `progressPercent` | number   | —         | Phần trăm hoàn thành (0-100)             |
| `scrollPosition`  | number   | —         | Vị trí cuộc đang đọc (dùng để khôi phục) |
| `lastReadAt`      | datetime | —         | Thời điểm đọc gần nhất                   |
| `createdAt`       | datetime | —         | Thời điểm tạo                            |
| `updatedAt`       | datetime | —         | Thời điểm cập nhật gần nhất              |

## ARTWORK_REPORT — Báo cáo tác phẩm

> Báo cáo kiểm duyệt đối với tác phẩm

Thực thể **ARTWORK_REPORT** lưu trữ các báo cáo kiểm duyệt đối với tác phẩm, bao gồm lý do báo cáo, người báo cáo và trạng thái xử lý.

| Trường           | Kiểu     | Ràng buộc | Mô tả                        |
| ---------------- | -------- | --------- | ---------------------------- |
| `_id`            | ObjectId | PK        | Mã báo cáo (tự động sinh)    |
| `artwork`        | ObjectId | FK        | Tác phẩm bị báo cáo          |
| `reportedBy`     | ObjectId | FK        | Người báo cáo                |
| `reason`         | string   | —         | spam                         |
| `description`    | string   | —         | Mô tả chi tiết lý do báo cáo |
| `status`         | string   | —         | Trạng thái xử lý: pending    |
| `resolvedBy`     | ObjectId | FK        | Người xử lý                  |
| `resolvedAt`     | datetime | —         | Thời điểm xử lý báo cáo      |
| `resolutionNote` | string   | —         | Ghi chú của người xử lý      |
| `createdAt`      | datetime | —         | Thời điểm tạo                |
| `updatedAt`      | datetime | —         | Thời điểm cập nhật gần nhất  |

## REQUEST_TERM — Điều khoản ủy thác

> Điều khoản ủy thác do người sáng tạo thiết lập

Thực thể **REQUEST_TERM** lưu trữ các điều khoản ủy thác do người sáng tạo thiết lập, bao gồm loại dịch vụ, giá cả và thời gian thực hiện.

| Trường               | Kiểu     | Ràng buộc | Mô tả                                                                                        |
| -------------------- | -------- | --------- | -------------------------------------------------------------------------------------------- |
| `_id`                | ObjectId | PK        | Mã điều khoản (tự động sinh)                                                                 |
| `creator`            | ObjectId | FK        | Người sáng tạo (cung cấp dịch vụ)                                                            |
| `title`              | string   | —         | Tiêu đề gói điều khoản                                                                       |
| `tier`               | string   | —         | Hạng mục (cấp độ dịch vụ)                                                                    |
| `targetPrice`        | number   | —         | Giá mục tiêu cho một yêu cầu                                                                 |
| `currency`           | string   | —         | Đơn vị tiền tệ (VD: USD, VND)                                                                |
| `acceptedWorkTypes`  | array    | —         | Danh sách loại công việc chấp nhận                                                           |
| `estimatedDays`      | number   | —         | Số ngày ước tính hoàn thành                                                                  |
| `maxOpenRequests`    | number   | —         | Số yêu cầu mở tối đa cùng lúc                                                                |
| `acceptedAgeRatings` | array    | —         | Độ tuổi chấp nhận (all, r-18)                                                                |
| `rules`              | string   | —         | Nội quy / quy tắc khi đặt hàng                                                               |
| `forbiddenTopics`    | array    | —         | Danh sách chủ đề không nhận                                                                  |
| `preferredStyles`    | array    | —         | Phong cách ưa thích                                                                          |
| `strengths`          | string   | —         | Thế mạnh của người sáng tạo                                                                  |
| `commercialUse`      | json     | —         | Cấu hình sử dụng thương mại {allowed, feeMultiplier, notes} — object nhúng trong RequestTerm |
| `isOpen`             | boolean  | —         | Đang mở nhận ủy thác hay không                                                               |
| `createdAt`          | datetime | —         | Thời điểm tạo                                                                                |
| `updatedAt`          | datetime | —         | Thời điểm cập nhật gần nhất                                                                  |

## REQUEST — Yêu cầu ủy thác

> Yêu cầu ủy thác cá nhân giữa người dùng

Thực thể **REQUEST** lưu trữ các yêu cầu ủy thác cá nhân giữa người dùng, bao gồm trạng thái, mô tả công việc và thông tin thanh toán.

| Trường                 | Kiểu     | Ràng buộc | Mô tả                                                                                      |
| ---------------------- | -------- | --------- | ------------------------------------------------------------------------------------------ |
| `_id`                  | ObjectId | PK        | Mã yêu cầu (tự động sinh)                                                                  |
| `term`                 | ObjectId | FK        | Điều khoản áp dụng cho yêu cầu                                                             |
| `creator`              | ObjectId | FK        | Người sáng tạo nhận yêu cầu                                                                |
| `requester`            | ObjectId | FK        | Người đặt yêu cầu (khách hàng)                                                             |
| `title`                | string   | —         | Tiêu đề yêu cầu                                                                            |
| `description`          | string   | —         | Mô tả chi tiết yêu cầu                                                                     |
| `workType`             | string   | —         | Loại công việc yêu cầu                                                                     |
| `tags`                 | array    | —         | Danh sách thẻ liên quan                                                                    |
| `specifics`            | json     | —         | Chi tiết yêu cầu {pose, outfit, mood, lighting, angle, other} — object nhúng trong Request |
| `proposedAmount`       | number   | —         | Số tiền đề xuất                                                                            |
| `currency`             | string   | —         | Đơn vị tiền tệ                                                                             |
| `visibility`           | string   | —         | Chế độ hiển thị (public                                                                    |
| `isAnonymous`          | boolean  | —         | Yêu cầu có ẩn danh hay không                                                               |
| `ageRating`            | string   | —         | Độ tuổi của yêu cầu                                                                        |
| `status`               | string   | —         | pending                                                                                    |
| `referenceImages`      | array    | —         | Danh sách ảnh tham khảo (mảng object nhúng, không phải ref)                                |
| `draftFiles`           | array    | —         | Danh sách tệp nháp (mảng object nhúng)                                                     |
| `finalFiles`           | array    | —         | Danh sách tệp hoàn thiện (mảng object nhúng)                                               |
| `giftFiles`            | array    | —         | Danh sách tệp quà tặng (mảng object nhúng)                                                 |
| `revisionCount`        | number   | —         | Số lần chỉnh sửa đã thực hiện                                                              |
| `autoCompleteAt`       | datetime | —         | Thời điểm tự động đánh dấu hoàn thành                                                      |
| `dueAt`                | datetime | —         | Thời hạn hoàn thành                                                                        |
| `extensionRequestedAt` | datetime | —         | Thời điểm yêu cầu gia hạn                                                                  |
| `extensionDays`        | number   | —         | Số ngày gia hạn thêm                                                                       |
| `chatClosedAt`         | datetime | —         | Thời điểm đóng chat của yêu cầu                                                            |
| `licenseTier`          | string   | —         | Cấp giấy phép sử dụng: personal                                                            |
| `createdAt`            | datetime | —         | Thời điểm tạo                                                                              |
| `updatedAt`            | datetime | —         | Thời điểm cập nhật gần nhất                                                                |

## REQUEST_CHAT_MESSAGE — Tin nhắn ủy thác

> Tin nhắn trò chuyện trong một yêu cầu ủy thác

Thực thể **REQUEST_CHAT_MESSAGE** lưu trữ các tin nhắn trao đổi trong quá trình thực hiện yêu cầu ủy thác.

| Trường        | Kiểu     | Ràng buộc | Mô tả                                              |
| ------------- | -------- | --------- | -------------------------------------------------- |
| `_id`         | ObjectId | PK        | Mã tin nhắn (tự động sinh)                         |
| `request`     | ObjectId | FK        | Yêu cầu chứa tin nhắn                              |
| `sender`      | ObjectId | FK        | Người gửi tin nhắn                                 |
| `content`     | string   | —         | Nội dung tin nhắn                                  |
| `attachments` | array    | —         | Tệp đính kèm (hình ảnh, tệp)                       |
| `isSystem`    | boolean  | —         | Tin nhắn hệ thống (tự động sinh bởi state machine) |
| `createdAt`   | datetime | —         | Thời điểm tạo                                      |
| `updatedAt`   | datetime | —         | Thời điểm cập nhật gần nhất                        |

## REQUEST_EVENT — Sự kiện ủy thác

> Nhật ký kiểm tra state machine cho yêu cầu ủy thác

Thực thể **REQUEST_EVENT** lưu trữ nhật ký các sự kiện trên yêu cầu ủy thác, bao gồm thay đổi trạng thái, gia hạn và báo cáo.

| Trường       | Kiểu     | Ràng buộc | Mô tả                                                                                                                                            |
| ------------ | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_id`        | ObjectId | PK        | Mã sự kiện (tự động sinh)                                                                                                                        |
| `request`    | ObjectId | FK        | Yêu cầu chứa sự kiện                                                                                                                             |
| `actor`      | ObjectId | FK        | Người thực hiện hành động                                                                                                                        |
| `type`       | string   | —         | Loại sự kiện (request_submitted, accepted, rejected, ...)                                                                                        |
| `fromStatus` | string   | —         | Trạng thái trước khi chuyển                                                                                                                      |
| `toStatus`   | string   | —         | Trạng thái sau khi chuyển                                                                                                                        |
| `metadata`   | json     | —         | Dữ liệu ngữ cảnh động, chứa thông tin chi tiết theo từng loại sự kiện (VD: lý do từ chối, thông tin revision, số ngày gia hạn, chi tiết báo cáo) |
| `createdAt`  | datetime | —         | Thời điểm tạo                                                                                                                                    |
| `updatedAt`  | datetime | —         | Thời điểm cập nhật gần nhất                                                                                                                      |

## REQUEST_REVISION — Chỉnh sửa ủy thác

> Yêu cầu chỉnh sửa trên một ủy thác (tối đa 2 vòng)

Thực thể **REQUEST_REVISION** lưu trữ các yêu cầu chỉnh sửa trên một ủy thác, giới hạn tối đa 2 vòng chỉnh sửa.

| Trường      | Kiểu     | Ràng buộc | Mô tả                       |
| ----------- | -------- | --------- | --------------------------- |
| `_id`       | ObjectId | PK        | Mã chỉnh sửa (tự động sinh) |
| `request`   | ObjectId | FK        | Yêu cầu cần chỉnh sửa       |
| `requester` | ObjectId | FK        | Người yêu cầu chỉnh sửa     |
| `round`     | number   | —         | 1                           |
| `notes`     | string   | —         | Nội dung yêu cầu chỉnh sửa  |
| `createdAt` | datetime | —         | Thời điểm tạo               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

---

## Các quan hệ

Mô hình dữ liệu mức quan niệm gồm có 19 thực thể. Trong đó, thực thể **USER** (Người dùng) là thực thể trung tâm, với khoá chính là `_id`.

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

_Được tạo bởi `scripts/generate-data-dictionary.js` vào 2026-06-11 — 19 thực thể, 35 quan hệ._
