/**
 * Script to generate all 5 Use Case diagram files for IlluWrl system.
 * Run: node scripts/generate-usecase-diagrams.js
 */
const fs = require('fs');
const path = require('path');

const DIAGRAMS_DIR = path.resolve(__dirname, '..', 'docs', 'diagrams');

// Ensure directory exists
if (!fs.existsSync(DIAGRAMS_DIR)) {
  fs.mkdirSync(DIAGRAMS_DIR, { recursive: true });
}

// ============================================================
// FILE 1: usecase-overall.md — Overall system use case diagram
// ============================================================
const file1 = `# Sơ đồ Use Case Tổng Quát - Hệ thống IlluWrl

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** ${new Date().toISOString().split('T')[0]}

## Tổng Quan

Biểu đồ dưới đây mô tả toàn bộ các use case của hệ thống IlluWrl, bao gồm bốn tác nhân (actors):
**Khách vãng lai (Guest)**, **Thành viên (Member)**, **Quản trị viên (Admin)** và **Hệ thống AI (AI System)**.

\`\`\`mermaid
---
title: Sơ đồ Use Case Tổng Quát - Hệ thống IlluWrl
---
---
config:
  useMaxWidth: true
  layoutControls:
    lineLength: 30
---
%% Actors
actor "Khách vãng lai\\n(Guest)" as Guest
actor "Thành viên\\n(Member)" as Member
actor "Quản trị viên\\n(Admin)" as Admin
actor "Hệ thống AI\\n(AI System)" as AISystem

%% Generalization: Member kế thừa Guest, Admin kế thừa Member
Guest <|-- Member
Member <|-- Admin

%% === PACKAGE: Authentication ===
rectangle "Xác thực (Authentication)" {
  usecase "UC01" as UC_REGISTER
  usecase "UC02" as UC_LOGIN_EMAIL
  usecase "UC03" as UC_LOGIN_GOOGLE
  usecase "UC04" as UC_LOGOUT
}

Guest --> UC_REGISTER
Guest --> UC_LOGIN_EMAIL
Guest --> UC_LOGIN_GOOGLE
Member --> UC_LOGOUT

%% === PACKAGE: Browse & Discover ===
rectangle "Duyệt & Khám phá (Browse & Discover)" {
  usecase "UC05" as UC_HOMEPAGE
  usecase "UC06" as UC_LIST_WORKS
  usecase "UC07" as UC_WORK_DETAIL
  usecase "UC08" as UC_RANKING
  usecase "UC09" as UC_DISCOVER
  usecase "UC10" as UC_USER_PROFILE
}

Guest --> UC_HOMEPAGE
Guest --> UC_LIST_WORKS
Guest --> UC_WORK_DETAIL
Guest --> UC_RANKING
Guest --> UC_DISCOVER
Guest --> UC_USER_PROFILE

%% === PACKAGE: Search ===
rectangle "Tìm kiếm (Search)" {
  usecase "UC11" as UC_SEARCH_WORKS
  usecase "UC12" as UC_SEARCH_TAG
  usecase "UC13" as UC_SEARCH_USER
  usecase "UC14" as UC_AI_SEARCH
}

Guest --> UC_SEARCH_WORKS
Guest --> UC_SEARCH_TAG
Guest --> UC_SEARCH_USER
Member --> UC_AI_SEARCH

%% === PACKAGE: Profile Management ===
rectangle "Quản lý Hồ sơ (Profile Management)" {
  usecase "UC15" as UC_EDIT_PROFILE
  usecase "UC16" as UC_MANAGE_AVATAR
  usecase "UC17" as UC_MANAGE_SOCIAL
}

Member --> UC_EDIT_PROFILE
Member --> UC_MANAGE_AVATAR
Member --> UC_MANAGE_SOCIAL

%% === PACKAGE: Artwork Management ===
rectangle "Quản lý Tác phẩm (Artwork Management)" {
  usecase "UC18" as UC_UPLOAD_ART
  usecase "UC19" as UC_EDIT_ART
  usecase "UC20" as UC_DELETE_ART
  usecase "UC21" as UC_MANAGE_CHAPTERS
  usecase "UC22" as UC_DASHBOARD
}

Member --> UC_UPLOAD_ART
Member --> UC_EDIT_ART
Member --> UC_DELETE_ART
Member --> UC_MANAGE_CHAPTERS
Member --> UC_DASHBOARD

%% === PACKAGE: Social Interaction ===
rectangle "Tương tác Xã hội (Social Interaction)" {
  usecase "UC23" as UC_LIKE
  usecase "UC24" as UC_BOOKMARK
  usecase "UC25" as UC_COMMENT
  usecase "UC26" as UC_REPLY_COMMENT
  usecase "UC27" as UC_DELETE_COMMENT
  usecase "UC28" as UC_FOLLOW
  usecase "UC29" as UC_FEED
  usecase "UC30" as UC_DIRECT_MSG
  usecase "UC31" as UC_BLOCK_USER
  usecase "UC32" as UC_NOTIFICATIONS
}

Member --> UC_LIKE
Member --> UC_BOOKMARK
Member --> UC_COMMENT
Member --> UC_REPLY_COMMENT
Member --> UC_DELETE_COMMENT
Member --> UC_FOLLOW
Member --> UC_FEED
Member --> UC_DIRECT_MSG
Member --> UC_BLOCK_USER
Member --> UC_NOTIFICATIONS

%% === PACKAGE: Commission & Payment ===
rectangle "Ủy thác & Thanh toán (Commission & Payment)" {
  usecase "UC33" as UC_CREATE_TERM
  usecase "UC34" as UC_ORDER_REQUEST
  usecase "UC35" as UC_MANAGE_REQUEST
  usecase "UC36" as UC_PAYMENT
  usecase "UC37" as UC_FAN_LETTER
  usecase "UC38" as UC_REQUEST_CHAT
}

Member --> UC_CREATE_TERM
Member --> UC_ORDER_REQUEST
Member --> UC_MANAGE_REQUEST
Member --> UC_PAYMENT
Member --> UC_FAN_LETTER
Member --> UC_REQUEST_CHAT

%% === PACKAGE: AI Features ===
rectangle "Tính năng AI (AI Features)" {
  usecase "UC39" as UC_AI_CHAT
  usecase "UC40" as UC_AI_SEARCH_UC
  usecase "UC41" as UC_AI_SUMMARIZE
  usecase "UC42" as UC_AI_DETECT
}

Member --> UC_AI_CHAT
Member --> UC_AI_SEARCH_UC
Member --> UC_AI_SUMMARIZE

%% Liên kết AI System với các use case AI
AISystem <-- UC_AI_CHAT
AISystem <-- UC_AI_SEARCH_UC
AISystem <-- UC_AI_SUMMARIZE
AISystem <-- UC_AI_DETECT

%% Quan hệ extend: Phát hiện AI được kích hoạt khi upload
UC_UPLOAD_ART ..> UC_AI_DETECT : <<extend>>
UC_SEARCH_WORKS ..> UC_AI_SEARCH_UC : <<extend>>

%% === PACKAGE: Drawing Tool ===
rectangle "Công cụ Vẽ (Drawing Tool)" {
  usecase "UC43" as UC_DRAW_ONLINE
  usecase "UC44" as UC_EXPORT_IMAGE
}

Member --> UC_DRAW_ONLINE
Member --> UC_EXPORT_IMAGE

%% === PACKAGE: Premium ===
rectangle "Premium (Premium)" {
  usecase "UC45" as UC_VIEW_PREMIUM
  usecase "UC46" as UC_SUBSCRIBE_PREMIUM
}

Member --> UC_VIEW_PREMIUM
Member --> UC_SUBSCRIBE_PREMIUM

%% === PACKAGE: Administration ===
rectangle "Quản trị (Administration)" {
  usecase "UC47" as UC_ADMIN_DASHBOARD
  usecase "UC48" as UC_MANAGE_USER
  usecase "UC49" as UC_MODERATE_ART
  usecase "UC50" as UC_MODERATE_COMMENT
  usecase "UC51" as UC_MANAGE_TAG
  usecase "UC52" as UC_MANAGE_PAYMENT
  usecase "UC53" as UC_HANDLE_REPORT
  usecase "UC54" as UC_CONFIG_AI
}

Admin --> UC_ADMIN_DASHBOARD
Admin --> UC_MANAGE_USER
Admin --> UC_MODERATE_ART
Admin --> UC_MODERATE_COMMENT
Admin --> UC_MANAGE_TAG
Admin --> UC_MANAGE_PAYMENT
Admin --> UC_HANDLE_REPORT
Admin --> UC_CONFIG_AI
\`\`\`

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính |
|-------|-------------|------------|-------------|
| UC01 | Đăng ký tài khoản | Người dùng tạo tài khoản mới bằng email và mật khẩu | Guest |
| UC02 | Đăng nhập (Email + JWT) | Người dùng đăng nhập bằng email và mật khẩu, nhận JWT token | Guest |
| UC03 | Đăng nhập Google OAuth | Người dùng đăng nhập thông qua tài khoản Google | Guest |
| UC04 | Đăng xuất | Thành viên đăng xuất khỏi hệ thống, thu hồi token | Member |
| UC05 | Xem trang chủ | Xem trang chủ với các tác phẩm nổi bật, đề xuất | Guest |
| UC06 | Xem danh sách tác phẩm | Xem danh sách tác phẩm theo loại (illust/manga/gif/novel) | Guest |
| UC07 | Xem chi tiết tác phẩm | Xem thông tin chi tiết, hình ảnh và tương tác của một tác phẩm | Guest |
| UC08 | Xem bảng xếp hạng | Xem bảng xếp hạng (Daily/Weekly/Monthly/Rookie) | Guest |
| UC09 | Xem trang khám phá | Khám phá tác phẩm mới, xu hướng, gợi ý | Guest |
| UC10 | Xem hồ sơ người dùng | Xem thông tin hồ sơ công khai của người dùng khác | Guest |
| UC11 | Tìm kiếm tác phẩm | Tìm kiếm tác phẩm bằng từ khóa kết hợp bộ lọc | Guest |
| UC12 | Tìm kiếm theo thẻ | Tìm kiếm tác phẩm theo thẻ (tag) | Guest |
| UC13 | Tìm kiếm người dùng | Tìm kiếm người dùng theo tên hoặc ID | Guest |
| UC14 | Tìm kiếm AI | Tìm kiếm tác phẩm bằng ngôn ngữ tự nhiên với AI | Member |
| UC15 | Chỉnh sửa hồ sơ | Cập nhật bio, display name và thông tin cá nhân | Member |
| UC16 | Quản lý avatar/ảnh bìa | Thay đổi avatar và ảnh bìa trang cá nhân | Member |
| UC17 | Quản lý liên kết MXH | Thêm/sửa/xóa các liên kết mạng xã hội | Member |
| UC18 | Đăng tải tác phẩm | Đăng tải illust/manga/gif/novel lên hệ thống | Member |
| UC19 | Chỉnh sửa tác phẩm | Sửa thông tin, nội dung của tác phẩm đã đăng | Member |
| UC20 | Xóa tác phẩm | Xóa tác phẩm của mình khỏi hệ thống | Member |
| UC21 | Quản lý chương (novel) | Thêm/sửa/xóa chương cho tác phẩm novel | Member |
| UC22 | Xem Dashboard sáng tác | Thống kê lượt xem, thích, bookmark của tác phẩm | Member |
| UC23 | Thích/Bỏ thích | Thích hoặc bỏ thích một tác phẩm | Member |
| UC24 | Bookmark tác phẩm | Lưu tác phẩm vào bộ sưu tập (folder-based) | Member |
| UC25 | Bình luận | Viết bình luận cho tác phẩm | Member |
| UC26 | Trả lời bình luận | Phản hồi một bình luận hiện có | Member |
| UC27 | Xóa bình luận của mình | Xóa bình luận do mình đã viết | Member |
| UC28 | Theo dõi/Hủy theo dõi | Theo dõi hoặc hủy theo dõi một người dùng | Member |
| UC29 | Xem feed following | Xem danh sách bài đăng từ những người đang theo dõi | Member |
| UC30 | Nhắn tin trực tiếp | Gửi và nhận tin nhắn riêng tư | Member |
| UC31 | Chặn người dùng | Chặn người dùng khác không thể tương tác | Member |
| UC32 | Xem thông báo | Nhận và xem thông báo về tương tác, hệ thống | Member |
| UC33 | Tạo Request Term | Người sáng tác tạo các điều khoản nhận request | Member |
| UC34 | Đặt hàng Request | Người đặt tạo request commission cho người sáng tác | Member |
| UC35 | Quản lý Request | Quản lý trạng thái request (chấp nhận/từ chối/hủy) | Member |
| UC36 | Thanh toán (Escrow/Refund) | Thanh toán qua escrow hoặc yêu cầu hoàn tiền | Member |
| UC37 | Gửi Fan Letter | Gửi tin nhắn hỗ trợ kèm tip cho người sáng tác | Member |
| UC38 | Chat trong Request | Trao đổi trực tiếp giữa hai bên trong request | Member |
| UC39 | Chat với AI Assistant | Trò chuyện với trợ lý AI để được hỗ trợ | Member |
| UC40 | Tìm kiếm bằng AI | Tìm kiếm tác phẩm bằng ngôn ngữ tự nhiên | Member |
| UC41 | Tóm tắt nội dung AI | Tóm tắt nội dung tác phẩm bằng AI | Member |
| UC42 | Phát hiện AI | Tự động phát hiện nội dung do AI tạo ra khi upload | Hệ thống (tự động) |
| UC43 | Vẽ online | Sử dụng công cụ vẽ Konva.js trực tiếp trên trình duyệt | Member |
| UC44 | Xuất ảnh | Xuất ảnh từ công cụ vẽ (PNG/JPG) | Member |
| UC45 | Xem thông tin Premium | Xem thông tin về gói Premium và quyền lợi | Member |
| UC46 | Đăng ký Premium | Đăng ký gói Premium (đã lên kế hoạch) | Member |
| UC47 | Xem Dashboard tổng quan | Xem KPI, thống kê toàn hệ thống | Admin |
| UC48 | Quản lý người dùng | Xem, tìm, sửa role và isPremium của người dùng | Admin |
| UC49 | Kiểm duyệt tác phẩm | Xem, tìm, xóa tác phẩm vi phạm | Admin |
| UC50 | Kiểm duyệt bình luận | Xem, tìm, xóa bình luận vi phạm | Admin |
| UC51 | Quản lý thẻ (tag) | Sửa tên/dịch thuật, khóa/mở khóa, gộp, xóa thẻ | Admin |
| UC52 | Quản lý thanh toán | Xem lịch sử, cấu hình phí, quản lý campaign | Admin |
| UC53 | Xử lý báo cáo vi phạm | Review và resolve các báo cáo từ người dùng | Admin |
| UC54 | Cấu hình AI | Điều chỉnh ngưỡng phát hiện AI, cấu hình model | Admin |
`;

