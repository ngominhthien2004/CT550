# Sơ đồ Use Case - Người bán (Seller)

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Hệ thống:** Book Store Service  
> **Ngày:** 2026-07-16

## Use Case Diagram - Seller

```mermaid
---
title: Use Case - Người bán (Seller)
---
actor "Người bán\n(Seller)" as Seller

%% === Seller Profile ===
rectangle "Hồ sơ Người bán" {
  usecase "UC18: Xem hồ sơ người bán" as UC18
  usecase "UC19: Cập nhật hồ sơ người bán" as UC19
}

Seller --> UC18
Seller --> UC19

%% === Book Management ===
rectangle "Quản lý Sách" {
  usecase "UC20: Xem sách của tôi" as UC20
  usecase "UC22: Đăng sách mới" as UC22
  usecase "UC23: Cập nhật sách" as UC23
  usecase "UC24: Xóa sách" as UC24
}

Seller --> UC20
Seller --> UC22
Seller --> UC23
Seller --> UC24

%% === Order Management ===
rectangle "Quản lý Đơn hàng" {
  usecase "UC21: Xem đơn hàng bán" as UC21
  usecase "UC25: Cập nhật trạng thái đơn" as UC25
}

Seller --> UC21
Seller --> UC25

%% Quan hệ
UC22 ..> UC20 : <<extend>>
UC23 ..> UC20 : <<extend>>
```

## Bảng mô tả chi tiết

| Use Case | Điều kiện tiên quyết | Mô tả | Kết quả |
|----------|----------------------|-------|---------|
| UC18 | Đăng nhập, đã là seller | Xem thông tin hồ sơ (bio, payout email, tổng bán, tổng doanh thu) | Hiển thị hồ sơ |
| UC19 | Đăng nhập, đã là seller | Cập nhật bio và email nhận tiền | Hồ sơ cập nhật |
| UC20 | Đăng nhập, đã là seller | Xem danh sách sách đã đăng (phân trang, lọc theo status) | Hiển thị danh sách sách |
| UC21 | Đăng nhập, đã là seller | Xem danh sách đơn hàng có sản phẩm của mình | Hiển thị đơn hàng bán |
| UC22 | Đăng nhập, đã là seller | Đăng sách mới: upload cover image + file ebook, điền thông tin | Sách created (status: draft/published) |
| UC23 | Đăng nhập, là chủ sách | Cập nhật thông tin sách (title, price, stock, status, tags, files) | Sách updated |
| UC24 | Đăng nhập, là chủ sách | Soft delete sách (isActive=false, status=archived) | Sách archived |
| UC25 | Đăng nhập, là seller trong đơn | Cập nhật trạng thái: pending→paid, pending→cancelled, paid→fulfilled, paid→refunded | Đơn hàng status updated |

## Trạng thái Đơn hàng (Order Status Flow)

```
pending ──→ paid ──→ fulfilled
   │          │
   └──→ cancelled  └──→ refunded
```

| Trạng thái | Mô tả | Người cập nhật |
|-----------|-------|-----------------|
| `pending` | Đơn hàng mới, chờ thanh toán | Hệ thống (khi tạo) |
| `paid` | Đã thanh toán thành công | Stripe Webhook / Admin |
| `fulfilled` | Đã giao hàng (seller xác nhận đã gửi ebook) | Seller |
| `cancelled` | Đơn hàng bị hủy | Seller / Admin |
| `refunded` | Đã hoàn tiền | Admin |
