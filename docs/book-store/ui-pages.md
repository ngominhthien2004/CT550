# Giao diện Người dùng — Book Store (Microservice)

## Tổng quan

Book Store là microservice trong IlluWrl cho phép người dùng mua bán sách điện tử (e-book). Module này có layout riêng (`BookstoreLayout`) — không sử dụng `MainLayoutTemplate` của hệ thống chính. Tất cả các trang bookstore đều được lazy-load để tối ưu bundle size.

## Layout: BookstoreLayout

Layout riêng của bookstore với:
- **Topbar**: Logo "IlluWrl Book Store" + điều hướng (Browse, Cart, Orders, Seller Dashboard).
- **Nội dung chính**: Vùng container trung tâm.
- **Footer**: Thông tin cơ bản.

## Danh sách trang

| Route | Tên View | Yêu cầu | Bố cục |
|-------|----------|---------|--------|
| `/bookstore` | BookstoreHomeView | Không | BookstoreLayout |
| `/bookstore/:id` | BookDetailView | Không | BookstoreLayout |
| `/bookstore/upload` | BookUploadView | Đăng nhập | BookstoreLayout |
| `/bookstore/manage` | BookManageView | Đăng nhập | BookstoreLayout |
| `/bookstore/cart` | CartView | Đăng nhập | BookstoreLayout |
| `/bookstore/orders` | OrderHistoryView | Đăng nhập | BookstoreLayout |
| `/bookstore/seller` | SellerDashboardView | Đăng nhập | BookstoreLayout |
| `/bookstore/checkout/success` | CheckoutSuccessView | Không | BookstoreLayout |
| `/bookstore/checkout/cancel` | CheckoutCancelView | Không | BookstoreLayout |

---

## 1. Trang chủ Bookstore (BookstoreHomeView)

### Tổng quan

`BookstoreHomeView` là trang landing của bookstore — hiển thị sách nổi bật, tìm kiếm và danh mục.

### Cấu trúc trang

#### Hero Section
- Hai cột: 
  - **Trái**: Tiêu đề "Discover and buy digital books from creators", mô tả ngắn, 2 CTA buttons:
    - "Explore books" — xem danh sách sách.
    - "Sell a book" — đến `/bookstore/upload`.
  - **Phải**: Decorative stacked tiles với icon sách.

#### Popular Tags
- Component `<TagStrip>` variant "button".
- Click tag → set tag làm bộ lọc tìm kiếm.

#### Featured Section
- Component `<BookSection>`: Hiển thị 10 sách đầu tiên với icon lửa (🔥).

#### Filter Bar
- Component `<BookFilterBar>` với v-model:
  - **Search**: Tìm kiếm theo tên sách.
  - **Sort**: Sắp xếp (price, date, popularity).
  - **Price range**: Khoảng giá (min - max).

#### Filtered Results
- Component `<BookGrid>`: Hiển thị kết quả khi search/price filter active.
- Bootstrap pagination.

#### Sell CTA Section
- "Sell your work on IlluWrl Book Store!" + link đến `/bookstore/upload`.

### Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Spinner |
| **Empty** | "No books found" |
| **Error** | Alert thông báo lỗi |

---

## 2. Trang Chi tiết Sách (BookDetailView)

### Tổng quan

`BookDetailView` hiển thị thông tin chi tiết của một cuốn sách.

### Cấu trúc trang

- **Loading/Error state**: Spinner / error alert.
- **Two-column detail grid** (`<div class="detail-grid">`):
  - **Trái**: Cover image (tỷ lệ 2:3).
  - **Phải**: 
    - Title (tiêu đề sách).
    - Seller pill: Avatar + tên seller (click → profile).
    - Price: Giá hiện tại + giá gốc gạch ngang (nếu có giảm giá).
    - Stock status: "Unlimited" (không giới hạn) hoặc số lượng cụ thể.
    - Component `<AddToCartButton>`: Disabled nếu sách chưa published.
    - Description: Mô tả sách.
    - Tags: Dạng chip.

### Responsive

| Kích thước | Hành vi |
|------------|---------|
| ≥ 768px    | Two-column grid |
| < 768px    | Single column (stack) |

---

## 3. Trang Upload Sách (BookUploadView)

### Tổng quan

`BookUploadView` cho phép seller tải lên sách mới hoặc chỉnh sửa sách hiện tại (qua query param `?edit=:id`).

### Cấu trúc trang

- **Title**: "Upload E-book" (tạo mới) hoặc "Edit Book" (chỉnh sửa).
- **Subtitle**: Text hướng dẫn.
- **Seller error alert**: Cảnh báo vàng nếu seller profile chưa tồn tại.
- **Component `<BookUploadForm>`**: 
  - Props: `initialBook` (chế độ edit), `loading`.
  - Emit: `submit` (dữ liệu form).