// ============================================================
// FILE 2: usecase-guest.md — Guest use case diagram
// ============================================================
const file2 = `# Sơ đồ Use Case - Khách vãng lai (Guest)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** ${new Date().toISOString().split('T')[0]}

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Khách vãng lai (Guest)** — người dùng chưa đăng nhập.
Guest có thể đăng ký tài khoản, đăng nhập (email hoặc Google OAuth), duyệt và khám phá nội dung,
và thực hiện tìm kiếm cơ bản. Sau khi đăng nhập/đăng ký, Guest trở thành Member.

\`\`\`mermaid
---
title: Sơ đồ Use Case - Khách vãng lai (Guest)
---
---
config:
  useMaxWidth: true
---
actor "Khách vãng lai\\n(Guest)" as Guest

%% Generalization: Guest mở rộng thành Member
actor "Thành viên\\n(Member)" as Member
Guest <|-- Member

%% === PACKAGE: Authentication ===
rectangle "Xác thực (Authentication)" {
  usecase "UC01" as "Đăng ký tài khoản"
  usecase "UC02" as "Đăng nhập (Email + JWT)"
  usecase "UC03" as "Đăng nhập Google OAuth"
}

Guest --> UC01
Guest --> UC02
Guest --> UC03

%% Member extends từ Guest sau khi đăng ký
UC01 ..> Member : <<extend>>

%% === PACKAGE: Browse & Discover ===
rectangle "Duyệt & Khám phá (Browse & Discover)" {
  usecase "UC04" as "Xem trang chủ"
  usecase "UC05" as "Xem danh sách tác phẩm"
  usecase "UC06" as "Xem chi tiết tác phẩm"
  usecase "UC07" as "Xem bảng xếp hạng"
  usecase "UC08" as "Xem trang khám phá"
  usecase "UC09" as "Xem hồ sơ người dùng"
}

Guest --> UC04
Guest --> UC05
Guest --> UC06
Guest --> UC07
Guest --> UC08
Guest --> UC09

%% === PACKAGE: Search ===
rectangle "Tìm kiếm (Search)" {
  usecase "UC10" as "Tìm kiếm tác phẩm"
  usecase "UC11" as "Tìm kiếm theo thẻ (tag)"
  usecase "UC12" as "Tìm kiếm người dùng"
}

Guest --> UC10
Guest --> UC11
Guest --> UC12
\`\`\`

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính | Trạng thái |
|-------|-------------|------------|-------------|------------|
| UC01 | Đăng ký tài khoản | Người dùng tạo tài khoản mới bằng email, username và mật khẩu. Sau khi đăng ký, tài khoản chuyển thành Member. | Guest | ✅ |
| UC02 | Đăng nhập (Email + JWT) | Người dùng đăng nhập bằng email và mật khẩu, hệ thống trả về JWT access token và refresh token. | Guest | ✅ |
| UC03 | Đăng nhập Google OAuth | Người dùng đăng nhập thông qua tài khoản Google sử dụng OAuth 2.0, tự động tạo tài khoản nếu chưa tồn tại. | Guest | ✅ |
| UC04 | Xem trang chủ | Xem trang chủ với danh sách tác phẩm nổi bật, đề xuất cá nhân hóa (nếu có cookie) và tác phẩm mới nhất. | Guest | ✅ |
| UC05 | Xem danh sách tác phẩm | Xem danh sách tác phẩm được lọc theo loại (illust/manga/gif/novel), sắp xếp theo thời gian hoặc mức độ phổ biến. | Guest | ✅ |
| UC06 | Xem chi tiết tác phẩm | Xem trang chi tiết gồm hình ảnh/video đầy đủ, thông tin tác giả, mô tả, thẻ tag, bình luận (public) và thống kê tương tác. | Guest | ✅ |
| UC07 | Xem bảng xếp hạng | Xem bảng xếp hạng tác phẩm theo các kỳ: Daily, Weekly, Monthly, Rookie. Hiển thị top tác phẩm có điểm tương tác cao nhất. | Guest | ✅ |
| UC08 | Xem trang khám phá | Khám phá tác phẩm qua các bộ lọc đa dạng: thể loại, thẻ, xu hướng, màu sắc chủ đạo, gợi ý ngẫu nhiên. | Guest | ✅ |
| UC09 | Xem hồ sơ người dùng | Xem thông tin công khai của người dùng: avatar, bio, danh sách tác phẩm đã đăng, bộ sưu tập công khai. | Guest | ✅ |
| UC10 | Tìm kiếm tác phẩm | Tìm kiếm tác phẩm theo từ khóa kết hợp bộ lọc nâng cao (loại, tag, khoảng ngày, kích thước, nội dung). | Guest | ✅ |
| UC11 | Tìm kiếm theo thẻ (tag) | Tìm kiếm tác phẩm bằng thẻ tag chính xác, hiển thị các tác phẩm liên quan và thẻ gợi ý. | Guest | ✅ |
| UC12 | Tìm kiếm người dùng | Tìm kiếm người dùng khác theo username, display name hoặc ID, xem kết quả và hồ sơ tóm tắt. | Guest | ✅ |
`;

