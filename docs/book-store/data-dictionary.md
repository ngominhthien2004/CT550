# Book Store Service — Data Dictionary (Tiếng Việt)

> **Cập nhật:** 2026-07-16
> **Số thực thể:** 6
> **Số quan hệ:** 9
> **Mô tả:** Tài liệu tham chiếu chi tiết tất cả trường (field) của các Mongoose model trong Book Store Service

---

## Mục lục

### Thực thể

- [BOOK — Sách](#book)
- [CART — Giỏ hàng](#cart)
- [CART_ITEM — Sản phẩm trong giỏ](#cart_item)
- [ORDER — Đơn hàng](#order)
- [ORDER_ITEM — Sản phẩm trong đơn](#order_item)
- [SELLER_PROFILE — Hồ sơ người bán](#seller_profile)

### Quan hệ

- [Các quan hệ](#các-quan-hệ)

---

## BOOK — Sách

> Sản phẩm chính — sách điện tử được bán trên nền tảng

Thực thể **BOOK** lưu trữ thông tin sách điện tử bao gồm tiêu đề, mô tả, giá bán, file ebook, ảnh bìa và thông tin người bán.

| Trường         | Kiểu     | Ràng buộc | Mô tả                                                                 |
| -------------- | -------- | --------- | --------------------------------------------------------------------- |
| `_id`          | ObjectId | PK        | Mã sách (tự động sinh)                                                |
| `title`        | string   | UK        | Tiêu đề sách (bắt buộc, max 200 ký tự)                               |
| `description`  | string   | —         | Mô tả sách (mặc định '', max 5000 ký tự)                             |
| `price`        | number   | —         | Giá bán (bắt buộc, min 0)                                            |
| `originalPrice`| number   | —         | Giá gốc (nullable, dùng hiển thị giảm giá, min 0)                    |
| `stock`        | number   | —         | Số lượng tồn kho (mặc định -1 = không giới hạn, min -1)              |
| `coverImages`  | array    | —         | Danh sách URL ảnh bìa                                                |
| `ebookFile`    | json     | —         | Thông tin file ebook nhúng {url, publicId, originalName, mimeType, size} |
| `seller`       | ObjectId | FK        | Người bán (ref User)                                                  |
| `status`       | string   | —         | Trạng thái: draft | published | archived                              |
| `isActive`     | boolean  | —         | Soft delete flag (mặc định true)                                      |
| `soldCount`    | number   | —         | Số lượng đã bán (mặc định 0, min 0)                                   |
| `rating`       | number   | —         | Đánh giá trung bình (0-5)                                             |
| `reviewCount`  | number   | —         | Số lượt đánh giá (mặc định 0, min 0)                                  |
| `tags`         | array    | —         | Thẻ phân loại (lowercase, trimmed)                                    |
| `createdAt`    | datetime | —         | Thời điểm tạo sách                                                    |
| `updatedAt`    | datetime | —         | Thời điểm cập nhật gần nhất                                           |

### ebookFile (Embedded Object)

| Trường           | Kiểu   | Required | Mô tả                  |
| ---------------- | ------ |:--------:| ----------------------- |
| `url`            | String | ✅       | URL tải file           |
| `publicId`       | String | ✅       | ID trên Cloudinary     |
| `originalName`   | String | ❌       | Tên file gốc           |
| `mimeType`       | String | ❌       | Loại file (MIME type)  |
| `size`           | Number | ❌       | Kích thước file (bytes)|

---

## CART — Giỏ hàng

> Giỏ hàng của người dùng — mỗi user chỉ có một giỏ hàng

Thực thể **CART** lưu trữ giỏ hàng mua sắm của người dùng, chứa danh sách sản phẩm (CartItem) và thời gian cập nhật.

| Trường      | Kiểu     | Ràng buộc | Mô tả                               |
| ----------- | -------- | --------- | ----------------------------------- |
| `_id`       | ObjectId | PK        | Mã giỏ hàng (tự động sinh)          |
| `user`      | ObjectId | FK        | Chủ giỏ hàng (ref User, unique)     |
| `items`     | array    | —         | Danh sách sản phẩm (CartItem[])     |
| `updatedAt` | datetime | —         | Thời điểm cập nhật gần nhất         |

---

## CART_ITEM — Sản phẩm trong giỏ

> Object nhúng trong CART — mỗi item đại diện một sách trong giỏ

Thực thể **CART_ITEM** là embedded document trong CART, lưu trữ thông tin về một sản phẩm (sách) trong giỏ hàng.

| Trường     | Kiểu     | Ràng buộc | Mô tả                         |
| ---------- | -------- | --------- | ----------------------------- |
| `_id`      | ObjectId | PK        | Mã item (tự động sinh)        |
| `book`     | ObjectId | FK        | Sách được thêm vào giỏ (ref Book) |
| `quantity` | number   | —         | Số lượng (min 1, mặc định 1)  |
| `addedAt`  | datetime | —         | Thời điểm thêm vào giỏ        |

---

## ORDER — Đơn hàng

> Đơn hàng mua sách — chứa thông tin thanh toán và trạng thái

Thực thể **ORDER** lưu trữ đơn hàng mua sách, bao gồm danh sách sản phẩm, tổng tiền, trạng thái đơn hàng và thông tin thanh toán Stripe.

| Trường                | Kiểu     | Ràng buộc | Mô tả                                                      |
| --------------------- | -------- | --------- | ---------------------------------------------------------- |
| `_id`                 | ObjectId | PK        | Mã đơn hàng (tự động sinh)                                 |
| `buyer`               | ObjectId | FK        | Người mua (ref User)                                       |
| `items`               | array    | —         | Danh sách sản phẩm (OrderItem[])                            |
| `totalAmount`         | number   | —         | Tổng tiền đơn hàng (bắt buộc, min 0)                       |
| `currency`            | string   | —         | Đơn vị tiền tệ (mặc định 'usd')                            |
| `status`              | string   | —         | Trạng thái: pending | paid | fulfilled | cancelled | refunded |
| `paymentStatus`       | string   | —         | Trạng thái thanh toán: pending | paid | failed | refunded   |
| `stripeSessionId`     | string   | —         | ID phiên Stripe Checkout (mặc định '')                      |
| `stripePaymentIntentId`| string  | —         | ID Stripe PaymentIntent (mặc định '')                       |
| `metadata`            | json     | —         | Dữ liệu bổ sung (mặc định {})                              |
| `createdAt`           | datetime | —         | Thời điểm tạo đơn hàng                                     |
| `updatedAt`           | datetime | —         | Thời điểm cập nhật gần nhất                                |

### Order Status Flow

```
pending ──→ paid ──→ fulfilled
   │          │
   └──→ cancelled  └──→ refunded
```

### Payment Status Flow

```
pending ──→ paid
pending ──→ failed
paid ──→ refunded
```

---

## ORDER_ITEM — Sản phẩm trong đơn

> Object nhúng trong ORDER — mỗi item đại diện một sách đã mua (denormalized data)

Thực thể **ORDER_ITEM** là embedded document trong ORDER, lưu trữ thông tin sản phẩm tại thời điểm đặt hàng (denormalized từ Book).

| Trường         | Kiểu     | Ràng buộc | Mô tả                                       |
| -------------- | -------- | --------- | ------------------------------------------- |
| `_id`          | ObjectId | PK        | Mã item (tự động sinh)                      |
| `book`         | ObjectId | FK        | Sách liên kết (ref Book)                    |
| `title`        | string   | —         | Tên sách (denormalized từ Book)             |
| `coverImage`   | string   | —         | Ảnh bìa (denormalized từ Book)              |
| `price`        | number   | —         | Giá tại thời điểm đặt hàng (denormalized)   |
| `quantity`     | number   | —         | Số lượng (min 1)                             |
| `seller`       | ObjectId | FK        | Người bán (denormalized từ Book)            |
| `ebookFileUrl` | string   | —         | URL file ebook (denormalized từ Book)        |

---

## SELLER_PROFILE — Hồ sơ người bán

> Hồ sơ người bán — mỗi user chỉ có một seller profile

Thực thể **SELLER_PROFILE** lưu trữ thông tin hồ sơ người bán, bao gồm tiểu sử, email nhận tiền và thống kê bán hàng.

| Trường         | Kiểu     | Ràng buộc | Mô tả                                       |
| -------------- | -------- | --------- | ------------------------------------------- |
| `_id`          | ObjectId | PK        | Mã hồ sơ (tự động sinh)                     |
| `user`         | ObjectId | FK        | Chủ hồ sơ (ref User, unique)                |
| `bio`          | string   | —         | Tiểu sử người bán (mặc định '', max 1000 ký tự) |
| `payoutEmail`  | string   | —         | Email nhận tiền (lowercase, trimmed)          |
| `totalSales`   | number   | —         | Tổng số đơn bán (mặc định 0, min 0)          |
| `totalRevenue` | number   | —         | Tổng doanh thu (mặc định 0, min 0)           |
| `isVerified`   | boolean  | —         | Đã xác minh (mặc định false)                 |
| `createdAt`    | datetime | —         | Thời điểm tạo                                |
| `updatedAt`    | datetime | —         | Thời điểm cập nhật gần nhất                  |

---

## Các quan hệ

Mô hình dữ liệu Book Store Service gồm có 6 thực thể. Trong đó, thực thể **USER** (từ main backend) là thực thể trung tâm, với khoá chính là `_id`.

- **USER — BOOK**: Thực thể USER liên kết với thực thể BOOK (Sách) để cho biết người dùng nào bán những cuốn sách nào. Một người dùng có thể bán nhiều sách, và mỗi sách thuộc về một người bán.
- **USER — CART**: Thực thể USER liên kết với thực thể CART (Giỏ hàng) để cho biết mỗi người dùng có một giỏ hàng. Quan hệ 1-1.
- **USER — ORDER**: Thực thể USER liên kết với thực thể ORDER (Đơn hàng) để cho biết người dùng đặt những đơn hàng nào. Một người dùng có thể đặt nhiều đơn hàng.
- **USER — SELLER_PROFILE**: Thực thể USER liên kết với thực thể SELLER_PROFILE (Hồ sơ người bán) để cho biết thông tin hồ sơ bán hàng của người dùng. Quan hệ 1-1.
- **CART — CART_ITEM**: Thực thể CART liên kết với CART_ITEM (Sản phẩm trong giỏ) để quản lý danh sách sản phẩm trong giỏ hàng. Một giỏ hàng có nhiều sản phẩm.
- **CART_ITEM — BOOK**: CART_ITEM trỏ đến BOOK để xác định sách nào đang trong giỏ.
- **ORDER — ORDER_ITEM**: Thực thể ORDER liên kết với ORDER_ITEM (Sản phẩm trong đơn) để quản lý danh sách sản phẩm trong đơn hàng. Một đơn hàng có nhiều sản phẩm.
- **ORDER_ITEM — BOOK**: ORDER_ITEM trỏ đến BOOK (denormalized) để lưu trữ thông tin sách tại thời điểm đặt hàng.
- **ORDER_ITEM — USER (seller)**: ORDER_ITEM trỏ đến USER (seller) để xác định ai bán sản phẩm trong đơn.

### Denormalization Strategy

ORDER_ITEM lưu trữ dữ liệu được denormalize từ BOOK tại thời điểm đặt hàng:
- `title`, `coverImage`, `price`, `ebookFileUrl` — đảm bảo đơn hàng giữ nguyên dữ liệu ngay cả khi sách bị chỉnh sửa sau này.
- `seller` — lưu seller ID để seller có thể xem đơn hàng của mình mà không cần join với BOOK.
