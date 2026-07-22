# Book Store — Feature Inventory & Roadmap

> **Last updated:** 2026-07-21
> **Project:** IlluWrl (CT550)
> **Service:** `book-service/` microservice + frontend `bookstore` module

---

## 1. Tổng quan (Overview)

Book Store là một microservice bán ebook kỹ thuật số trong IlluWrl, cho phép các nghệ sĩ (seller) đăng bán ebook và người mua (buyer) mua & tải xuống. 

- **Backend:** `book-service/` — Express 5 + Mongoose, chạy riêng trên port 5001
- **Frontend:** Module `bookstore` trong Vue 3 app với 9 views, 11 components, 1 Pinia store
- **Auth:** Chia sẻ JWT secret với main backend
- **Database:** Cùng MongoDB Atlas cluster, dùng collection riêng (`book_books`, `book_carts`, `book_orders`, `book_sellerprofiles`)
- **File storage:** Cloudinary (ảnh bìa + file ebook)
- **Thanh toán:** Stripe (checkout session + webhook)
- **Deployment:** Render — service `CT550-BookService`

---

## 2. Tính năng đã triển khai (Existing Features)

### 2.1 Backend (book-service)

| # | Tính năng | Endpoint / Files | Trạng thái | Ghi chú |
|---|-----------|-----------------|------------|---------|
| 1 | **Scaffolding server** | `server.js`, `index.js`, `package.json` | ✅ Hoàn thành | Express 5, CORS, rate limiter, helmet |
| 2 | **Kết nối MongoDB** | `config/db.js`, `config/env.js` | ✅ Hoàn thành | Dùng Google DNS, IPv4-first |
| 3 | **Stripe integration** | `config/stripe.js` | ✅ Hoàn thành | SDK init |
| 4 | **File upload (Cloudinary)** | `config/upload.js` | ✅ Hoàn thành | Multer + Cloudinary: cover image + ebook |
| 5 | **JWT Authentication** | `middlewares/auth.middleware.js` | ✅ Hoàn thành | `protect`, `optionalAuth`, `admin` |
| 6 | **Error handling** | `middlewares/error.middleware.js` | ✅ Hoàn thành | `errorHandler`, `notFound` |
| 7 | **Book model** | `models/Book.js` | ✅ Hoàn thành | `coverImages[]`, `ebookFile{}`, `originalPrice`, `stock`, `soldCount`, `isActive`, `tags`, `status` |
| 8 | **Cart model** | `models/Cart.js` | ✅ Hoàn thành | Embedded items với quantity |
| 9 | **Order model** | `models/Order.js` | ✅ Hoàn thành | Items snapshot, `stripeSessionId`, status machine, seller tracking |
| 10 | **SellerProfile model** | `models/SellerProfile.js` | ✅ Hoàn thành | `bio`, `payoutEmail`, `totalSales`, `totalRevenue` |
| 11 | **User model (shared)** | `models/User.js` | ✅ Hoàn thành | Dùng chung collection `users` với main backend |
| 12 | **Book CRUD** | `controllers/book.controller.js` | ✅ Hoàn thành | List (search/sort/filter/paginate), detail, create (upload), update, delete (soft), getMyBooks |
| 13 | **Cart CRUD** | `controllers/cart.controller.js` | ✅ Hoàn thành | Get, add, update quantity, remove, clear — có stock validation |
| 14 | **Order CRUD** | `controllers/order.controller.js` | ✅ Hoàn thành | Create order, order history, order detail, update status, seller orders, download URL |
| 15 | **Stripe Checkout** | `controllers/checkout.controller.js` | ✅ Hoàn thành | Tạo Stripe Checkout Session |
| 16 | **Stripe Webhook** | `controllers/webhook.controller.js` | ✅ Hoàn thành | Xử lý `checkout.session.completed` và `expired` — cập nhật stock, soldCount, doanh thu seller |
| 17 | **Seller management** | `controllers/seller.controller.js` | ✅ Hoàn thành | Get profile, update profile (bio, payoutEmail), become seller |
| 18 | **Health check** | `GET /api/book-service/health` | ✅ Hoàn thành | |
| 19 | **Tests** | `tests/book.service.test.js` | ✅ Hoàn thành | Node built-in test runner |
| 20 | **Proxy từ main backend** | `backend/server.js` | ✅ Hoàn thành | `http-proxy-middleware` cho `/api/book-service/*` |