// ============================================================
// FILE 3: usecase-member.md — Member use case diagram
// ============================================================
const file3 = `# Sơ đồ Use Case - Thành viên (Member)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** ${new Date().toISOString().split('T')[0]}

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Thành viên (Member)** — người dùng đã đăng nhập.
Member kế thừa tất cả quyền của Guest và có thêm các quyền: quản lý hồ sơ, quản lý tác phẩm,
tương tác xã hội, ủy thác & thanh toán, tính năng AI, công cụ vẽ và Premium.

\`\`\`mermaid
---
title: Sơ đồ Use Case - Thành viên (Member)
---
---
config:
  useMaxWidth: true
  layoutControls:
    lineLength: 25
---
%% Actors
actor "Thành viên\\n(Member)" as Member

%% Generalization: Member kế thừa từ Guest
actor "Khách vãng lai\\n(Guest)" as Guest
Guest <|-- Member

%% === Authentication ===
rectangle "Xác thực & Tài khoản" {
  usecase "UC04" as "Đăng xuất"
  usecase "UC15" as "Chỉnh sửa hồ sơ"
  usecase "UC16" as "Quản lý avatar/ảnh bìa"
  usecase "UC17" as "Quản lý liên kết MXH"
}

Member --> UC04
Member --> UC15
Member --> UC16
Member --> UC17

%% === Artwork ===
rectangle "Nhóm Tác phẩm" {
  usecase "UC18" as "Đăng tải tác phẩm"
  usecase "UC19" as "Chỉnh sửa tác phẩm"
  usecase "UC20" as "Xóa tác phẩm"
  usecase "UC21" as "Quản lý chương (novel)"
  usecase "UC22" as "Xem Dashboard sáng tác"
}

Member --> UC18
Member --> UC19
Member --> UC20
Member --> UC21
Member --> UC22

%% === Social ===
rectangle "Nhóm Tương tác" {
  usecase "UC23" as "Thích/Bỏ thích"
  usecase "UC24" as "Bookmark tác phẩm"
  usecase "UC25" as "Bình luận"
  usecase "UC26" as "Trả lời bình luận"
  usecase "UC27" as "Xóa bình luận"
  usecase "UC28" as "Theo dõi/Hủy theo dõi"
  usecase "UC29" as "Xem feed following"
  usecase "UC30" as "Nhắn tin trực tiếp"
  usecase "UC31" as "Chặn người dùng"
  usecase "UC32" as "Xem thông báo"
}

Member --> UC23
Member --> UC24
Member --> UC25
Member --> UC26
Member --> UC27
Member --> UC28
Member --> UC29
Member --> UC30
Member --> UC31
Member --> UC32

%% === Commission ===
rectangle "Nhóm Ủy thác & Thanh toán" {
  usecase "UC33" as "Tạo Request Term"
  usecase "UC34" as "Đặt hàng Request"
  usecase "UC35" as "Quản lý Request"
  usecase "UC36" as "Thanh toán (Escrow/Refund)"
  usecase "UC37" as "Gửi Fan Letter"
  usecase "UC38" as "Chat trong Request"
}

Member --> UC33
Member --> UC34
Member --> UC35
Member --> UC36
Member --> UC37
Member --> UC38

%% Tạo Request Term liên quan đến Đặt hàng Request
UC33 ..> UC34 : <<include>>
UC34 ..> UC36 : <<include>>
UC35 ..> UC38 : <<include>>

%% === AI & Tools ===
rectangle "Nhóm AI & Công cụ" {
  usecase "UC39" as "Chat AI Assistant"
  usecase "UC40" as "Tìm kiếm AI"
  usecase "UC41" as "Tóm tắt AI"
  usecase "UC43" as "Vẽ online"
  usecase "UC44" as "Xuất ảnh"
}

Member --> UC39
Member --> UC40
Member --> UC41
Member --> UC43
Member --> UC44

%% === Premium ===
rectangle "Nhóm Premium" {
  usecase "UC45" as "Xem thông tin Premium"
  usecase "UC46" as "Đăng ký Premium"
}

Member --> UC45
Member --> UC46

%% Quan hệ giữa các use case bổ sung
UC39 ..> UC41 : <<extend>>
UC43 ..> UC44 : <<extend>>
\`\`\`

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính | Trạng thái |
|-------|-------------|------------|-------------|------------|
| UC04 | Đăng xuất | Thu hồi JWT token, xóa session, chuyển về trạng thái Guest | Member | ✅ |
| UC15 | Chỉnh sửa hồ sơ | Cập nhật bio, display name, website và thông tin cá nhân | Member | ✅ |
| UC16 | Quản lý avatar/ảnh bìa | Upload, cắt, thay đổi avatar và ảnh bìa trang cá nhân | Member | ✅ |
| UC17 | Quản lý liên kết MXH | Thêm/sửa/xóa liên kết đến Twitter, Facebook, Instagram, v.v. | Member | ✅ |
| UC18 | Đăng tải tác phẩm | Upload tác phẩm dạng illust (PNG/JPG), manga (nhiều ảnh), GIF hoặc novel (văn bản) | Member | ✅ |
| UC19 | Chỉnh sửa tác phẩm | Sửa tiêu đề, mô tả, thẻ tag, nội dung của tác phẩm đã đăng | Member | ✅ |
| UC20 | Xóa tác phẩm | Xóa vĩnh viễn tác phẩm khỏi hệ thống | Member | ✅ |
| UC21 | Quản lý chương (novel) | Thêm, sửa nội dung, xóa chương cho tác phẩm dạng novel | Member | ✅ |
| UC22 | Xem Dashboard sáng tác | Xem thống kê chi tiết: lượt xem, thích, bookmark, theo dõi theo thời gian | Member | ✅ |
| UC23 | Thích/Bỏ thích tác phẩm | Thích (like) hoặc bỏ thích (unlike) một tác phẩm | Member | ✅ |
| UC24 | Bookmark tác phẩm | Lưu tác phẩm vào bộ sưu tập cá nhân, hỗ trợ phân loại theo folder | Member | ✅ |
| UC25 | Bình luận | Viết bình luận bằng văn bản cho tác phẩm | Member | ✅ |
| UC26 | Trả lời bình luận | Phản hồi trực tiếp vào một bình luận hiện có (thread) | Member | ✅ |
| UC27 | Xóa bình luận của mình | Xóa bình luận do chính mình đã viết | Member | ✅ |
| UC28 | Theo dõi/Hủy theo dõi | Theo dõi để nhận cập nhật hoặc hủy theo dõi một người dùng | Member | ✅ |
| UC29 | Xem feed following | Xem luồng bài đăng (feed) từ những người dùng đang theo dõi | Member | ✅ |
| UC30 | Nhắn tin trực tiếp | Gửi và nhận tin nhắn riêng tư theo thời gian thực (socket.io) | Member | ✅ |
| UC31 | Chặn người dùng | Chặn một người dùng — người bị chặn không thể tương tác hoặc nhắn tin | Member | ✅ |
| UC32 | Xem thông báo | Nhận thông báo realtime về thích, bình luận, theo dõi, request mới | Member | ✅ |
| UC33 | Tạo Request Term | Người sáng tác thiết lập các gói request (price, content type, terms) | Member | ✅ |
| UC34 | Đặt hàng Request | Người đặt tạo request commission dựa trên term của người sáng tác | Member | ✅ |
| UC35 | Quản lý Request | Theo dõi và cập nhật trạng thái request (pending/accepted/rejected/cancelled/completed) | Member | ✅ |
| UC36 | Thanh toán (Escrow/Refund) | Thanh toán qua escrow, giải ngân khi hoàn thành, yêu cầu hoàn tiền | Member | ⚠️ |
| UC37 | Gửi Fan Letter | Gửi tin nhắn hỗ trợ kèm tip (donation) cho người sáng tác | Member | ✅ |
| UC38 | Chat trong Request | Trao đổi trực tiếp giữa người đặt và người sáng tác trong request | Member | ✅ |
| UC39 | Chat với AI Assistant | Trò chuyện với AI assistant để được hỗ trợ về hệ thống, gợi ý nội dung | Member | ✅ |
| UC40 | Tìm kiếm bằng AI | Tìm kiếm tác phẩm bằng ngôn ngữ tự nhiên, AI hiểu ngữ cảnh và intent | Member | ✅ |
| UC41 | Tóm tắt nội dung AI | AI tự động tóm tắt nội dung novel hoặc mô tả tác phẩm | Member | ✅ |
| UC43 | Vẽ online | Sử dụng công cụ vẽ tích hợp (Konva.js canvas) để vẽ trực tiếp trên web | Member | ✅ |
| UC44 | Xuất ảnh | Xuất tác phẩm từ công cụ vẽ dưới định dạng PNG hoặc JPG | Member | ✅ |
| UC45 | Xem thông tin Premium | Xem trang thông tin gói Premium, quyền lợi và bảng giá | Member | ✅ |
| UC46 | Đăng ký Premium | Đăng ký gói Premium (chức năng đã lên kế hoạch, chưa triển khai) | Member | ❌ |
`;

