# Báo Cáo Use Case - Hệ thống IlluWrl

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** 2026-07-15  

---

## Mục lục

1. [Giới thiệu về sơ đồ use case](#1-giới-thiệu-về-sơ-đồ-use-case)
2. [Bảng tổng hợp actors](#2-bảng-tổng-hợp-actors)
3. [Ma trận use case theo actor](#3-ma-trận-use-case-theo-actor)
4. [Danh sách use case chi tiết](#4-danh-sách-use-case-chi-tiết)
5. [Các mối quan hệ giữa các use case](#5-các-mối-quan-hệ-giữa-các-use-case)
6. [Kết luận](#6-kết-luận)

---

## 1. Giới thiệu về sơ đồ use case

Sơ đồ use case (Use Case Diagram) là một trong những biểu đồ quan trọng nhất trong UML,
dùng để mô tả các chức năng của hệ thống từ góc nhìn của người dùng (actors).
Sơ đồ use case giúp:

- **Xác định ranh giới hệ thống**: Những gì hệ thống làm và không làm
- **Xác định tác nhân (actors)**: Ai tương tác với hệ thống
- **Mô tả chức năng (use cases)**: Hệ thống cần làm gì
- **Thiết lập mối quan hệ**: Các use case liên quan và phụ thuộc lẫn nhau như thế nào

Đối với hệ thống **IlluWrl** - một nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone),
chúng tôi đã xây dựng **4 biểu đồ use case**:

| STT | Biểu đồ | Mô tả |
|-----|---------|-------|
| 1 | **Tổng Quát** | Toàn bộ actors và use case được tổ chức theo nhóm chức năng |
| 2 | **Khách vãng lai (Guest)** | Tập trung vào các chức năng dành cho người dùng chưa đăng nhập |
| 3 | **Thành viên (Member)** | Tập trung vào các chức năng dành cho người dùng đã đăng nhập |
| 4 | **Quản trị viên (Admin)** | Tập trung vào các chức năng quản trị và kiểm duyệt |

### Quy ước ký hiệu trong biểu đồ

| Ký hiệu | Ý nghĩa |
|---------|---------|
| `Actor ---> UseCase` | Actor thực hiện use case |
| `Actor1 <|-- Actor2` | Actor2 kế thừa quyền của Actor1 (generalization) |
| `UC1 ..> UC2 : <<extend>>` | UC1 mở rộng từ UC2 (tùy chọn) |
| `UC1 ..> UC2 : <<include>>` | UC1 bao gồm UC2 (bắt buộc) |

---

## 2. Bảng tổng hợp actors

| Actor | Vai trò | Mô tả | Kế thừa từ |
|-------|---------|-------|------------|
| **Khách vãng lai (Guest)** | Người dùng chưa xác thực | Có thể duyệt nội dung, xem hồ sơ công khai, tìm kiếm cơ bản, đăng ký/đăng nhập | — |
| **Thành viên (Member)** | Người dùng đã xác thực | Có thể đăng tải, tương tác, nhắn tin, sử dụng AI, vẽ online, commission | Guest |
| **Quản trị viên (Admin)** | Người quản trị hệ thống | Quản lý người dùng, kiểm duyệt nội dung, quản lý thanh toán, cấu hình AI | Member |
| **Hệ thống AI (AI System)** | Secondary actor (hệ thống con) | Thực hiện tác vụ AI: phát hiện AI, chat, tìm kiếm, tóm tắt | — |

### Sơ đồ phân cấp actors

```
Khách vãng lai (Guest)
    ↑
Thành viên (Member)
    ↑
Quản trị viên (Admin)
```

Quan hệ kế thừa (generalization) cho phép Admin có tất cả quyền của Member và Guest,
Member có tất cả quyền của Guest.

---

## 3. Ma trận use case theo actor

| Mã số | Use Case | Guest | Member | Admin |
|-------|----------|:-----:|:------:|:-----:|
| UC01 | Đăng ký tài khoản | ✅ | — | — |
| UC02 | Đăng nhập (Email + JWT) | ✅ | — | — |
| UC03 | Đăng nhập Google OAuth | ✅ | — | — |
| UC04 | Đăng xuất | — | ✅ | ✅ |
| UC05 | Xem trang chủ | ✅ | ✅ | ✅ |
| UC06 | Xem danh sách tác phẩm | ✅ | ✅ | ✅ |
| UC07 | Xem chi tiết tác phẩm | ✅ | ✅ | ✅ |
| UC08 | Xem bảng xếp hạng | ✅ | ✅ | ✅ |
| UC09 | Xem trang khám phá | ✅ | ✅ | ✅ |
| UC10 | Xem hồ sơ người dùng | ✅ | ✅ | ✅ |
| UC11 | Tìm kiếm tác phẩm | ✅ | ✅ | ✅ |
| UC12 | Tìm kiếm theo thẻ | ✅ | ✅ | ✅ |
| UC13 | Tìm kiếm người dùng | ✅ | ✅ | ✅ |
| UC14 | Tìm kiếm AI | — | ✅ | ✅ |
| UC15 | Chỉnh sửa hồ sơ | — | ✅ | ✅ |
| UC16 | Quản lý avatar/ảnh bìa | — | ✅ | ✅ |
| UC17 | Quản lý liên kết MXH | — | ✅ | ✅ |
| UC18 | Đăng tải tác phẩm | — | ✅ | ✅ |
| UC19 | Chỉnh sửa tác phẩm | — | ✅ | ✅ |
| UC20 | Xóa tác phẩm | — | ✅ | ✅ |
| UC22 | Xem Dashboard sáng tác | — | ✅ | ✅ |
| UC23 | Thích/Bỏ thích | — | ✅ | ✅ |
| UC24 | Bookmark tác phẩm | — | ✅ | ✅ |
| UC25 | Bình luận | — | ✅ | ✅ |
| UC26 | Trả lời bình luận | — | ✅ | ✅ |
| UC27 | Xóa bình luận của mình | — | ✅ | ✅ |
| UC28 | Theo dõi/Hủy theo dõi | — | ✅ | ✅ |
| UC29 | Xem feed following | — | ✅ | ✅ |
| UC30 | Nhắn tin trực tiếp | — | ✅ | ✅ |
| UC31 | Chặn người dùng | — | ✅ | ✅ |
| UC32 | Xem thông báo | — | ✅ | ✅ |
| UC33 | Tạo Request Term | — | ✅ | ✅ |
| UC34 | Đặt hàng Request | — | ✅ | ✅ |
| UC35 | Quản lý Request | — | ✅ | ✅ |
| UC37 | Gửi Fan Letter | — | ✅ | ✅ |
| UC38 | Chat trong Request | — | ✅ | ✅ |
| UC39 | Chat với AI Assistant | — | ✅ | ✅ |
| UC40 | Tìm kiếm bằng AI | — | ✅ | ✅ |
| UC41 | Tóm tắt nội dung AI | — | ✅ | ✅ |
| UC42 | Phát hiện AI (tự động) | — | — | — |
| UC43 | Vẽ online | — | ✅ | ✅ |
| UC44 | Xuất ảnh | — | ✅ | ✅ |
| UC47 | Xem Dashboard tổng quan | — | — | ✅ |
| UC48 | Quản lý người dùng | — | — | ✅ |
| UC49 | Kiểm duyệt tác phẩm | — | — | ✅ |
| UC50 | Kiểm duyệt bình luận | — | — | ✅ |
| UC51 | Quản lý thẻ (tag) | — | — | ✅ |
| UC52 | Quản lý thanh toán | — | — | ✅ |
| UC53 | Xử lý báo cáo vi phạm | — | — | ✅ |
| UC54 | Cấu hình AI | — | — | ✅ |
| UC55 | Báo cáo tác phẩm | — | ✅ | ✅ |
| UC56 | Ẩn tác phẩm | — | — | ✅ |
| UC57 | Bỏ ẩn tác phẩm | — | — | ✅ |

> **Ghi chú**: UC42 (Phát hiện AI) là use case tự động — Hệ thống AI thực hiện khi người dùng upload tác phẩm. Không có actor người kích hoạt trực tiếp.

---

## 4. Danh sách use case chi tiết

### 4.1 Nhóm: Xác thực (Authentication)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC01 | Đăng ký tài khoản | Tạo tài khoản mới bằng email, username, password. Validate đầu vào, hash password, lưu MongoDB, trả JWT. | Guest | — |
| UC02 | Đăng nhập (Email + JWT) | Xác thực email/password, sinh access token (JWT, 15 phút) + refresh token (7 ngày), gửi về client. | Guest | — |
| UC03 | Đăng nhập Google OAuth | Xác thực qua Google OAuth 2.0, nhận profile, tự động tạo/lấy tài khoản, sinh JWT. | Guest | — |
| UC04 | Đăng xuất | Thu hồi refresh token, xóa cookie, chuyển về trạng thái Guest. | Member | — |

### 4.2 Nhóm: Duyệt & Khám phá (Browse & Discover)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC05 | Xem trang chủ | Hiển thị tác phẩm nổi bật, trending, mới nhất, gợi ý cá nhân (nếu đã login). | Guest / Member / Admin | — |
| UC06 | Xem danh sách tác phẩm | Lọc và phân trang tác phẩm theo loại (illust/manga/gif/novel), sắp xếp theo thời gian/popularity. | Guest / Member / Admin | — |
| UC07 | Xem chi tiết tác phẩm | Hiển thị nội dung đầy đủ, thông tin tác giả, tag, thống kê tương tác, bình luận. | Guest / Member / Admin | — |
| UC08 | Xem bảng xếp hạng | Tính điểm tương tác và hiển thị top tác phẩm theo kỳ (Daily/Weekly/Monthly/Rookie). | Guest / Member / Admin | — |
| UC09 | Xem trang khám phá | Gợi ý tác phẩm đa dạng qua bộ lọc thể loại, thẻ, xu hướng, màu sắc. | Guest / Member / Admin | — |
| UC10 | Xem hồ sơ người dùng | Hiển thị thông tin công khai: avatar, bio, gallery, bộ sưu tập. | Guest / Member / Admin | — |

### 4.3 Nhóm: Tìm kiếm (Search)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC11 | Tìm kiếm tác phẩm | Tìm kiếm full-text với bộ lọc nâng cao (loại, tag, ngày, kích thước, NSFW). | Guest / Member / Admin | — |
| UC12 | Tìm kiếm theo thẻ | Tìm chính xác theo tên tag, hiển thị tag liên quan và thống kê. | Guest / Member / Admin | — |
| UC13 | Tìm kiếm người dùng | Tìm theo username, display name, ID. Hiển thị danh sách kết quả kèm avatar. | Guest / Member / Admin | — |
| UC14 | Tìm kiếm AI | Nhập câu hỏi tự nhiên, AI xử lý ngữ nghĩa và trả về kết quả phù hợp. | Member / Admin | UC42 |

### 4.4 Nhóm: Quản lý Hồ sơ (Profile Management)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC15 | Chỉnh sửa hồ sơ | Cập nhật display name, bio, website, ngày sinh. | Member / Admin | — |
| UC16 | Quản lý avatar/ảnh bìa | Upload và cắt ảnh đại diện, ảnh bìa (cover). Hỗ trợ crop/resize. | Member / Admin | — |
| UC17 | Quản lý liên kết MXH | Thêm/sửa/xóa các URL mạng xã hội (Twitter, Facebook, Instagram, Pixiv, v.v.). | Member / Admin | — |

### 4.5 Nhóm: Quản lý Tác phẩm (Artwork Management)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC18 | Đăng tải tác phẩm | Upload file (illust/manga/gif) hoặc nhập nội dung (novel), thêm tag, mô tả, cài đặt NSFW. | Member / Admin | — |
| UC19 | Chỉnh sửa tác phẩm | Sửa thông tin, thay thế file, thêm/xóa tag, cập nhật NSFW setting. | Member / Admin | — |
| UC20 | Xóa tác phẩm | Xóa vĩnh viễn tác phẩm và tất cả dữ liệu liên quan (comments, likes, bookmarks). | Member / Admin | — |
| UC22 | Xem Dashboard sáng tác | Biểu đồ thống kê lượt xem, thích, bookmark, theo dõi. Lọc theo thời gian. | Member / Admin | — |

### 4.6 Nhóm: Tương tác Xã hội (Social Interaction)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC23 | Thích/Bỏ thích | Toggle like/unlike artwork. Cập nhật realtime. | Member / Admin | — |
| UC24 | Bookmark tác phẩm | Lưu artwork vào folder cá nhân. Hỗ trợ tạo/quản lý folder. | Member / Admin | — |
| UC25 | Bình luận | Viết comment text dưới artwork. | Member / Admin | — |
| UC26 | Trả lời bình luận | Reply thread vào comment cụ thể. | Member / Admin | UC25 |
| UC27 | Xóa bình luận | Xóa comment của chính mình. | Member / Admin | — |
| UC28 | Theo dõi/Hủy theo dõi | Follow/unfollow user. Cập nhật feed. | Member / Admin | — |
| UC29 | Xem feed following | Xem danh sách bài đăng mới từ người đang follow, sắp xếp theo thời gian. | Member / Admin | UC28 |
| UC30 | Nhắn tin trực tiếp | Chat realtime giữa hai người dùng qua socket.io. Hỗ trợ text, ảnh. | Member / Admin | — |
| UC31 | Chặn người dùng | Chặn user — người bị chặn không thể comment, follow, nhắn tin. | Member / Admin | — |
| UC32 | Xem thông báo | Hệ thống notification realtime: like, comment, follow, request. | Member / Admin | — |

### 4.7 Nhóm: Ủy thác & Thanh toán (Commission & Payment)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC33 | Tạo Request Term | Creator tạo gói request: mô tả, price, content type, thời gian hoàn thành. | Member / Admin | — |
| UC34 | Đặt hàng Request | Client chọn term, điền yêu cầu chi tiết. | Member / Admin | UC33 |
| UC35 | Quản lý Request | Theo dõi lifecycle: pending → accepted → completed / rejected / cancelled. | Member / Admin | UC34 |
| UC37 | Gửi Fan Letter | Gửi tin nhắn kèm tip (donation) không qua commission. | Member / Admin | — |
| UC38 | Chat trong Request | Chat giữa creator và client trong từng request cụ thể. | Member / Admin | UC35 |

### 4.8 Nhóm: Tính năng AI

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC39 | Chat với AI Assistant | Hội thoại với AI assistant — hỗ trợ kỹ thuật, gợi ý nội dung, giải đáp thắc mắc. | Member / Admin | AI System |
| UC40 | Tìm kiếm bằng AI | Tìm kiếm semantic bằng ngôn ngữ tự nhiên, không cần từ khóa chính xác. | Member / Admin | AI System |
| UC41 | Tóm tắt nội dung AI | AI tóm tắt nội dung novel, description artwork thành đoạn ngắn. | Member / Admin | AI System |
| UC42 | Phát hiện AI (tự động) | Khi upload artwork, AI kiểm tra và gán nhãn AI-generated nếu phát hiện. | Hệ thống AI (tự động) | UC18 |

### 4.9 Nhóm: Công cụ Vẽ (Drawing Tool)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC43 | Vẽ online | Sử dụng Konva.js canvas để vẽ: brush, layer, color, shape. | Member / Admin | — |
| UC44 | Xuất ảnh | Xuất file PNG hoặc JPG từ canvas hiện tại. | Member / Admin | UC43 |

### 4.10 Nhóm: Báo cáo & Kiểm duyệt (Reporting & Moderation)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC55 | Báo cáo tác phẩm | Người dùng gửi báo cáo cho tác phẩm kèm lý do (spam, nội dung không phù hợp, vi phạm bản quyền, quấy rối, thiếu phân loại độ tuổi) và mô tả tùy chọn | Member / Admin | UC07 |
| UC56 | Ẩn tác phẩm | Admin ẩn tác phẩm khỏi hiển thị công khai, tự động giải quyết các báo cáo liên quan, gửi thông báo cho chủ sở hữu | Admin | UC55 |
| UC57 | Bỏ ẩn tác phẩm | Admin khôi phục hiển thị cho tác phẩm đã bị ẩn, gửi thông báo cho chủ sở hữu | Admin | UC56 |

### 4.12 Nhóm: Quản trị (Administration)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC47 | Xem Dashboard tổng quan | Thống kê toàn hệ thống: users, artworks, revenue, reports pending. | Admin | — |
| UC48 | Quản lý người dùng | CRUD users, set role, lock/unlock account. | Admin | — |
| UC49 | Kiểm duyệt tác phẩm | Xem, tìm, xóa artwork vi phạm. | Admin | — |
| UC50 | Kiểm duyệt bình luận | Xem, tìm, xóa comment vi phạm (spam, toxic, NSFW). | Admin | — |
| UC51 | Quản lý thẻ (tag) | Edit, lock/unlock, merge, delete tag. | Admin | — |
| UC52 | Quản lý thanh toán | View transactions, config platform fee, manage campaigns. | Admin | — |
| UC53 | Xử lý báo cáo vi phạm | Review report, determine violation, take action, resolve. | Admin | UC48, UC49, UC50 |
| UC54 | Cấu hình AI | Set AI detection threshold, configure model, manage prompt templates. | Admin | — |

---

## 5. Các mối quan hệ giữa các use case

### 5.1 Quan hệ Generalization (kế thừa)

| Use Case Cha | Use Case Con | Mô tả |
|-------------|-------------|-------|
| Guest | Member | Member có tất cả quyền của Guest (duyệt, tìm kiếm) |
| Member | Admin | Admin có tất cả quyền của Member (đăng tải, tương tác, AI, v.v.) |

### 5.2 Quan hệ Extend (mở rộng)

| Use Case | Mở rộng | Điều kiện | Mô tả |
|----------|---------|-----------|-------|
| UC01 (Đăng ký) | Member | Sau khi đăng ký thành công | Guest trở thành Member sau khi tạo tài khoản |
| UC18 (Upload) | UC42 (Phát hiện AI) | Khi upload artwork | Tự động kích hoạt AI detection sau khi upload |
| UC39 (Chat AI) | UC41 (Tóm tắt AI) | Khi người dùng yêu cầu tóm tắt | AI chat có thể gọi tóm tắt nội dung |
| UC43 (Vẽ online) | UC44 (Xuất ảnh) | Khi người dùng muốn tải ảnh | Sau khi vẽ, user có thể xuất ảnh |
| UC11 (Search works) | UC14 (AI search) | Khi người dùng chuyển sang chế độ AI | Search cơ bản có thể mở rộng sang AI search |

### 5.3 Quan hệ Include (bao gồm)

| Use Case Chính | Bao gồm | Mô tả |
|----------------|---------|-------|
| UC33 (Tạo Request Term) | UC34 (Đặt hàng Request) | Term là tiền đề để tạo order |
| UC35 (Quản lý Request) | UC38 (Chat Request) | Mỗi request có chat đi kèm |
| UC48 (Quản lý user) | UC53 (Xử lý báo cáo) | Xử lý báo cáo có thể dẫn đến quản lý user |
| UC49 (Kiểm duyệt art) | UC53 (Xử lý báo cáo) | Kiểm duyệt art thường từ báo cáo |
| UC50 (Kiểm duyệt comment) | UC53 (Xử lý báo cáo) | Kiểm duyệt comment thường từ báo cáo |
| UC53 (Xử lý báo cáo) | UC56 (Ẩn tác phẩm) | Xử lý báo cáo có thể dẫn đến ẩn tác phẩm |

### 5.4 Sơ đồ quan hệ tổng thể

```
UC01 (Đăng ký) --extend--> Member
                           |
UC18 (Upload) --extend--> UC42 (AI Detect)
UC11 (Search) --extend--> UC14 (AI Search)
UC39 (Chat AI) --extend--> UC41 (AI Summarize)
UC43 (Draw) --extend--> UC44 (Export)
                           |
UC33 (Term) --include--> UC34 (Order)
UC35 (Manage) --include--> UC38 (Chat)
                           |
UC48 (User Mgmt) --include--> UC53 (Report)
UC49 (Art Mod) --include--> UC53 (Report)
UC50 (Comment Mod) --include--> UC53 (Report)
UC53 (Report) --include--> UC56 (Hide Artwork)
```

---

## 6. Kết luận

### 6.1 Tổng kết

Hệ thống **IlluWrl** được mô hình hóa với:

| Thành phần | Số lượng |
|------------|:--------:|
| Actors | **4** (Guest, Member, Admin, AI System) |
| Use cases | **53** |
| Nhóm chức năng | **10** (Authentication, Browse, Search, Profile, Artwork, Social, Commission, AI, Drawing, Admin) |

### 6.2 Phân bố use case theo mức độ ưu tiên

| Mức độ | Số lượng | Mô tả |
|--------|:--------:|-------|
| ✅ **Đã triển khai** | 53 | Tất cả các use case đã được implement |
| ⚠️ **Triển khai một phần** | 0 | — |
| ❌ **Chưa triển khai** | 0 | — |

### 6.3 Kết quả đạt được

1. **Bao phủ toàn diện**: 53 use case bao phủ tất cả chức năng từ xác thực, duyệt nội dung,
   tương tác xã hội, báo cáo & kiểm duyệt, đến quản trị và AI.

2. **Phân quyền rõ ràng**: Quan hệ kế thừa (generalization) 3 tầng Guest → Member → Admin
   đảm bảo phân quyền chính xác.

3. **Tích hợp AI**: AI System được mô hình hóa như secondary actor, phục vụ 4 use case
   (chat, search, summarize, detect) và được kích hoạt tự động qua extend relationship.

4. **Quy trình nghiệp vụ**: Commission/Payment được mô hình hóa với chuỗi include/extend
   rõ ràng: Term → Order → Payment → Request → Chat.

5. **Hỗ trợ báo cáo**: 53 use case mỗi use case có mã số duy nhất, mô tả chi tiết,
   trạng thái triển khai và phụ thuộc, thuận tiện cho việc theo dõi tiến độ dự án.

### 6.4 Hướng phát triển

- **Bổ sung**: Có thể mở rộng thêm use case cho mobile app hoặc API third-party

---

> **Tài liệu này được tạo tự động từ script `scripts/generate-usecase-diagrams.js`**
> **Các biểu đồ Mermaid có thể được render bằng công cụ hỗ trợ Mermaid (GitHub, VS Code extension, hoặc mermaid.live)**
