# Book Store Service — API Endpoints

> **Base URL:** `/api/book-service`  
> **Port:** 5001 (default)  
> **Cập nhật:** 2026-07-16

---

## Tổng quan Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|:----:|-------|
| **Books** | | | |
| GET | `/books` | ❌ | Danh sách sách (public) |
| GET | `/books/my-books` | ✅ | Sách của tôi (seller) |
| GET | `/books/:id` | ❌ | Chi tiết sách |
| POST | `/books` | ✅ | Đăng sách mới |
| PUT | `/books/:id` | ✅ | Cập nhật sách |
| DELETE | `/books/:id` | ✅ | Xóa sách |
| **Cart** | | | |
| GET | `/cart` | ✅ | Xem giỏ hàng |
| POST | `/cart` | ✅ | Thêm vào giỏ hàng |
| PUT | `/cart/:itemId` | ✅ | Cập nhật số lượng |
| DELETE | `/cart/:itemId` | ✅ | Xóa khỏi giỏ hàng |
| DELETE | `/cart` | ✅ | Xóa toàn bộ giỏ |
| **Orders** | | | |
| POST | `/orders` | ✅ | Tạo đơn hàng từ giỏ |
| GET | `/orders` | ✅ | Đơn hàng của tôi |
| GET | `/orders/seller` | ✅ | Đơn hàng bán (seller) |
| GET | `/orders/:id` | ✅ | Chi tiết đơn hàng |
| PATCH | `/orders/:id/status` | ✅ | Cập nhật trạng thái đơn |
| GET | `/orders/:id/download/:itemId` | ✅ | Tải ebook |
| **Checkout** | | | |
| POST | `/checkout` | ✅ | Tạo phiên Stripe Checkout |
| **Seller** | | | |
| POST | `/seller/become` | ✅ | Đăng ký seller |
| GET | `/seller/profile` | ✅ | Xem hồ sơ seller |
| PUT | `/seller/profile` | ✅ | Cập nhật hồ sơ seller |
| **Webhook** | | | |
| POST | `/webhook/stripe` | ❌ | Stripe webhook callback |
| **Health** | | | |
| GET | `/health` | ❌ | Health check |

---

## Chi tiết Request/Response

### Books

#### GET `/books`
Danh sách sách công khai với phân trang và bộ lọc.

**Query Parameters:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 12 | Số item mỗi trang |
| `status` | string | `published` | Trạng thái sách (draft/published/archived) |
| `minPrice` | number | - | Giá tối thiểu |
| `maxPrice` | number | - | Giá tối đa |
| `search` | string | - | Từ khóa tìm kiếm (tên, mô tả, thẻ) |
| `sort` | string | `newest` | Sắp xếp: `newest`, `price_asc`, `price_desc`, `bestselling` |

**Response 200:**
```json
{
  "data": [
    {
      "_id": "...",
      "title": "...",
      "price": 9.99,
      "coverImages": ["..."],
      "seller": { "_id": "...", "username": "...", "displayName": "...", "avatar": "..." },
      "soldCount": 42,
      "rating": 4.5,
      "tags": ["fiction", "mystery"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "pages": 9
  }
}
```

#### POST `/books`
Đăng sách mới (seller only).

**Request Body:** `multipart/form-data`
| Field | Type | Required | Mô tả |
|-------|------|:--------:|-------|
| `title` | string | ✅ | Tiêu đề sách |
| `description` | string | ❌ | Mô tả |
| `price` | number | ✅ | Giá bán |
| `originalPrice` | number | ❌ | Giá gốc |
| `stock` | number | ❌ | Tồn kho (-1 = unlimited) |
| `status` | string | ❌ | draft/published/archived |
| `tags` | string | ❌ | Thẻ (JSON array hoặc comma-separated) |
| `coverImage` | file | ❌ | Ảnh bìa |
| `ebookFile` | file | ✅ | File ebook |

**Response 201:** Object BOOK đầy đủ

---

### Cart

#### POST `/cart`
Thêm sách vào giỏ hàng.

**Request Body:**
```json
{
  "bookId": "ObjectId",
  "quantity": 1
}
```

**Response 200:** Cart populated với items

#### PUT `/cart/:itemId`
Cập nhật số lượng sản phẩm trong giỏ.

**Request Body:**
```json
{
  "quantity": 2
}
```

**Behavior:** Nếu quantity ≤ 0 → xóa sản phẩm khỏi giỏ

---

### Orders

#### POST `/orders`
Tạo đơn hàng từ giỏ hàng.

**Response 201:**
```json
{
  "_id": "...",
  "buyer": { "_id": "...", "username": "..." },
  "items": [
    {
      "book": "...",
      "title": "...",
      "price": 9.99,
      "quantity": 1,
      "seller": "...",
      "ebookFileUrl": "..."
    }
  ],
  "totalAmount": 9.99,
  "status": "pending",
  "paymentStatus": "pending"
}
```

**Side effects:** Xóa toàn bộ giỏ hàng sau khi tạo order

#### PATCH `/orders/:id/status`
Cập nhật trạng thái đơn hàng (seller/admin only).

**Request Body:**
```json
{
  "status": "fulfilled"
}
```

**Valid Transitions:**
| Từ | Đến |
|----|-----|
| pending | paid, cancelled |
| paid | fulfilled, refunded |

#### GET `/orders/:id/download/:itemId`
Tải file ebook (buyer only, đơn phải paid/fulfilled).

**Response 200:**
```json
{
  "downloadUrl": "https://..."
}
```

---

### Checkout

#### POST `/checkout`
Tạo phiên Stripe Checkout.

**Request Body:**
```json
{
  "orderId": "ObjectId"
}
```

**Response 200:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

### Seller

#### POST `/seller/become`
Đăng ký tài khoản người bán.

**Response 201:** SellerProfile object

#### PUT `/seller/profile`
Cập nhật hồ sơ seller.

**Request Body:**
```json
{
  "bio": "...",
  "payoutEmail": "..."
}
```

---

### Webhook

#### POST `/webhook/stripe`
Nhận callback từ Stripe sau thanh toán.

**Headers:** `stripe-signature` (Stripe verification)

**Events handled:**
- `checkout.session.completed` → Cập nhật order status thành `paid`