// ============================================================
// FILE 4: usecase-admin.md — Admin use case diagram
// ============================================================
const file4 = `# Sơ đồ Use Case - Quản trị viên (Admin)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** ${new Date().toISOString().split('T')[0]}

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Quản trị viên (Admin)**.
Admin kế thừa tất cả quyền của Member (và do đó kế thừa cả quyền của Guest).
Ngoài ra, Admin có các quyền đặc biệt để quản trị và kiểm duyệt hệ thống.

\`\`\`mermaid
---
title: Sơ đồ Use Case - Quản trị viên (Admin)
---
---
config:
  useMaxWidth: true
  layoutControls:
    lineLength: 25
---
%% Actors
actor "Quản trị viên\\n(Admin)" as Admin

%% Generalization: Admin kế thừa Member, Member kế thừa Guest
actor "Thành viên\\n(Member)" as Member
actor "Khách vãng lai\\n(Guest)" as Guest

Guest <|-- Member
Member <|-- Admin

%% === Administration ===
rectangle "Quản trị (Administration)" {
  usecase "UC47" as "Xem Dashboard tổng quan"
  usecase "UC48" as "Quản lý người dùng"
  usecase "UC49" as "Kiểm duyệt tác phẩm"
  usecase "UC50" as "Kiểm duyệt bình luận"
  usecase "UC51" as "Quản lý thẻ (tag)"
  usecase "UC52" as "Quản lý thanh toán"
  usecase "UC53" as "Xử lý báo cáo vi phạm"
  usecase "UC54" as "Cấu hình AI"
}

Admin --> UC47
Admin --> UC48
Admin --> UC49
Admin --> UC50
Admin --> UC51
Admin --> UC52
Admin --> UC53
Admin --> UC54

%% Quan hệ giữa các use case
UC48 ..> UC53 : <<include>>
UC49 ..> UC53 : <<include>>
UC50 ..> UC53 : <<include>>
\`\`\`

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính | Trạng thái |
|-------|-------------|------------|-------------|------------|
| UC47 | Xem Dashboard tổng quan | Xem bảng KPI tổng quan: số người dùng, tác phẩm, doanh thu, request, báo cáo đang chờ xử lý | Admin | ✅ |
| UC48 | Quản lý người dùng | Xem danh sách, tìm kiếm người dùng; chỉnh sửa role (member/admin), isPremium status; khóa/mở khóa tài khoản | Admin | ✅ |
| UC49 | Kiểm duyệt tác phẩm | Xem danh sách tác phẩm (có bộ lọc), xem chi tiết, xóa tác phẩm vi phạm điều khoản | Admin | ✅ |
| UC50 | Kiểm duyệt bình luận | Xem danh sách bình luận, xóa bình luận vi phạm (spam, thù địch, nội dung người lớn) | Admin | ✅ |
| UC51 | Quản lý thẻ (tag) | Sửa tên/dịch thuật tag, khóa/mở khóa tag (ngăn sử dụng), gộp tag (merge), xóa tag | Admin | ✅ |
| UC52 | Quản lý thanh toán | Xem lịch sử giao dịch, cấu hình phí hệ thống, quản lý campaign khuyến mãi | Admin | ⚠️ |
| UC53 | Xử lý báo cáo vi phạm | Review báo cáo từ người dùng, xác minh hành vi vi phạm, áp dụng biện pháp (cảnh cáo/xóa nội dung/khóa tài khoản) và resolve báo cáo | Admin | ✅ |
| UC54 | Cấu hình AI | Điều chỉnh threshold phát hiện AI (AI detection score), cấu hình model AI search, quản lý prompt template | Admin | ✅ |
`;

