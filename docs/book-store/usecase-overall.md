# Sơ đồ Use Case Tổng Quát - Book Store Service

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** Book Store - Microservice mua bán sách điện tử trong IlluWrl  
> **Ngày:** 2026-07-16

## Tổng Quan

Biểu đồ dưới đây mô tả toàn bộ các use case của Book Store Service, bao gồm năm tác nhân (actors):
**Khách vãng lai (Guest)**, **Người mua (Buyer)**, **Người bán (Seller)**, **Quản trị viên (Admin)** và **Hệ thống thanh toán (Stripe)**.

```mermaid
---
title: Sơ đồ Use Case Tổng Quát - Book Store Service
---
%% Actors
actor "Khách vãng lai\n(Guest)" as Guest
actor "Người mua\n(Buyer)" as Buyer
actor "Người bán\n(Seller)" as Seller
actor "Quản trị viên\n(Admin)" as Admin
actor "Hệ thống thanh toán\n(Stripe)" as Stripe

%% Generalization: Buyer kế thừa Guest, Seller kế thừa Buyer, Admin kế thừa Seller
Guest <|-- Buyer
Buyer <|-- Seller
Seller <|-- Admin

%% === PACKAGE: Book Browsing ===
rectangle "Duyệt Sách (Book Browsing)" {
  usecase "UC01" as UC_LIST_BOOKS
  usecase "UC02" as UC_BOOK_DETAIL
  usecase "UC03" as UC_SEARCH_BOOKS
  usecase "UC04" as UC_FILTER_PRICE
}

Guest --> UC_LIST_BOOKS
Guest --> UC_BOOK_DETAIL
Guest --> UC_SEARCH_BOOKS
Guest --> UC_FILTER_PRICE

%% === PACKAGE: Cart Management ===
rectangle "Quản lý Giỏ hàng (Cart Management)" {
  usecase "UC05" as UC_VIEW_CART
  usecase "UC06" as UC_ADD_TO_CART
  usecase "UC07" as UC_UPDATE_CART_ITEM
  usecase "UC08" as UC_REMOVE_FROM_CART
  usecase "UC09" as UC_CLEAR_CART
}

Buyer --> UC_VIEW_CART
Buyer --> UC_ADD_TO_CART
Buyer --> UC_UPDATE_CART_ITEM
Buyer --> UC_REMOVE_FROM_CART
Buyer --> UC_CLEAR_CART

%% === PACKAGE: Order Management ===
rectangle "Quản lý Đơn hàng (Order Management)" {
  usecase "UC10" as UC_CREATE_ORDER
  usecase "UC11" as UC_VIEW_MY_ORDERS
  usecase "UC12" as UC_VIEW_ORDER_DETAIL
  usecase "UC13" as UC_DOWNLOAD_EBOOK
}

Buyer --> UC_CREATE_ORDER
Buyer --> UC_VIEW_MY_ORDERS
Buyer --> UC_VIEW_ORDER_DETAIL
Buyer --> UC_DOWNLOAD_EBOOK

%% === PACKAGE: Checkout & Payment ===
rectangle "Thanh toán (Checkout & Payment)" {
  usecase "UC14" as UC_CHECKOUT
  usecase "UC15" as UC_STRIPE_PAYMENT
  usecase "UC16" as UC_WEBHOOK_HANDLE
}

Buyer --> UC_CHECKOUT
UC_CHECKOUT --> Stripe : <<include>>
Stripe --> UC_WEBHOOK_HANDLE

%% === PACKAGE: Seller Management ===
rectangle "Quản lý Người bán (Seller Management)" {
  usecase "UC17" as UC_BECOME_SELLER
  usecase "UC18" as UC_VIEW_SELLER_PROFILE
  usecase "UC19" as UC_UPDATE_SELLER_PROFILE
  usecase "UC20" as UC_VIEW_MY_BOOKS
  usecase "UC21" as UC_VIEW_SELLER_ORDERS
}

Buyer --> UC_BECOME_SELLER
Seller --> UC_VIEW_SELLER_PROFILE
Seller --> UC_UPDATE_SELLER_PROFILE
Seller --> UC_VIEW_MY_BOOKS
Seller --> UC_VIEW_SELLER_ORDERS

%% === PACKAGE: Book Management (Seller) ===
rectangle "Quản lý Sách (Book Management)" {
  usecase "UC22" as UC_CREATE_BOOK
  usecase "UC23" as UC_UPDATE_BOOK
  usecase "UC24" as UC_DELETE_BOOK
}

Seller --> UC_CREATE_BOOK
Seller --> UC_UPDATE_BOOK
Seller --> UC_DELETE_BOOK

%% === PACKAGE: Order Status (Seller) ===
rectangle "Cập nhật Trạng thái Đơn hàng (Order Status)" {
  usecase "UC25" as UC_UPDATE_ORDER_STATUS
}

Seller --> UC_UPDATE_ORDER_STATUS

%% === PACKAGE: Administration ===
rectangle "Quản trị (Administration)" {
  usecase "UC26" as UC_ADMIN_MANAGE_BOOKS
  usecase "UC27" as UC_ADMIN_MANAGE_ORDERS
  usecase "UC28" as UC_ADMIN_MANAGE_SELLERS
}

Admin --> UC_ADMIN_MANAGE_BOOKS
Admin --> UC_ADMIN_MANAGE_ORDERS
Admin --> UC_ADMIN_MANAGE_SELLERS

%% Quan hệ include
UC_CHECKOUT ..> UC10 : <<include>>
UC_DOWNLOAD_EBOOK ..> UC12 : <<include>>
```

