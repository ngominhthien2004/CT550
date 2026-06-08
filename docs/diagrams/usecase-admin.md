# Sơ đồ Use Case - Quản trị viên (Admin)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** 2026-06-08

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Quản trị viên (Admin)**.
Admin kế thừa tất cả quyền của Member (và do đó kế thừa cả quyền của Guest).
Ngoài ra, Admin có các quyền đặc biệt để quản trị và kiểm duyệt hệ thống.

```mermaid
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
actor "Quản trị viên\n(Admin)" as Admin

%% Generalization: Admin kế thừa Member, Member kế thừa Guest
actor "Thành viên\n(Member)" as Member
actor "Khách vãng lai\n(Guest)" as Guest

Guest <|-- Member
Member <|-- Admin

%% === Administration ===
rectangle "Quản trị (Administration)" {
  usecase "UC47" as "Xem Dashboard tổng quan"
  usecase "UC48" as "Quản lý người dùng"
  usecase "UC49" as "Kiểm duyệt tác phẩm"
  usecase "UC50" as "Kiểm duyệt bình luận"
  usecase "UC51" as "Quản lý thẻ (tag)"
  usecase "UC52" as "Xử lý báo cáo vi phạm"
  usecase "UC52" as "Cấu hình AI"
}

Admin --> UC47
Admin --> UC48
Admin --> UC49
Admin --> UC50
Admin --> UC51
Admin --> UC52
Admin --> UC52

%% Quan hệ giữa các use case
UC48 ..> UC52 : <<include>>
UC49 ..> UC52 : <<include>>
UC50 ..> UC52 : <<include>>
```

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính | Trạng thái |
|-------|-------------|------------|-------------|------------|
| UC47 | Xem Dashboard tổng quan | Xem bảng KPI tổng quan: số người dùng, tác phẩm, request, báo cáo đang chờ xử lý | Admin | ✅ |
| UC48 | Quản lý người dùng | Xem danh sách, tìm kiếm người dùng; chỉnh sửa role (member/admin), isPremium status; khóa/mở khóa tài khoản | Admin | ✅ |
| UC49 | Kiểm duyệt tác phẩm | Xem danh sách tác phẩm (có bộ lọc), xem chi tiết, xóa tác phẩm vi phạm điều khoản | Admin | ✅ |
| UC50 | Kiểm duyệt bình luận | Xem danh sách bình luận, xóa bình luận vi phạm (spam, thù địch, nội dung người lớn) | Admin | ✅ |
| UC51 | Quản lý thẻ (tag) | Sửa tên/dịch thuật tag, khóa/mở khóa tag (ngăn sử dụng), gộp tag (merge), xóa tag | Admin | ✅ |
| UC52 | Cấu hình AI | Điều chỉnh threshold phát hiện AI (AI detection score), cấu hình model AI search, quản lý prompt template | Admin | ✅ |