### 2.2 Frontend

| # | Tính năng | Route / File | Trạng thái | Ghi chú |
|---|-----------|-------------|------------|---------|
| 1 | **Bookstore Home** | `/bookstore` — `BookstoreHomeView.vue` | ✅ Hoàn thành | Hero, tags cloud, featured section, search/filter, pagination |
| 2 | **Book Detail** | `/bookstore/:id` — `BookDetailView.vue` | ✅ Hoàn thành | Cover, seller info, giá, add-to-cart, mô tả, tags |
| 3 | **Book Upload/Edit** | `/bookstore/upload` — `BookUploadView.vue` | ✅ Hoàn thành | Form: title, description, price, stock, tags, cover, ebook file |
| 4 | **Book Management** | `/bookstore/manage` — `BookManageView.vue` | ✅ Hoàn thành | List own books, publish/unpublish, edit, delete |
| 5 | **Shopping Cart** | `/bookstore/cart` — `CartView.vue` | ✅ Hoàn thành | Item listing, quantity controls, remove, checkout button |
| 6 | **Order History** | `/bookstore/orders` — `OrderHistoryView.vue` | ✅ Hoàn thành | Orders with status badges, download paid books |
| 7 | **Seller Dashboard** | `/bookstore/seller` — `SellerDashboardView.vue` | ✅ Hoàn thành | Become seller, stats, manage orders |
| 8 | **Checkout Success** | `/bookstore/checkout/success` — `CheckoutSuccessView.vue` | ✅ Hoàn thành | |
| 9 | **Checkout Cancel** | `/bookstore/checkout/cancel` — `CheckoutCancelView.vue` | ✅ Hoàn thành | |
| 10 | **Bookstore Layout** | `BookstoreLayout.vue` | ✅ Hoàn thành | Sidebar + sticky top bar + main content |
| 11 | **BookStore TopBar** | `BookStoreTopBar.vue` | ✅ Hoàn thành | Search, brand, cart badge, user menu |
| 12 | **BookCard component** | `BookCard.vue` | ✅ Hoàn thành | Cover, title, seller, price, discount badge |
| 13 | **BookGrid component** | `BookGrid.vue` | ✅ Hoàn thành | Grid with skeleton loading |
| 14 | **BookSection component** | `BookSection.vue` | ✅ Hoàn thành | Section title + icon + "show more" |
| 15 | **BookFilterBar component** | `BookFilterBar.vue` | ✅ Hoàn thành | Search + sort + price range |
| 16 | **BookUploadForm component** | `BookUploadForm.vue` | ✅ Hoàn thành | Form logic |
| 17 | **AddToCartButton component** | `AddToCartButton.vue` | ✅ Hoàn thành | Quantity selector + add |
| 18 | **CartItem component** | `CartItem.vue` | ✅ Hoàn thành | Row with controls |
| 19 | **OrderItem component** | `OrderItem.vue` | ✅ Hoàn thành | Row with download button |
| 20 | **SellerBookRow component** | `SellerBookRow.vue` | ✅ Hoàn thành | Publish/unpublish, edit, delete |
| 21 | **Pinia store** | `stores/book.store.js` | ✅ Hoàn thành | Books, cart, orders, seller profile, all actions |
| 22 | **API client** | `services/book.api.js` | ✅ Hoàn thành | Axios, direct/proxy dual-mode |
| 23 | **Router integration** | `router/index.js` (8 routes) | ✅ Hoàn thành | Auth guards via `meta.requiresAuth` |
| 24 | **i18n** | 3 locale files (en/vi/ja) × 101 keys | ✅ Hoàn thành | |
| 25 | **Shared CSS** | `assets/styles/bookstore.css` (778 lines) | ✅ Hoàn thành | Responsive, custom properties |
| 26 | **Navigation** | AppTopBar link + BookstoreLayout sidebar | ✅ Hoàn thành | |
| 27 | **Vite proxy** | `vite.config.js` → `http://localhost:5001` | ✅ Hoàn thành | |

