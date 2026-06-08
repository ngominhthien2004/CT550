# Sơ đồ Use Case Tổng Quát - Hệ thống IlluWrl

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** 2026-06-08

## Tổng Quan

Biểu đồ dưới đây mô tả toàn bộ các use case của hệ thống IlluWrl, bao gồm bốn tác nhân (actors):
**Khách vãng lai (Guest)**, **Thành viên (Member)**, **Quản trị viên (Admin)** và **Hệ thống AI (AI System)**.

```mermaid
actor "Khách vãng lai\n(Guest)" as Guest
actor "Thành viên\n(Member)" as Member
actor "Quản trị viên\n(Admin)" as Admin
actor "Hệ thống AI\n(AI System)" as AISystem

Guest <|-- Member
Member <|-- Admin

%% ===== Xác thực (Authentication) =====
usecase "UC01" as UC_REGISTER
usecase "UC02" as UC_LOGIN_EMAIL
usecase "UC03" as UC_LOGIN_GOOGLE
usecase "UC04" as UC_LOGOUT

Guest --> UC_REGISTER
Guest --> UC_LOGIN_EMAIL
Guest --> UC_LOGIN_GOOGLE
Member --> UC_LOGOUT

%% ===== Duyệt & Khám phá (Browse & Discover) =====
usecase "UC05" as UC_HOMEPAGE
usecase "UC06" as UC_LIST_WORKS
usecase "UC07" as UC_WORK_DETAIL
usecase "UC08" as UC_RANKING
usecase "UC09" as UC_DISCOVER
usecase "UC10" as UC_USER_PROFILE

Guest --> UC_HOMEPAGE
Guest --> UC_LIST_WORKS
Guest --> UC_WORK_DETAIL
Guest --> UC_RANKING
Guest --> UC_DISCOVER
Guest --> UC_USER_PROFILE

%% ===== Tìm kiếm (Search) =====
usecase "UC11" as UC_SEARCH_WORKS
usecase "UC12" as UC_SEARCH_TAG
usecase "UC13" as UC_SEARCH_USER
usecase "UC14" as UC_AI_SEARCH

Guest --> UC_SEARCH_WORKS
Guest --> UC_SEARCH_TAG
Guest --> UC_SEARCH_USER
Member --> UC_AI_SEARCH

%% ===== Quản lý Hồ sơ (Profile Management) =====
usecase "UC15" as UC_EDIT_PROFILE
usecase "UC16" as UC_MANAGE_AVATAR
usecase "UC17" as UC_MANAGE_SOCIAL

Member --> UC_EDIT_PROFILE
Member --> UC_MANAGE_AVATAR
Member --> UC_MANAGE_SOCIAL

%% ===== Quản lý Tác phẩm (Artwork Management) =====
usecase "UC18" as UC_UPLOAD_ART
usecase "UC19" as UC_EDIT_ART
usecase "UC20" as UC_DELETE_ART
usecase "UC21" as UC_MANAGE_CHAPTERS
usecase "UC22" as UC_DASHBOARD

Member --> UC_UPLOAD_ART
Member --> UC_EDIT_ART
Member --> UC_DELETE_ART
Member --> UC_MANAGE_CHAPTERS
Member --> UC_DASHBOARD

%% ===== Tương tác Xã hội (Social Interaction) =====
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

%% ===== Ủy thác & Thanh toán (Commission & Payment) =====
usecase "UC33" as UC_CREATE_TERM
usecase "UC34" as UC_ORDER_REQUEST
usecase "UC35" as UC_MANAGE_REQUEST
usecase "UC36" as UC_PAYMENT
usecase "UC37" as UC_FAN_LETTER
usecase "UC38" as UC_REQUEST_CHAT

Member --> UC_CREATE_TERM
Member --> UC_ORDER_REQUEST
Member --> UC_MANAGE_REQUEST
Member --> UC_PAYMENT
Member --> UC_FAN_LETTER
Member --> UC_REQUEST_CHAT

%% ===== Tính năng AI (AI Features) =====
usecase "UC39" as UC_AI_CHAT
usecase "UC40" as UC_AI_SEARCH_UC
usecase "UC41" as UC_AI_SUMMARIZE
usecase "UC42" as UC_AI_DETECT

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

%% ===== Công cụ Vẽ (Drawing Tool) =====
usecase "UC43" as UC_DRAW_ONLINE
usecase "UC44" as UC_EXPORT_IMAGE

Member --> UC_DRAW_ONLINE
Member --> UC_EXPORT_IMAGE

%% ===== Premium (Premium) =====
usecase "UC45" as UC_VIEW_PREMIUM
usecase "UC46" as UC_SUBSCRIBE_PREMIUM

Member --> UC_VIEW_PREMIUM
Member --> UC_SUBSCRIBE_PREMIUM

%% ===== Quản trị (Administration) =====
usecase "UC47" as UC_ADMIN_DASHBOARD
usecase "UC48" as UC_MANAGE_USER
usecase "UC49" as UC_MODERATE_ART
usecase "UC50" as UC_MODERATE_COMMENT
usecase "UC51" as UC_MANAGE_TAG
usecase "UC52" as UC_MANAGE_PAYMENT
usecase "UC53" as UC_HANDLE_REPORT
usecase "UC54" as UC_CONFIG_AI

Admin --> UC_ADMIN_DASHBOARD
Admin --> UC_MANAGE_USER
Admin --> UC_MODERATE_ART
Admin --> UC_MODERATE_COMMENT
Admin --> UC_MANAGE_TAG
Admin --> UC_MANAGE_PAYMENT
Admin --> UC_HANDLE_REPORT
Admin --> UC_CONFIG_AI
```

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