- Container max-width 900px.

### Trạng thái

| Trạng thái | Hiển thị |
|------------|----------|
| **Loading** | Spinner trong form |
| **Saving** | Submit button disabled |
| **Success** | Toast + redirect |
| **Error** | Toast lỗi + giữ form |

---

## 4. Trang Quản lý Sách (BookManageView)

### Tổng quan

`BookManageView` cho phép seller quản lý danh sách sách của mình.

### Cấu trúc trang

- **Header**: "My Books" + nút "Upload new" (→ `/bookstore/upload`).
- **Error/Loading/Empty states**:
  - Empty: Icon sách + "Upload your first book" link.
- **Book list** (`<div class="book-list">`): Component `<SellerBookRow>` cho mỗi sách.
  - Events: `@updated`, `@deleted` → reload danh sách.

---

## 5. Trang Giỏ hàng (CartView)

### Tổng quan

`CartView` hiển thị giỏ hàng của người dùng.

### Cấu trúc trang

- **Loading**: Spinner.
- **Empty**: "Your cart is empty" + "Browse books" link.
- **Cart items** (`<div class="cart-list">`): Component `<CartItem>` cho mỗi item.
- **Cart summary**:
  - Tổng số item + tổng tiền ($).
  - "Clear cart" button (xoá giỏ hàng).
  - "Checkout" button (→ payment URL).

---

## 6. Trang Lịch sử Đơn hàng (OrderHistoryView)

### Tổng quan

`OrderHistoryView` hiển thị danh sách đơn hàng đã đặt.

### Cấu trúc trang

- **Error/Loading/Empty states**:
  - Empty: Icon receipt + "You haven't placed any orders yet".
- **Accordion-style order list**: Mỗi đơn hàng là thẻ clickable:
  - **Header**: Order ID (8 ký tự cuối), formatted date, status badge, total amount, chevron icon (xoay khi expand).
  - **Body** (mở rộng khi click): Component `<OrderItem>` cho mỗi item.
    - Nút download khi status là `completed` hoặc `paid`.

---

## 7. Trang Seller Dashboard (SellerDashboardView)

### Tổng quan

`SellerDashboardView` là trang tổng quan cho seller — thống kê doanh thu và quản lý đơn hàng.

### Cấu trúc trang

#### Not a Seller
- Onboarding card: Icon store + "Become a Seller" + "Start Selling" button.

#### Is a Seller
- **Stats grid**:
  - Revenue (`$X.XX`).
  - Books Sold (số lượng).
  - Orders (số đơn).
- **Dashboard actions**: "New book" (→ `/bookstore/upload`) + "Manage books" (→ `/bookstore/manage`).
- **Orders section**: "Orders containing your books".
- **Accordion order cards** (giống OrderHistoryView):
  - Header: Order ID, date, status badge, total, chevron.
  - Body: `<OrderItem>` cho mỗi item (không có nút download).
  - **Status action buttons**: Processing, Shipped, Completed, Cancelled.

---

## 8. Trang Thanh toán Thành công (CheckoutSuccessView)

### Tổng quan

`CheckoutSuccessView` hiển thị sau khi thanh toán thành công.

### Cấu trúc trang

- Centered layout:
  - Green checkmark icon (4rem, `fa-check-circle`).
  - "Payment Successful" title.
  - "Thank you..." lead text.
- **Action buttons**:
  - "View Orders" (→ `/bookstore/orders`).
  - "Continue Shopping" (→ `/bookstore`).

---

## 9. Trang Thanh toán Bị huỷ (CheckoutCancelView)

### Tổng quan

`CheckoutCancelView` hiển thị khi người dùng huỷ thanh toán.

### Cấu trúc trang

- Centered layout:
  - Red X-mark icon (4rem, `fa-times-circle`).
  - "Payment Cancelled" title.
  - "Your checkout was cancelled..." lead text.
- **Action buttons**:
  - "Back to Cart" (→ `/bookstore/cart`).
  - "Browse Books" (→ `/bookstore`).

---

## Ghi chú chung

- Tất cả các trang bookstore đều sử dụng `BookstoreLayout` — layout riêng, không dùng `MainLayoutTemplate`.
- Các component dùng chung: `BookstoreLayout`, `BookFilterBar`, `BookGrid`, `BookSection`, `TagStrip`, `BookUploadForm`, `SellerBookRow`, `CartItem`, `OrderItem`, `AddToCartButton`.
- Store: `useBookStore` (Pinia) — quản lý toàn bộ state của module bookstore.
- Định dạng ngày sử dụng `formatShortDate` từ `@/utils/date.js`.
- CSS riêng: `src/assets/styles/bookstore.css`.