### 2.3 Tổng kết hiện trạng

- **Backend endpoints đã có:** 19 endpoints (health, 5 books, 5 cart, 6 orders, 3 seller)
- **Frontend views:** 9 views, 11 components
- **i18n:** 3 ngôn ngữ × 101 keys = 303 translations
- **CSS:** ~778 lines shared styles
- **Collection MongoDB:** 4 collections riêng (`book_books`, `book_carts`, `book_orders`, `book_sellerprofiles`) + shared `users`

---

## 3. Tính năng chưa triển khai (Missing / Planned)

Dựa trên spec gốc và phân tích codebase, các tính năng này **chưa được xây dựng**:

| # | Tính năng | Spec gốc | Mức độ ưu tiên | Ghi chú |
|---|-----------|---------|----------------|---------|
| 1 | **Reviews & Ratings** | ✅ Có trong spec | 🔴 Cao | Tạo Review model riêng trong book-service (user, book, rating 1-5★, content text) — CRUD đơn giản, zero coupling với main backend |
| 2 | **Payout system** | ✅ Có trong spec | 🟡 Trung bình | Không có `Payout` model — SellerProfile đã có `totalSales`/`totalRevenue` tracking |
| 3 | **Seller dashboard stats API** | ✅ Có trong spec | 🟡 Trung bình | Seller controller không có endpoint dashboard — seller dashboard UI có thể đang gọi order API |
| 4 | **Author field** | ✅ Có trong spec | 🟢 Thấp | Book model không có `author` field riêng |
| 5 | **Email service** | ✅ Có trong spec | 🟢 Thấp | `services/email.service.js` chưa tạo |

---

## 4. Đề xuất tính năng mới (Feature Suggestions)

### 4.1 Gợi ý từ spec gốc (ưu tiên cao)

| # | Tính năng | Mô tả | Giá trị mang lại |
|---|-----------|-------|-----------------|
| 1 | **⭐ Reviews & Ratings** | Người mua có thể đánh giá (1-5★) và viết nhận xét cho sách đã mua. Tạo Review model riêng trong book-service (user, book, rating, content). Frontend copy UI pattern từ ArtworkDetailCommentsCard.vue (star picker + textarea). Hiển thị rating trung bình trên BookCard và BookDetail. | Tăng trust, giúp người mua quyết định — là tính năng quan trọng nhất còn thiếu |
| 2 | **🏷️ Tag-based Categories** | Dùng tags hiện có để phân loại sách (Manga, Artbook, Novel...). Hiển thị tag cloud + filter by tag trên BookstoreHome. Không cần categories riêng. | Cải thiện UX navigation mà không cần thêm model/collection mới |
| 3 | **Payout / Withdrawal** | Seller yêu cầu rút tiền doanh thu. Admin phê duyệt. Track lịch sử payout. | Kiếm tiền thực tế cho seller — cần thiết cho production |
| 4 | **Seller dashboard API** | Endpoint `GET /api/seller/dashboard` trả về stats tổng hợp (doanh thu, số đơn, số sách, top sách bán chạy). | Seller cần dashboard để theo dõi kinh doanh |

### 4.2 Tính năng mở rộng (ưu tiên trung bình)

