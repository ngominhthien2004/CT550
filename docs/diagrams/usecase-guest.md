# Sơ đồ Use Case - Khách vãng lai (Guest)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** IlluWrl - Nền tảng chia sẻ tranh vẽ và manga (Pixiv-clone)  
> **Ngày:** 2026-06-08

## Tổng Quan

Biểu đồ dưới đây tập trung vào tác nhân **Khách vãng lai (Guest)** — người dùng chưa đăng nhập.
Guest có thể đăng ký tài khoản, đăng nhập (email hoặc Google OAuth), duyệt và khám phá nội dung,
và thực hiện tìm kiếm cơ bản. Sau khi đăng nhập/đăng ký, Guest trở thành Member.

```mermaid
---
title: Sơ đồ Use Case - Khách vãng lai (Guest)
---
---
config:
  useMaxWidth: true
---
actor "Khách vãng lai\n(Guest)" as Guest

%% Generalization: Guest mở rộng thành Member
actor "Thành viên\n(Member)" as Member
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
```

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
