# Sơ đồ Use Case - Thành viên (Member)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** 2026-06-10

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Thành viên (Member)** — người dùng đã đăng nhập.
Member kế thừa tất cả quyền của Guest và có thêm các quyền: quản lý hồ sơ, quản lý tác phẩm,
tương tác xã hội, ủy thác & thanh toán, tính năng AI và công cụ vẽ.

```mermaid
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
actor "Thành viên\n(Member)" as Member

%% Generalization: Member kế thừa từ Guest
actor "Khách vãng lai\n(Guest)" as Guest
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
  usecase "UC55" as "Báo cáo tác phẩm"
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
Member --> UC55

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

%% Quan hệ giữa các use case bổ sung
UC39 ..> UC41 : <<extend>>
UC43 ..> UC44 : <<extend>>
```

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
| UC55 | Báo cáo tác phẩm | Gửi báo cáo vi phạm cho một tác phẩm kèm lý do và mô tả | Member | ✅ |