| # | Tính năng | Mô tả | Giá trị mang lại |
|---|-----------|-------|-----------------|
| 4 | **🔍 Advanced Search** | Search theo title + author + tags + description, filter theo format (PDF/EPUB), khoảng giá, rating | Người mua tìm đúng sách nhanh hơn |
| 5 | **📖 Ebook Reader (Online)** | Đọc sách online ngay trên browser (PDF.js / EPUB.js) — không cần tải về | Tăng tiện lợi, cạnh tranh với các nền tảng lớn |
| 6 | **🎁 Discount / Coupon System** | Tạo mã giảm giá, flash sale, discount phần trăm. Seller tự tạo coupon. | Tăng doanh số, marketing |
| 7 | **📚 Series / Collections** | Gom nhiều sách thành series (VD: "Manga Series Tập 1-5"), bán theo bundle với giá ưu đãi | Tăng doanh thu trung bình mỗi đơn |
| 8 | **🔔 Wishlist / Follow Seller** | Người dùng thêm sách vào wishlist, follow seller để nhận thông báo khi có sách mới | Retention, re-engagement |
| 9 | **📊 Seller Analytics** | Biểu đồ doanh thu theo thời gian, top sách, conversion rate, traffic | Seller cần data để tối ưu kinh doanh |
| 10 | **📱 Sample / Preview** | Cho phép seller upload vài trang mẫu, người mua xem trước trước khi mua | Tăng conversion rate |
| 11 | **💰 Multiple Currencies** | Hiển thị giá bằng VND, JPY, USD tuỳ theo locale | Quốc tế hóa |

### 4.3 Tính năng "Nice-to-have" (ưu tiên thấp)

| # | Tính năng | Mô tả |
|---|-----------|-------|
| 13 | **📨 Email notifications** | Gửi email xác nhận đơn hàng, thông báo sách mới từ seller đã follow (dùng SendGrid / Mailgun) |
| 14 | **🛍️ Gift purchase** | Mua sách làm quà tặng, gửi qua email cho người nhận |
| 15 | **📱 Mobile responsive optimization** | Tối ưu hoàn toàn mobile cho tất cả bookstore views |
| 16 | **🌐 SEO for bookstore pages** | Meta tags, JSON-LD structured data, sitemap cho sách |
| 17 | **🔗 Share / Social links** | Chia sẻ sách lên mạng xã hội với preview card |
| 18 | **📥 Batch download** | Tải nhiều sách cùng lúc (ZIP) cho đơn hàng nhiều items |
| 19 | **⭐ Recommended books (AI)** | Gợi ý sách dựa trên lịch sử mua (có thể dùng AI / collaborative filtering) |
| 20 | **📝 Book description formatting** | Hỗ trợ Markdown / rich text cho mô tả sách |
| 21 | **🔐 DRM / Watermarking** | Nhúng watermark vào file PDF trước khi download (tên người mua) |
| 22 | **📊 Admin panel** | Quản lý tất cả sách, đơn hàng, seller, payout từ admin dashboard |
| 23 | **🛡️ Review moderation** | Admin kiểm duyệt đánh giá trước khi hiển thị |
| 24 | **🚚 Automated payouts** | Tự động chuyển tiền cho seller hàng tháng qua Stripe Connect |

---

## 5. API Endpoints Map (Complete)

Tất cả endpoint được prefix bởi `/api/book-service`:

### Books
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/health` | No | Health check |
| GET | `/books` | No | List books (search, sort, price filter, paginate) |
| GET | `/books/my-books` | Protect | Seller's own books |
| GET | `/books/:id` | No | Book detail |
| POST | `/books` | Protect | Create book (multipart) |
| PUT | `/books/:id` | Protect | Update book |
| DELETE | `/books/:id` | Protect | Soft-delete book |

### Cart
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/cart` | Protect | Get cart |
| POST | `/cart` | Protect | Add to cart |
| PUT | `/cart/:itemId` | Protect | Update quantity |
| DELETE | `/cart/:itemId` | Protect | Remove item |
| DELETE | `/cart` | Protect | Clear cart |

### Orders
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/orders` | Protect | Create order from cart |
| GET | `/orders` | Protect | My orders |
| GET | `/orders/seller` | Protect | Seller's orders |
| GET | `/orders/:id` | Protect | Order detail |
| PATCH | `/orders/:id/status` | Protect | Update order status |
| GET | `/orders/:id/download/:itemId` | Protect | Download URL |

### Checkout
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/checkout` | Protect | Create Stripe session |

### Webhook
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/webhook` | Raw body | Stripe webhook |

### Seller
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/seller/profile` | Protect | Get seller profile |
| PUT | `/seller/profile` | Protect | Update profile |
| POST | `/seller/become` | Protect | Register as seller |