## Bảng Mô tả Use Case Chi Tiết

| Mã số | Tên Use Case | Mô tả ngắn | Actor chính |
|-------|-------------|------------|-------------|
| UC01 | Xem danh sách sách | Xem danh sách sách với phân trang, sắp xếp theo giá/mới nhất/bán chạy | Guest |
| UC02 | Xem chi tiết sách | Xem thông tin chi tiết sách (tác giả, giá, mô tả, file ebook) | Guest |
| UC03 | Tìm kiếm sách | Tìm kiếm sách theo từ khóa (tên, mô tả, thẻ) | Guest |
| UC04 | Lọc theo giá | Lọc sách theo khoảng giá (min/max) | Guest |
| UC05 | Xem giỏ hàng | Xem danh sách sách trong giỏ hàng | Buyer |
| UC06 | Thêm vào giỏ hàng | Thêm sách vào giỏ hàng (kiểm tra tồn kho) | Buyer |
| UC07 | Cập nhật số lượng | Thay đổi số lượng sách trong giỏ hàng | Buyer |
| UC08 | Xóa khỏi giỏ hàng | Xóa một sách khỏi giỏ hàng | Buyer |
| UC09 | Xóa giỏ hàng | Xóa toàn bộ giỏ hàng | Buyer |
| UC10 | Tạo đơn hàng | Tạo đơn hàng từ giỏ hàng, xóa giỏ hàng | Buyer |
| UC11 | Xem đơn hàng của tôi | Xem danh sách đơn hàng đã đặt | Buyer |
| UC12 | Xem chi tiết đơn hàng | Xem thông tin chi tiết một đơn hàng | Buyer |
| UC13 | Tải ebook | Tải file ebook sau khi thanh toán thành công | Buyer |
| UC14 | Thanh toán | Tạo phiên Stripe Checkout để thanh toán | Buyer |
| UC15 | Xử lý thanh toán Stripe | Xử lý callback từ Stripe sau thanh toán | Hệ thống |
| UC16 | Xử lý Webhook | Nhận thông báo thanh toán từ Stripe | Hệ thống |
| UC17 | Trở thành người bán | Đăng ký tài khoản người bán | Buyer |
| UC18 | Xem hồ sơ người bán | Xem thông tin hồ sơ người bán | Seller |
| UC19 | Cập nhật hồ sơ người bán | Chỉnh sửa bio, email nhận tiền | Seller |
| UC20 | Xem sách của tôi | Xem danh sách sách đã đăng | Seller |
| UC21 | Xem đơn hàng bán | Xem danh sách đơn hàng có sản phẩm của mình | Seller |
| UC22 | Đăng sách mới | Đăng sách mới (upload cover + file ebook) | Seller |
| UC23 | Cập nhật sách | Chỉnh sửa thông tin sách | Seller |
| UC24 | Xóa sách | Ẩn sách khỏi hệ thống (soft delete) | Seller |
| UC25 | Cập nhật trạng thái đơn | Cập nhật trạng thái đơn hàng (paid/fulfilled/cancelled/refunded) | Seller |
| UC26 | Quản lý sách | Quản lý tất cả sách trong hệ thống | Admin |
| UC27 | Quản lý đơn hàng | Quản lý tất cả đơn hàng | Admin |
| UC28 | Quản lý người bán | Quản lý tài khoản người bán | Admin |
