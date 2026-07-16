# IlluWrl — Data Dictionary (Tiếng Việt)

> **Cập nhật:** 2026-07-15
> **Số thực thể:** 27
> **Số quan hệ:** 47+
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
- [READING_PROGRESS — Tiến độ đọc](#reading_progress)
- [SERIES — Series tác phẩm](#series)
- [BROWSE_HISTORY — Lịch sử duyệt](#browse_history)
- [BANNER — Banner](#banner)
- [VIEW_EVENT — Sự kiện xem](#view_event)
- [CHAT_SESSION — Phiên AI Chat](#chat_session)
- [CHAT_MESSAGE — Tin nhắn AI Chat](#chat_message)
- [ARTWORK_REPORT — Báo cáo tác phẩm](#artwork_report)
- [USER_REPORT — Báo cáo người dùng](#user_report)
- [COMMENT_REPORT — Báo cáo bình luận](#comment_report)
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
| `birthYear`   | number   | —         | Năm sinh          |
| `birthdayMonth` | number | —         | Tháng sinh        |
| `birthdayDay` | number   | —         | Ngày sinh         |
| `socialLinks` | json     | —         | Liên kết mạng xã hội (X, Facebook, Instagram) — object nhúng trong document User |
| `isSuspended` | boolean  | —         | Tài khoản bị khóa (suspended) — true thì không thể đăng nhập |
| `role`        | string   | —         | Vai trò: user | admin                                                            |
| `password`    | string   | —         | Mật khẩu (đã mã hoá)                                                             |
| `googleId`    | string   | —         | ID tài khoản Google (dùng cho đăng nhập OAuth)                                   |
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
| `autoTaggingEnabled`   | boolean  | —         | Bật/tắt tính năng tự động gắn thẻ AI |
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
| `metadata`  | mixed    | —         | Dữ liệu ngữ cảnh động (tuỳ chọn), chứa thông tin bổ sung theo từng loại thông báo |
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
| `type`            | string   | —         | Loại tác phẩm: illust | manga | gif | novel   |
| `images`          | array    | —         | Danh sách đường dẫn ảnh/tệp của tác phẩm      |
| `tags`            | array    | —         | Danh sách thẻ gắn vào tác phẩm                |
| `ageRating`       | string   | —         | all | r-18                                     |
| `viewCount`       | number   | —         | Số lượt xem (duy trì tự động bằng $inc)       |
| `likeCount`       | number   | —         | Số lượt thích (duy trì tự động bằng $inc)     |
| `bookmarkCount`   | number   | —         | Số lượt đánh dấu (duy trì tự động bằng $inc)  |
| `commentCount`    | number   | —         | Số bình luận (duy trì tự động bằng $inc)      |
| `reportCount`     | number   | —         | Số lần bị báo cáo (duy trì tự động bằng $inc) |
| `novelContent`    | string   | —         | Nội dung tiểu thuyết (dạng văn bản)           |
| `wordCount`       | number   | —         | Số từ (tự động tính từ novelContent)          |
| `series`          | ObjectId | FK        | Series chứa tác phẩm (tuỳ chọn, ref Series)   |
| `commentsEnabled` | boolean  | —         | Cho phép bình luận trên tác phẩm              |
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

## READING_PROGRESS — Tiến độ đọc

> Tiến độ đọc của người dùng trên các chương tác phẩm

Thực thể **READING_PROGRESS** theo dõi tiến độ đọc của người dùng trên từng chương, ghi nhận vị trí đọc hiện tại và trạng thái hoàn thành.

| Trường            | Kiểu     | Ràng buộc | Mô tả                                    |
| ----------------- | -------- | --------- | ---------------------------------------- |
| `_id`             | ObjectId | PK        | Mã tiến độ đọc (tự động sinh)            |
| `user`            | ObjectId | FK        | Người đọc                                |
| `artwork`         | ObjectId | FK        | Tác phẩm đang đọc                        |
| `progressPercent` | number   | —         | Phần trăm hoàn thành (0-100)             |
| `scrollPosition`  | number   | —         | Vị trí cuộc đang đọc (dùng để khôi phục) |
| `lastReadAt`      | datetime | —         | Thời điểm đọc gần nhất                   |
| `createdAt`       | datetime | —         | Thời điểm đọc                            |
| `updatedAt`       | datetime | —         | Thời điểm cập nhật gần nhất              |

## SERIES — Series tác phẩm

> Nhóm tác phẩm liên kết — manga, tiểu thuyết, minh hoạ

Thực thể **SERIES** quản lý các nhóm tác phẩm liên kết (series), cho phép người dùng gom nhiều tác phẩm thành một bộ hoàn chỉnh. Hỗ trợ 3 loại: manga (nhiều ảnh), novel (tiểu thuyết nhiều chương), illust (bộ sưu tập minh hoạ).

| Trường         | Kiểu     | Ràng buộc | Mô tả                                                              |
| -------------- | -------- | --------- | ------------------------------------------------------------------ |
| `_id`          | ObjectId | PK        | Mã series (tự động sinh)                                           |
| `user`         | ObjectId | FK        | Chủ sở hữu series                                                  |
| `title`        | string   | —         | Tiêu đề series                                                     |
| `description`  | string   | —         | Mô tả series                                                       |
| `type`         | string   | —         | Loại series: manga | novel | illust                                |
| `coverImage`   | string   | —         | Ảnh bìa series                                                     |
| `artworks`     | array    | FK        | Danh sách tác phẩm trong series, theo thứ tự                        |
| `artworkCount` | number   | —         | Số lượng tác phẩm trong series                                      |
| `totalViews`   | number   | —         | Tổng lượt xem của series                                           |
| `totalLikes`   | number   | —         | Tổng lượt thích của series                                         |
| `isCompleted`  | boolean  | —         | Series đã hoàn thành hay chưa                                      |
| `tags`         | array    | FK        | Danh sách thẻ gắn vào series                                       |
| `createdAt`    | datetime | —         | Thời điểm tạo                                                       |
| `updatedAt`    | datetime | —         | Thời điểm cập nhật gần nhất                                         |

## BROWSE_HISTORY — Lịch sử duyệt

> Lịch sử xem tác phẩm của người dùng (dùng cho AI Recommendation)

Thực thể **BROWSE_HISTORY** ghi lại lịch sử xem tác phẩm của người dùng, phục vụ cho hệ thống gợi ý AI (AI Recommendation) dựa trên sở thích duyệt.

| Trường      | Kiểu     | Ràng buộc | Mô tả                       |
| ----------- | -------- | --------- | --------------------------- |
| `_id`       | ObjectId | PK        | Mã lịch sử (tự động sinh)   |
| `user`      | ObjectId | FK        | Người dùng duyệt            |
| `artwork`   | ObjectId | FK        | Tác phẩm đã xem             |
| `createdAt` | datetime | —         | Thời điểm xem               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

## BANNER — Banner

> Banner quảng cáo trên trang chủ và các trang danh mục

Thực thể **BANNER** lưu trữ các banner hiển thị trên trang chủ và các trang danh mục (illust, manga, gif, novel).

| Trường      | Kiểu     | Ràng buộc | Mô tả                           |
| ----------- | -------- | --------- | ------------------------------- |
| `_id`       | ObjectId | PK        | Mã banner (tự động sinh)        |
| `image`     | string   | —         | Đường dẫn ảnh banner            |
| `link`      | string   | —         | Đường dẫn liên kết              |
| `title`     | string   | —         | Tiêu đề banner                  |
| `type`      | string   | —         | Loại: home | illust | manga | gif | novel |
| `isActive`  | boolean  | —         | Banner có đang hiển thị hay không |
| `sortOrder` | number   | —         | Thứ tự hiển thị                 |
| `createdAt` | datetime | —         | Thời điểm tạo                   |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất     |

## VIEW_EVENT — Sự kiện xem

> Ghi lại từng sự kiện xem tác phẩm (phục vụ analytics)

Thực thể **VIEW_EVENT** ghi lại từng sự kiện xem tác phẩm riêng lẻ, cho phép hệ thống phân tích lượt xem chi tiết theo thời gian. Khác với `viewCount` trên ARTWORK (giá trị tổng hợp được duy trì bằng $inc), VIEW_EVENT lưu từng sự kiện để phục vụ thống kê và biểu đồ.

| Trường | Kiểu | Ràng buộc | Mô tả |
| ------ | ---- | --------- | ----- |
| `_id` | ObjectId | PK | Mã sự kiện xem (tự động sinh) |
| `artwork` | ObjectId | FK | Tác phẩm được xem |
| `user` | ObjectId | FK | Người dùng xem (có thể null nếu chưa đăng nhập) |
| `createdAt` | datetime | — | Thời điểm xem |
| `updatedAt` | datetime | — | Thời điểm cập nhật gần nhất |

## CHAT_SESSION — Phiên AI Chat

> Phiên trò chuyện với AI Chatbot

Thực thể **CHAT_SESSION** lưu trữ các phiên trò chuyện với AI Chatbot, mỗi phiên chứa nhiều tin nhắn.

| Trường      | Kiểu     | Ràng buộc | Mô tả                           |
| ----------- | -------- | --------- | ------------------------------- |
| `_id`       | ObjectId | PK        | Mã phiên (tự động sinh)         |
| `user`      | ObjectId | FK        | Người dùng sở hữu phiên        |
| `title`     | string   | —         | Tiêu đề phiên (mặc định: Cuộc trò chuyện mới) |
| `createdAt` | datetime | —         | Thời điểm tạo                   |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất     |

## CHAT_MESSAGE — Tin nhắn AI Chat

> Tin nhắn trong phiên AI Chatbot

Thực thể **CHAT_MESSAGE** lưu trữ các tin nhắn trong phiên AI Chatbot, bao gồm tin nhắn từ người dùng, trợ lý AI và tin nhắn hệ thống.

| Trường       | Kiểu     | Ràng buộc | Mô tả                                       |
| ------------ | -------- | --------- | ------------------------------------------- |
| `_id`        | ObjectId | PK        | Mã tin nhắn (tự động sinh)                  |
| `session`    | ObjectId | FK        | Phiên chứa tin nhắn                          |
| `role`       | string   | —         | Vai trò: user | assistant | system           |
| `content`    | string   | —         | Nội dung tin nhắn                            |
| `toolUsed`   | boolean  | —         | Có sử dụng tool (search, recommend) hay không |
| `isError`    | boolean  | —         | Tin nhắn có phải lỗi hay không               |
| `isWelcome`  | boolean  | —         | Tin nhắn chào mừng hay không                 |
| `createdAt`  | datetime | —         | Thời điểm tạo                                |

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

## USER_REPORT — Báo cáo người dùng

> Báo cáo kiểm duyệt đối với người dùng

Thực thể **USER_REPORT** lưu trữ các báo cáo kiểm duyệt đối với người dùng, bao gồm lý do báo cáo, người báo cáo và trạng thái xử lý.

| Trường           | Kiểu     | Ràng buộc | Mô tả                        |
| ---------------- | -------- | --------- | ---------------------------- |
| `_id`            | ObjectId | PK        | Mã báo cáo (tự động sinh)    |
| `reportedUser`   | ObjectId | FK        | Người dùng bị báo cáo        |
| `reportedBy`     | ObjectId | FK        | Người báo cáo                |
| `reason`         | string   | —         | spam|inappropriate|harassment|impersonation|other |
| `description`    | string   | —         | Mô tả chi tiết lý do báo cáo |
| `status`         | string   | —         | Trạng thái xử lý: pending|resolved|dismissed |
| `resolvedBy`     | ObjectId | FK        | Người xử lý                  |
| `resolvedAt`     | datetime | —         | Thời điểm xử lý báo cáo      |
| `resolutionNote` | string   | —         | Ghi chú của người xử lý      |
| `createdAt`      | datetime | —         | Thời điểm tạo                |
| `updatedAt`      | datetime | —         | Thời điểm cập nhật gần nhất  |

## COMMENT_REPORT — Báo cáo bình luận

> Báo cáo kiểm duyệt đối với bình luận

Thực thể **COMMENT_REPORT** lưu trữ các báo cáo kiểm duyệt đối với bình luận, bao gồm lý do báo cáo, người báo cáo và trạng thái xử lý.

| Trường           | Kiểu     | Ràng buộc | Mô tả                        |
| ---------------- | -------- | --------- | ---------------------------- |
| `_id`            | ObjectId | PK        | Mã báo cáo (tự động sinh)    |
| `comment`        | ObjectId | FK        | Bình luận bị báo cáo         |
| `reportedBy`     | ObjectId | FK        | Người báo cáo                |
| `reason`         | string   | —         | spam|inappropriate|harassment|other |
| `description`    | string   | —         | Mô tả chi tiết lý do báo cáo |
| `status`         | string   | —         | Trạng thái xử lý: pending|resolved|dismissed |
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
| `visibility`           | string   | —         | Chế độ hiển thị (public | private)                                                         |
| `isAnonymous`          | boolean  | —         | Yêu cầu có ẩn danh hay không                                                               |
| `ageRating`            | string   | —         | Độ tuổi của yêu cầu                                                                        |
| `status`               | string   | —         | pending|in_progress|draft_submitted|revision|completed|rejected|cancelled                   |
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
| `licenseTier`          | string   | —         | Cấp giấy phép sử dụng: personal | commercial                                                |
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
| `round`     | number   | —         | 1 | 2 — Duy nhất trong yêu cầu |
| `notes`     | string   | —         | Nội dung yêu cầu chỉnh sửa  |
| `createdAt` | datetime | —         | Thời điểm tạo               |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất |

---

## Các quan hệ

Mô hình dữ liệu mức quan niệm gồm có 27 thực thể. Trong đó, thực thể **USER** (Người dùng) là thực thể trung tâm, với khoá chính là `_id`.

- **USER — ARTWORK**: Thực thể USER liên kết với thực thể ARTWORK (Tác phẩm) để cho biết người dùng tạo ra những tác phẩm nào. Một người dùng có thể tạo nhiều tác phẩm, và mỗi tác phẩm thuộc về một người dùng. Ngoài ra, người dùng có vai trò kiểm duyệt có thể ẩn tác phẩm.
- **USER — COMMENT**: Thực thể USER liên kết với thực thể COMMENT (Bình luận) để cho biết ai là người viết bình luận. Một người dùng có thể viết nhiều bình luận.
- **USER — LIKE**: Thực thể USER liên kết với thực thể LIKE (Lượt thích) để cho biết người dùng thích những tác phẩm nào.
- **USER — BOOKMARK**: Thực thể USER liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết người dùng đánh dấu những tác phẩm nào.
- **USER — FOLLOW**: Thực thể USER liên kết với thực thể FOLLOW (Theo dõi) để cho biết người dùng theo dõi những ai và được ai theo dõi. Quan hệ này có hai chiều: follows as follower (người dùng là người theo dõi) và is followed as following (người dùng là người được theo dõi).
- **USER — NOTIFICATION**: Thực thể USER liên kết với thực thể NOTIFICATION (Thông báo) để cho biết người dùng nhận thông báo và là tác nhân kích hoạt thông báo.
- **USER — MESSAGE**: Thực thể USER liên kết với thực thể MESSAGE (Tin nhắn) để cho biết người dùng gửi và nhận tin nhắn trực tiếp.
- **USER — USER_BLOCK**: Thực thể USER liên kết với thực thể USER_BLOCK (Chặn người dùng) để cho biết người dùng chặn ai và bị ai chặn.
- **USER — ARTWORK_REPORT**: Thực thể USER liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết người dùng báo cáo hoặc xử lý báo cáo tác phẩm.
- **USER — USER_REPORT**: Thực thể USER liên kết với thực thể USER_REPORT (Báo cáo người dùng) để cho biết người dùng báo cáo hoặc xử lý báo cáo người dùng.
- **USER — COMMENT_REPORT**: Thực thể USER liên kết với thực thể COMMENT_REPORT (Báo cáo bình luận) để cho biết người dùng báo cáo hoặc xử lý báo cáo bình luận.
- **USER — REQUEST_TERM**: Thực thể USER liên kết với thực thể REQUEST_TERM (Điều khoản ủy thác) để cho biết người dùng tạo ra các điều khoản nhận ủy thác.
- **USER — REQUEST**: Thực thể USER liên kết với thực thể REQUEST (Yêu cầu ủy thác) theo hai vai trò: là người sáng tạo/cung cấp dịch vụ hoặc là người yêu cầu/khách hàng.
- **USER — REQUEST_CHAT_MESSAGE**: Thực thể USER liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết người dùng gửi tin nhắn trong quá trình ủy thác.
- **USER — REQUEST_EVENT**: Thực thể USER liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại các thao tác của người dùng trên yêu cầu ủy thác.
- **USER — REQUEST_REVISION**: Thực thể USER liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết người dùng yêu cầu chỉnh sửa.
- **USER — READING_PROGRESS**: Thực thể USER liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc tác phẩm của người dùng.
- **USER — SERIES**: Thực thể USER liên kết với thực thể SERIES (Series tác phẩm) để cho biết người dùng tạo ra những series nào.
- **USER — BROWSE_HISTORY**: Thực thể USER liên kết với thực thể BROWSE_HISTORY (Lịch sử duyệt) để ghi lại lịch sử xem tác phẩm, phục vụ cho AI Recommendation.
- **USER — VIEW_EVENT**: Thực thể USER liên kết với thực thể VIEW_EVENT (Sự kiện xem) để ghi lại những lần người dùng xem tác phẩm. Quan hệ này cho phép hệ thống phân tích hành vi xem và tính lượt xem theo thời gian thực.
- **USER — CHAT_SESSION**: Thực thể USER liên kết với thực thể CHAT_SESSION (Phiên AI Chat) để cho biết người dùng có những phiên trò chuyện AI nào.
- **ARTWORK — TAG**: Thực thể ARTWORK (Tác phẩm) liên kết với thực thể TAG (Thẻ) qua quan hệ nhiều-nhiều tagged with để cho biết tác phẩm được gắn những thẻ nào và ngược lại.
- **ARTWORK — COMMENT**: Thực thể ARTWORK liên kết với thực thể COMMENT (Bình luận) để cho biết tác phẩm có những bình luận nào.
- **ARTWORK — LIKE**: Thực thể ARTWORK liên kết với thực thể LIKE (Lượt thích) để cho biết tác phẩm nhận được những lượt thích nào.
- **ARTWORK — BOOKMARK**: Thực thể ARTWORK liên kết với thực thể BOOKMARK (Đánh dấu) để cho biết tác phẩm được người dùng đánh dấu như thế nào.
- **ARTWORK — NOTIFICATION**: Thực thể ARTWORK liên kết với thực thể NOTIFICATION (Thông báo) để kích hoạt các thông báo liên quan đến tác phẩm.
- **ARTWORK — ARTWORK_REPORT**: Thực thể ARTWORK liên kết với thực thể ARTWORK_REPORT (Báo cáo tác phẩm) để cho biết tác phẩm bị báo cáo vì những lý do gì.
- **ARTWORK — READING_PROGRESS**: Thực thể ARTWORK liên kết với thực thể READING_PROGRESS (Tiến độ đọc) để theo dõi tiến độ đọc của người dùng trên tác phẩm.
- **ARTWORK — SERIES**: Thực thể ARTWORK liên kết với thực thể SERIES (Series tác phẩm) qua quan hệ nhiều-một (N-1) để cho biết tác phẩm thuộc về một series. Artwork có trường `series` (ObjectId, single ref) trỏ đến Series.
- **ARTWORK — VIEW_EVENT**: Thực thể ARTWORK liên kết với thực thể VIEW_EVENT (Sự kiện xem) để cho biết tác phẩm có những sự kiện xem nào. Mỗi lần người dùng xem tác phẩm sẽ tạo một bản ghi VIEW_EVENT mới.
- **SERIES — TAG**: Thực thể SERIES (Series) liên kết với thực thể TAG (Thẻ) qua quan hệ nhiều-nhiều tagged with để cho biết series được gắn những thẻ nào.
- **SERIES — ARTWORK**: Thực thể SERIES (Series) liên kết với thực thể ARTWORK (Tác phẩm) để quản lý danh sách tác phẩm trong series. Tất cả các loại series (manga, illust, novel) đều dùng chung mảng `artworks`.
- **COMMENT — COMMENT_REPORT**: Thực thể COMMENT liên kết với thực thể COMMENT_REPORT (Báo cáo bình luận) để cho biết bình luận bị báo cáo vì những lý do gì.
- **BROWSE_HISTORY — ARTWORK**: Thực thể BROWSE_HISTORY liên kết với thực thể ARTWORK để ghi lại tác phẩm nào đã được xem.
- **CHAT_SESSION — CHAT_MESSAGE**: Thực thể CHAT_SESSION (Phiên AI Chat) liên kết với thực thể CHAT_MESSAGE (Tin nhắn AI Chat) để quản lý các tin nhắn trong phiên.
- **REQUEST_TERM — REQUEST**: Thực thể REQUEST_TERM (Điều khoản ủy thác) liên kết với thực thể REQUEST (Yêu cầu ủy thác) để định nghĩa các yêu cầu dựa trên điều khoản đó. Một điều khoản có thể có nhiều yêu cầu.
- **REQUEST — REQUEST_CHAT_MESSAGE**: Thực thể REQUEST liên kết với thực thể REQUEST_CHAT_MESSAGE (Tin nhắn ủy thác) để cho biết yêu cầu ủy thác có những tin nhắn trao đổi nào.
- **REQUEST — REQUEST_EVENT**: Thực thể REQUEST liên kết với thực thể REQUEST_EVENT (Sự kiện ủy thác) để ghi lại nhật ký các sự kiện (thay đổi trạng thái, gia hạn, báo cáo) trên yêu cầu ủy thác.
- **REQUEST — REQUEST_REVISION**: Thực thể REQUEST liên kết với thực thể REQUEST_REVISION (Chỉnh sửa ủy thác) để cho biết yêu cầu ủy thác có những lần chỉnh sửa nào (tối đa 2 vòng).

---

_Cập nhật lần cuối: 2026-07-15 — 27 thực thể, 47+ quan hệ._