---

## 6. Database Collections

| Collection | Model | Mô tả | Documents |
|------------|-------|-------|-----------|
| `book_books` | `Book` | Ebooks with cover images, file URLs, pricing, seller, tags | — |
| `book_carts` | `Cart` | Per-user shopping carts | — |
| `book_orders` | `Order` | Purchase orders with items, Stripe info, status | — |
| `book_sellerprofiles` | `SellerProfile` | Seller bio, payout info, revenue tracking | — |
| `users` | `User` | Shared with main backend | — |

---

## 7. Kết luận (Conclusion)

### Hiện trạng: ✅ MVP hoàn chỉnh
- Backend microservice đầy đủ với 19 endpoints
- Frontend 9 views + 11 components + store + i18n
- Stripe payment flow hoàn chỉnh
- Seller management cơ bản

### Nên phát triển tiếp (Recommendations):

**P0 — Phải làm ngay:**
1. **Reviews & Ratings** — tính năng quan trọng nhất còn thiếu từ spec, ảnh hưởng trực tiếp đến quyết định mua hàng

**P1 — Nên làm sớm:**
2. **Payout system** — cho seller rút tiền
3. **Tag-based navigation** — cải thiện filter/tag cloud trên Bookstore Home, xài tags có sẵn thay vì tạo categories riêng
4. **Seller Dashboard API** — hoàn thiện spec còn thiếu

**P2 — Làm sau:**
5. Online reader, Discount system, Wishlist, Seller Analytics

**P3 — Nice-to-have:**
6. Email notifications, Gift purchase, SEO, Batch download, AI recommendations

---

## 8. Kiến trúc quyết định (Architecture Decisions)

### AD-1: Review Model riêng trong book-service

**Quyết định:** Tạo một **Review model self-contained** trong `book-service/` thay vì mở rộng Comment system gốc hay tạo Rating model riêng rẽ.

**Model:**
```
Review {
  user: ObjectId → User (required)
  book: ObjectId → Book (required)
  rating: Number (1-5, required)
  content: String (optional, max 2000)
  createdAt: Date
  updatedAt: Date
}
```
Unique compound index: `{ user: 1, book: 1 }` — mỗi user chỉ review một lần mỗi sách.

**API:**
| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/book-service/books/:id/reviews` | No | List reviews for a book (populated user) |
| POST | `/api/book-service/books/:id/reviews` | Protect | Create review (rating required, content optional) |
| PUT | `/api/book-service/reviews/:id` | Protect (owner) | Update review |
| DELETE | `/api/book-service/reviews/:id` | Protect (owner/admin) | Delete review |

**Frontend:**
- Copy UI pattern từ `ArtworkDetailCommentsCard.vue`
- Star picker (5★) + textarea cho content
- Hiển thị average rating trên BookCard + BookDetail
- Update rating average trên Book model khi review thay đổi (aggregate)

**So với các approaches khác:**
| Approach | Coupling | Complexity | Tính tận dụng |
|----------|----------|------------|---------------|
| Sửa Comment model gốc thêm rating | 🔴 Cao (sửa main backend) | 🟡 Trung bình | Cao (moderation, report, reply có sẵn) |
| Rating model + dùng Comment DB | 🟡 Trung bình (share DB) | 🔴 Cao (2 writes, consistency) | Cao |
| **Review model riêng (chọn)** | ✅ **Zero** | 🟢 **Thấp nhất** | 🟡 Copy UI pattern |

### AD-2: Không xây Categories riêng — dùng Tags

**Quyết định:** Không tạo `categories` field riêng cho Book model. Sử dụng tags hiện có để phân loại.

**Lý do:**
- Tags đã hỗ trợ search, filter, tag cloud
- Book model đã có `tags: [String]`
- Frontend BookstoreHomeView đã có tags cloud
- Giảm complexity, tránh duplicate dữ liệu

**Cải tiến có thể làm:**
- Thêm "Suggested tags" khi upload sách
- Cải thiện tag cloud UI với kích thước động
- Filter by tag trên Bookstore Home
