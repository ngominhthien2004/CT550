# Sơ đồ Use Case - Quản trị viên (Admin)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** Book Store Service  
> **Ngày:** 2026-07-16

## Use Case Diagram - Admin

```mermaid
---
title: Use Case - Quản trị viên (Admin)
---
actor "Quản trị viên\n(Admin)" as Admin

%% === Admin Book Management ===
rectangle "Quản lý Sách (Admin)" {
  usecase "UC26: Quản lý tất cả sách" as UC26
  usecase "UC26a: Xem danh sách sách" as UC26a
  usecase "UC26b: Thay đổi trạng thái sách" as UC26b
  usecase "UC26c: Xóa sách" as UC26c
}

Admin --> UC26
UC26 --> UC26a
UC26 --> UC26b
UC26 --> UC26c

%% === Admin Order Management ===
rectangle "Quản lý Đơn hàng (Admin)" {
  usecase "UC27: Quản lý tất cả đơn hàng" as UC27
  usecase "UC27a: Xem danh sách đơn hàng" as UC27a
  usecase "UC27b: Cập nhật trạng thái đơn" as UC27b
  usecase "UC27c: Hoàn tiền" as UC27c
}

Admin --> UC27
UC27 --> UC27a
UC27 --> UC27b
UC27 --> UC27c

%% === Admin Seller Management ===
rectangle "Quản lý Người bán (Admin)" {
  usecase "UC28: Quản lý người bán" as UC28
  usecase "UC28a: Xem danh sách seller" as UC28a
  usecase "UC28b: Xác minh seller" as UC28b
}

Admin --> UC28
UC28 --> UC28a
UC28 --> UC28b
```

## Bảng mô tả chi tiết

| Use Case | Điều kiện tiên quyết | Mô tả | Kết quả |
|----------|----------------------|-------|---------|
| UC26a | Đăng nhập admin | Xem danh sách tất cả sách trong hệ thống | Hiển thị danh sách |
| UC26b | Đăng nhập admin | Thay đổi trạng thái sách (draft/published/archived) | Sách status updated |
| UC26c | Đăng nhập admin | Xóa (soft delete) bất kỳ sách nào | Sách archived |
| UC27a | Đăng nhập admin | Xem danh sách tất cả đơn hàng | Hiển thị danh sách |
| UC27b | Đăng nhập admin | Cập nhật trạng thái đơn hàng bất kỳ | Đơn hàng status updated |
| UC27c | Đăng nhập admin | Hoàn tiền cho đơn hàng (refunded) | Đơn hàng refunded |
| UC28a | Đăng nhập admin | Xem danh sách tất cả người bán | Hiển thị danh sách seller |
| UC28b | Đăng nhập admin | Xác minh tài khoản người bán (isVerified) | Seller verified |

## Phân quyền truy cập

| API Endpoint | Guest | Buyer | Seller | Admin |
|-------------|:-----:|:-----:|:------:|:-----:|
| GET /books | ✅ | ✅ | ✅ | ✅ |
| GET /books/:id | ✅ | ✅ | ✅ | ✅ |
| POST /books | ❌ | ❌ | ✅ | ✅ |
| PUT /books/:id | ❌ | ❌ | ✅* | ✅ |
| DELETE /books/:id | ❌ | ❌ | ✅* | ✅ |
| GET /cart | ❌ | ✅ | ✅ | ✅ |
| POST /cart | ❌ | ✅ | ✅ | ✅ |
| POST /orders | ❌ | ✅ | ✅ | ✅ |
| GET /orders | ❌ | ✅ | ✅ | ✅ |
| GET /orders/seller | ❌ | ❌ | ✅ | ✅ |
| PATCH /orders/:id/status | ❌ | ❌ | ✅* | ✅ |
| POST /checkout | ❌ | ✅ | ✅ | ✅ |
| POST /seller/become | ❌ | ✅ | ✅ | ✅ |

> *Chỉ khi là chủ sở hữu sách/đơn hàng