// ============================================================
// FILE 5: usecase-report.md — Comprehensive report
// ============================================================
const file5 = `# Báo Cáo Use Case - Hệ thống IlluWrl

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** ${new Date().toISOString().split('T')[0]}  

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
| \`Actor ---> UseCase\` | Actor thực hiện use case |
| \`Actor1 <|-- Actor2\` | Actor2 kế thừa quyền của Actor1 (generalization) |
| \`UC1 ..> UC2 : <<extend>>\` | UC1 mở rộng từ UC2 (tùy chọn) |
| \`UC1 ..> UC2 : <<include>>\` | UC1 bao gồm UC2 (bắt buộc) |

---

## 2. Bảng tổng hợp actors

| Actor | Vai trò | Mô tả | Kế thừa từ |
|-------|---------|-------|------------|
| **Khách vãng lai (Guest)** | Người dùng chưa xác thực | Có thể duyệt nội dung, xem hồ sơ công khai, tìm kiếm cơ bản, đăng ký/đăng nhập | — |
| **Thành viên (Member)** | Người dùng đã xác thực | Có thể đăng tải, tương tác, nhắn tin, sử dụng AI, vẽ online, commission | Guest |
| **Quản trị viên (Admin)** | Người quản trị hệ thống | Quản lý người dùng, kiểm duyệt nội dung, quản lý thanh toán, cấu hình AI | Member |
| **Hệ thống AI (AI System)** | Secondary actor (hệ thống con) | Thực hiện tác vụ AI: phát hiện AI, chat, tìm kiếm, tóm tắt | — |

### Sơ đồ phân cấp actors

\`\`\`
Khách vãng lai (Guest)
    ↑
Thành viên (Member)
    ↑
Quản trị viên (Admin)
\`\`\`

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
| UC21 | Quản lý chương (novel) | — | ✅ | ✅ |
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
| UC36 | Thanh toán (Escrow/Refund) | — | ✅ | ✅ |
| UC37 | Gửi Fan Letter | — | ✅ | ✅ |
| UC38 | Chat trong Request | — | ✅ | ✅ |
| UC39 | Chat với AI Assistant | — | ✅ | ✅ |
| UC40 | Tìm kiếm bằng AI | — | ✅ | ✅ |
| UC41 | Tóm tắt nội dung AI | — | ✅ | ✅ |
| UC42 | Phát hiện AI (tự động) | — | — | — |
| UC43 | Vẽ online | — | ✅ | ✅ |
| UC44 | Xuất ảnh | — | ✅ | ✅ |
| UC45 | Xem thông tin Premium | — | ✅ | ✅ |
| UC46 | Đăng ký Premium | — | ✅ | ✅ |
| UC47 | Xem Dashboard tổng quan | — | — | ✅ |
| UC48 | Quản lý người dùng | — | — | ✅ |
| UC49 | Kiểm duyệt tác phẩm | — | — | ✅ |
| UC50 | Kiểm duyệt bình luận | — | — | ✅ |
| UC51 | Quản lý thẻ (tag) | — | — | ✅ |
| UC52 | Quản lý thanh toán | — | — | ✅ |
| UC53 | Xử lý báo cáo vi phạm | — | — | ✅ |
| UC54 | Cấu hình AI | — | — | ✅ |

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
| UC21 | Quản lý chương (novel) | Thêm, sửa nội dung, xóa chương cho novel dài tập. | Member / Admin | UC18 |
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
| UC34 | Đặt hàng Request | Client chọn term, điền yêu cầu chi tiết, thanh toán escrow. | Member / Admin | UC33 |
| UC35 | Quản lý Request | Theo dõi lifecycle: pending → accepted → completed / rejected / cancelled. | Member / Admin | UC34 |
| UC36 | Thanh toán (Escrow/Refund) | Giữ tiền trong escrow, giải ngân khi hoàn thành, hỗ trợ refund. | Member / Admin | UC35 |
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

### 4.10 Nhóm: Premium

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC45 | Xem thông tin Premium | Xem trang giới thiệu Premium: quyền lợi, bảng giá, so sánh. | Member / Admin | — |
| UC46 | Đăng ký Premium | Đăng ký gói Premium (chưa triển khai — planned). | Member / Admin | — |

### 4.11 Nhóm: Quản trị (Administration)

| Mã số | Tên | Mô tả | Actor | Phụ thuộc |
|-------|-----|-------|-------|-----------|
| UC47 | Xem Dashboard tổng quan | Thống kê toàn hệ thống: users, artworks, revenue, reports pending. | Admin | — |
| UC48 | Quản lý người dùng | CRUD users, set role/premium, lock/unlock account. | Admin | — |
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
| UC34 (Đặt hàng Request) | UC36 (Thanh toán) | Đặt hàng yêu cầu thanh toán escrow |
| UC35 (Quản lý Request) | UC38 (Chat Request) | Mỗi request có chat đi kèm |
| UC48 (Quản lý user) | UC53 (Xử lý báo cáo) | Xử lý báo cáo có thể dẫn đến quản lý user |
| UC49 (Kiểm duyệt art) | UC53 (Xử lý báo cáo) | Kiểm duyệt art thường từ báo cáo |
| UC50 (Kiểm duyệt comment) | UC53 (Xử lý báo cáo) | Kiểm duyệt comment thường từ báo cáo |

### 5.4 Sơ đồ quan hệ tổng thể

\`\`\`
UC01 (Đăng ký) --extend--> Member
                           |
UC18 (Upload) --extend--> UC42 (AI Detect)
UC11 (Search) --extend--> UC14 (AI Search)
UC39 (Chat AI) --extend--> UC41 (AI Summarize)
UC43 (Draw) --extend--> UC44 (Export)
                           |
UC33 (Term) --include--> UC34 (Order)
UC34 (Order) --include--> UC36 (Payment)
UC35 (Manage) --include--> UC38 (Chat)
                           |
UC48 (User Mgmt) --include--> UC53 (Report)
UC49 (Art Mod) --include--> UC53 (Report)
UC50 (Comment Mod) --include--> UC53 (Report)
\`\`\`

---

## 6. Kết luận

### 6.1 Tổng kết

Hệ thống **IlluWrl** được mô hình hóa với:

| Thành phần | Số lượng |
|------------|:--------:|
| Actors | **4** (Guest, Member, Admin, AI System) |
| Use cases | **54** |
| Nhóm chức năng | **11** (Authentication, Browse, Search, Profile, Artwork, Social, Commission, AI, Drawing, Premium, Admin) |

### 6.2 Phân bố use case theo mức độ ưu tiên

| Mức độ | Số lượng | Mô tả |
|--------|:--------:|-------|
| ✅ **Đã triển khai** | 52 | Hầu hết các use case đã được implement |
| ⚠️ **Triển khai một phần** | 1 | UC36 (Thanh toán Escrow) — chức năng cốt lõi nhưng chưa đầy đủ |
| ❌ **Chưa triển khai** | 1 | UC46 (Đăng ký Premium) — đã lên kế hoạch |

### 6.3 Kết quả đạt được

1. **Bao phủ toàn diện**: 54 use case bao phủ tất cả chức năng từ xác thực, duyệt nội dung,
   tương tác xã hội, đến quản trị và AI.

2. **Phân quyền rõ ràng**: Quan hệ kế thừa (generalization) 3 tầng Guest → Member → Admin
   đảm bảo phân quyền chính xác.

3. **Tích hợp AI**: AI System được mô hình hóa như secondary actor, phục vụ 4 use case
   (chat, search, summarize, detect) và được kích hoạt tự động qua extend relationship.

4. **Quy trình nghiệp vụ**: Commission/Payment được mô hình hóa với chuỗi include/extend
   rõ ràng: Term → Order → Payment → Request → Chat.

5. **Hỗ trợ báo cáo**: 54 use case mỗi use case có mã số duy nhất, mô tả chi tiết,
   trạng thái triển khai và phụ thuộc, thuận tiện cho việc theo dõi tiến độ dự án.

### 6.4 Hướng phát triển

- **UC46 (Đăng ký Premium)**: Cần tích hợp cổng thanh toán (PayPal/VNPay/Momo)
- **UC36 (Thanh toán Escrow)**: Hoàn thiện quy trình escrow, dispute resolution
- **Bổ sung**: Có thể mở rộng thêm use case cho mobile app hoặc API third-party

---

> **Tài liệu này được tạo tự động từ script \`scripts/generate-usecase-diagrams.js\`**
> **Các biểu đồ Mermaid có thể được render bằng công cụ hỗ trợ Mermaid (GitHub, VS Code extension, hoặc mermaid.live)**
`;

// ============================================================
// WRITE ALL FILES
// ============================================================
const files = [
  { name: 'usecase-overall.md', content: file1 },
  { name: 'usecase-guest.md', content: file2 },
  { name: 'usecase-member.md', content: file3 },
  { name: 'usecase-admin.md', content: file4 },
  { name: 'usecase-report.md', content: file5 },
];

for (const file of files) {
  const filePath = path.join(DIAGRAMS_DIR, file.name);
  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

console.log('\n🎉 All 5 use case diagram files generated successfully!');
