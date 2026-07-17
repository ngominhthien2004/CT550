# Sơ đồ Use Case - Người mua (Buyer)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** Book Store Service  
> **Ngày:** 2026-07-16

## Use Case Diagram - Buyer

```mermaid
---
title: Use Case - Người mua (Buyer)
---
actor "Người mua\n(Buyer)" as Buyer
actor "Hệ thống thanh toán\n(Stripe)" as Stripe

%% === Browse Books ===
rectangle "Duyệt Sách" {
  usecase "UC01: Xem danh sách sách" as UC01
  usecase "UC02: Xem chi tiết sách" as UC02
  usecase "UC03: Tìm kiếm sách" as UC03
  usecase "UC04: Lọc theo giá" as UC04
}

Buyer --> UC01
Buyer --> UC02
Buyer --> UC03
Buyer --> UC04

%% === Cart ===
rectangle "Giỏ hàng" {
  usecase "UC05: Xem giỏ hàng" as UC05
  usecase "UC06: Thêm vào giỏ hàng" as UC06
  usecase "UC07: Cập nhật số lượng" as UC07
  usecase "UC08: Xóa khỏi giỏ hàng" as UC08
  usecase "UC09: Xóa giỏ hàng" as UC09
}

Buyer --> UC05
Buyer --> UC06
Buyer --> UC07
Buyer --> UC08
Buyer --> UC09

%% === Orders ===
rectangle "Đơn hàng" {
  usecase "UC10: Tạo đơn hàng" as UC10
  usecase "UC11: Xem đơn hàng của tôi" as UC11
  usecase "UC12: Xem chi tiết đơn hàng" as UC12
  usecase "UC13: Tải ebook" as UC13
}

Buyer --> UC10
Buyer --> UC11
Buyer --> UC12
Buyer --> UC13

%% === Checkout ===
rectangle "Thanh toán" {
  usecase "UC14: Thanh toán Stripe" as UC14
}

Buyer --> UC14
UC14 --> Stripe : <<include>>

%% === Seller Profile ===
rectangle "Hồ sơ người bán" {
  usecase "UC17: Trở thành người bán" as UC17
}

Buyer --> UC17

%% Quan hệ
UC10 ..> UC05 : <<include>>
UC13 ..> UC12 : <<include>>
UC14 ..> UC10 : <<include>>
```

## Bảng mô tả chi tiết

| Use Case | Điều kiện tiên quyết | Mô tả | Kết quả |
|----------|----------------------|-------|---------|
| UC01 | Không có | Xem danh sách sách phân trang, sắp xếp theo giá/mới nhất/bán chạy | Hiển thị danh sách sách |
| UC02 | Không có | Xem thông tin chi tiết sách (tên, tác giả, giá, mô tả, cover, ebook preview) | Hiển thị chi tiết sách |
| UC03 | Không có | Nhập từ khóa, tìm sách theo tên/mô tả/thẻ | Hiển thị kết quả tìm kiếm |
| UC04 | Không có | Nhập khoảng giá min/max để lọc sách | Hiển thị sách trong khoảng giá |
| UC05 | Đăng nhập | Xem danh sách sách trong giỏ hàng với tổng tiền | Hiển thị giỏ hàng |
| UC06 | Đăng nhập, sách tồn kho > 0 | Thêm sách vào giỏ hàng (nếu đã có thì cộng số lượng) | Giỏ hàng cập nhật |
| UC07 | Đăng nhập, có sản phẩm trong giỏ | Thay đổi số lượng sách (nếu = 0 thì xóa) | Giỏ hàng cập nhật |
| UC08 | Đăng nhập, có sản phẩm trong giỏ | Xóa một sách khỏi giỏ hàng | Giỏ hàng cập nhật |
| UC09 | Đăng nhập, có sản phẩm trong giỏ | Xóa toàn bộ giỏ hàng | Giỏ hàng trống |
| UC10 | Đăng nhập, giỏ hàng không trống | Tạo đơn hàng từ giỏ hàng, kiểm tra tồn kho, xóa giỏ hàng | Đơn hàng created, giỏ hàng xóa |
| UC11 | Đăng nhập | Xem danh sách đơn hàng đã đặt | Hiển thị lịch sử đơn hàng |
| UC12 | Đăng nhập, là chủ đơn hàng | Xem chi tiết đơn hàng (sản phẩm, tổng tiền, trạng thái) | Hiển thị chi tiết đơn |
| UC13 | Đăng nhập, là chủ đơn, đơn đã thanh toán | Tải file ebook từ URL đã lưu | Download file ebook |
| UC14 | Đăng nhập, đơn hàng pending | Tạo phiên Stripe Checkout, chuyển hướng đến Stripe | Redirect đến Stripe |
| UC17 | Đăng nhập | Đăng ký tài khoản người bán (tạo SellerProfile) | Trở thành seller |
