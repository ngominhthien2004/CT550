# Book Store Service — MongoDB Schema (Tiếng Việt)

> **Cập nhật:** 2026-07-16
> **Số collection:** 4 (book_books, book_carts, book_orders, book_sellerprofiles)
> **Mô tả:** Chi tiết các collection trong MongoDB của Book Store Service, bao gồm kiểu dữ liệu, khoá chính, khoá ngoại, ràng buộc Not Null và diễn giải.

---

## BOOK — Sách

> Collection: `book_books`

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã sách (tự động sinh) |
| `title` | string |  |  | X | Tiêu đề sách (bắt buộc, max 200 ký tự) |
| `description` | string |  |  |  | Mô tả sách (mặc định '', max 5000 ký tự) |
| `price` | number |  |  | X | Giá bán (bắt buộc, min 0) |
| `originalPrice` | number |  |  |  | Giá gốc (nullable, min 0) |
| `stock` | number |  |  |  | Số lượng tồn kho (mặc định -1 = không giới hạn, min -1) |
| `coverImages` | array |  |  |  | Danh sách URL ảnh bìa |
| `ebookFile.url` | string |  |  | X | URL tải file ebook |
| `ebookFile.publicId` | string |  |  | X | ID trên Cloudinary |
| `ebookFile.originalName` | string |  |  |  | Tên file gốc |
| `ebookFile.mimeType` | string |  |  |  | Loại file (MIME type) |
| `ebookFile.size` | number |  |  |  | Kích thước file (bytes) |
| `seller` | objectId |  | X | X | Người bán (ref User) |
| `status` | string |  |  |  | Trạng thái: draft | published | archived |
| `isActive` | boolean |  |  |  | Soft delete flag (mặc định true) |
| `soldCount` | number |  |  |  | Số lượng đã bán (mặc định 0, min 0) |
| `rating` | number |  |  |  | Đánh giá trung bình (0-5) |
| `reviewCount` | number |  |  |  | Số lượt đánh giá (mặc định 0, min 0) |
| `tags` | array |  |  |  | Thẻ phân loại (lowercase, trimmed) |
| `createdAt` | date |  |  |  | Thời điểm tạo sách |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

---

## CART — Giỏ hàng

> Collection: `book_carts`

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã giỏ hàng (tự động sinh) |
| `user` | objectId |  | X | X | Chủ giỏ hàng (ref User, unique) |
| `items` | array |  |  |  | Danh sách sản phẩm (CartItem[]) |
| `items[].book` | objectId |  | X | X | Sách trong giỏ (ref Book) |
| `items[].quantity` | number |  |  |  | Số lượng (min 1, mặc định 1) |
| `items[].addedAt` | date |  |  |  | Thời điểm thêm vào giỏ |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

---

## ORDER — Đơn hàng

> Collection: `book_orders`

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã đơn hàng (tự động sinh) |
| `buyer` | objectId |  | X | X | Người mua (ref User) |
| `items` | array |  |  | X | Danh sách sản phẩm (OrderItem[]) |
| `items[].book` | objectId |  | X | X | Sách liên kết (ref Book) |
| `items[].title` | string |  |  |  | Tên sách (denormalized từ Book) |
| `items[].coverImage` | string |  |  |  | Ảnh bìa (denormalized từ Book) |
| `items[].price` | number |  |  |  | Giá tại thời điểm đặt hàng (denormalized) |
| `items[].quantity` | number |  |  |  | Số lượng (min 1) |
| `items[].seller` | objectId |  | X | X | Người bán (denormalized từ Book) |
| `items[].ebookFileUrl` | string |  |  |  | URL file ebook (denormalized từ Book) |
| `totalAmount` | number |  |  | X | Tổng tiền đơn hàng (min 0) |
| `currency` | string |  |  |  | Đơn vị tiền tệ (mặc định 'usd') |
| `status` | string |  |  |  | Trạng thái: pending | paid | fulfilled | cancelled | refunded |
| `paymentStatus` | string |  |  |  | Trạng thái thanh toán: pending | paid | failed | refunded |
| `stripeSessionId` | string |  |  |  | ID phiên Stripe Checkout |
| `stripePaymentIntentId` | string |  |  |  | ID Stripe PaymentIntent |
| `metadata` | object |  |  |  | Dữ liệu bổ sung (flexible payload) |
| `createdAt` | date |  |  |  | Thời điểm tạo đơn hàng |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

---

## SELLER_PROFILE — Hồ sơ người bán

> Collection: `book_sellerprofiles`

| Tên thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | NN | Diễn giải |
|----------------|-------------|:----------:|:----------:|:--:|-----------|
| `_id` | objectId | X |  | X | Mã hồ sơ (tự động sinh) |
| `user` | objectId |  | X | X | Chủ hồ sơ (ref User, unique) |
| `bio` | string |  |  |  | Tiểu sử người bán (mặc định '', max 1000 ký tự) |
| `payoutEmail` | string |  |  |  | Email nhận tiền (lowercase, trimmed) |
| `totalSales` | number |  |  |  | Tổng số đơn bán (mặc định 0, min 0) |
| `totalRevenue` | number |  |  |  | Tổng doanh thu (mặc định 0, min 0) |
| `isVerified` | boolean |  |  |  | Đã xác minh (mặc định false) |
| `createdAt` | date |  |  |  | Thời điểm tạo |
| `updatedAt` | date |  |  |  | Thời điểm cập nhật gần nhất |

---

## Collection Naming Convention

| Model | Collection Name | Prefix |
|-------|-----------------|--------|
| Book | `book_books` | `book_` |
| Cart | `book_carts` | `book_` |
| Order | `book_orders` | `book_` |
| SellerProfile | `book_sellerprofiles` | `book_` |

> **Lưu ý:** Book Store Service dùng chung database `CT550` với main backend. Tất cả collections có prefix `book_` để tránh trùng tên.

---

## Indexes

### book_books

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | default | Primary key |
| `seller` | single | Tìm sách theo người bán |
| `status` + `isActive` | compound | Lọc sách published/active |
| `price` | single | Lọc/sắp xếp theo giá |
| `soldCount` | single | Sắp xếp bán chạy |
| `tags` | single | Tìm theo thẻ |
| `title` | text | Full-text search |

### book_carts

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | default | Primary key |
| `user` | unique | Mỗi user chỉ có 1 giỏ hàng |

### book_orders

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | default | Primary key |
| `buyer` | single | Tìm đơn hàng theo người mua |
| `items.seller` | single | Tìm đơn hàng theo người bán |
| `stripeSessionId` | single | Tìm đơn hàng theo Stripe session |
| `status` | single | Lọc theo trạng thái |
| `createdAt` | single | Sắp xếp theo thời gian |

### book_sellerprofiles

| Field | Type | Mô tả |
|-------|------|-------|
| `_id` | default | Primary key |
| `user` | unique | Mỗi user chỉ có 1 seller profile |

---

## Denormalization trong ORDER_ITEM

ORDER_ITEM lưu trữ dữ liệu được copy từ BOOK tại thời điểm đặt hàng:

| Field | Nguồn | Lý do denormalize |
|-------|-------|-------------------|
| `title` | Book.title | Giữ nguyên tên sách ngay cả khi seller sửa sau |
| `coverImage` | Book.coverImages[0] | Giữ nguyên ảnh bìa tại thời điểm mua |
| `price` | Book.price | Giữ nguyên giá tại thời điểm mua (quan trọng cho accounting) |
| `ebookFileUrl` | Book.ebookFile.url | Lưu URL download ebook tại thời điểm mua |
| `seller` | Book.seller | Seller ID để query đơn hàng bán mà không cần join Book |
