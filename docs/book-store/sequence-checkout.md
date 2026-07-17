# Book Store Service — Sequence Diagram: Checkout Flow

> **Môn học:** CT550 - Công nghệ phần mềm  
> **Ngày:** 2026-07-16

## Checkout Flow

Luồng thanh toán hoàn chỉnh từ khi người dùng thêm sách vào giỏ đến khi tải ebook.

```mermaid
sequenceDiagram
    autonumber
    participant Buyer as Người mua
    participant Frontend as Frontend
    participant BookAPI as Book Service API
    participant Cart as Cart Model
    participant Order as Order Model
    participant Stripe as Stripe
    participant Webhook as Webhook Handler

    Note over Buyer,Webhook: Phase 1: Cart Management

    Buyer->>Frontend: Thêm sách vào giỏ
    Frontend->>BookAPI: POST /cart {bookId, quantity}
    BookAPI->>Cart: findOne({user}) + save()
    BookAPI-->>Frontend: 200 Cart populated
    Frontend-->>Buyer: Hiển thị giỏ hàng

    Note over Buyer,Webhook: Phase 2: Create Order

    Buyer->>Frontend: Bấm "Mua hàng"
    Frontend->>BookAPI: POST /orders
    BookAPI->>Cart: findOne({user}).populate('items.book')
    Note right of BookAPI: Kiểm tra tồn kho<br/>Tính tổng tiền<br/>Denormalize book data
    BookAPI->>Order: create({buyer, items, totalAmount})
    BookAPI->>Cart: deleteOne({user})
    BookAPI-->>Frontend: 201 Order created
    Frontend-->>Buyer: Hiển thị đơn hàng

    Note over Buyer,Webhook: Phase 3: Stripe Checkout

    Buyer->>Frontend: Bấm "Thanh toán"
    Frontend->>BookAPI: POST /checkout {orderId}
    BookAPI->>Order: findById(orderId)
    Note right of BookAPI: Kiểm tra:<br/>- Là chủ đơn<br/>- Status = pending
    BookAPI->>Stripe: checkout.sessions.create({line_items, ...})
    BookAPI->>Order: save({stripeSessionId})
    BookAPI-->>Frontend: 200 {sessionId, url}
    Frontend-->>Buyer: Redirect đến Stripe

    Note over Buyer,Webhook: Phase 4: Payment

    Buyer->>Stripe: Nhập thông tin thẻ
    Stripe-->>Buyer: Thanh toán thành công

    Note over Buyer,Webhook: Phase 5: Webhook Callback

    Stripe->>Webhook: POST /webhook/stripe
    Note right of Webhook: Xác thực stripe-signature
    Webhook->>Order: findOne({stripeSessionId})
    Webhook->>Order: save({status: 'paid', paymentStatus: 'paid'})
    Webhook-->>Stripe: 200 OK

    Note over Buyer,Webhook: Phase 6: Download

    Buyer->>Frontend: Vào trang đơn hàng
    Frontend->>BookAPI: GET /orders/:id
    BookAPI-->>Frontend: 200 Order (status: paid)
    Buyer->>Frontend: Bấm "Tải ebook"
    Frontend->>BookAPI: GET /orders/:id/download/:itemId
    BookAPI->>Order: findOne({buyer, status: paid/fulfilled})
    BookAPI-->>Frontend: 200 {downloadUrl}
    Frontend-->>Buyer: Download file ebook
```

---

## State Diagram: Order Status

```mermaid
stateDiagram-v2
    [*] --> pending: Tạo đơn hàng từ giỏ

    pending --> paid: Stripe webhook<br/>checkout.session.completed
    pending --> cancelled: Seller/Admin hủy

    paid --> fulfilled: Seller xác nhận<br/>đã giao ebook
    paid --> refunded: Admin hoàn tiền

    cancelled --> [*]
    fulfilled --> [*]
    refunded --> [*]
```

---

## State Diagram: Payment Status

```mermaid
stateDiagram-v2
    [*] --> pending: Tạo đơn hàng

    pending --> paid: Stripe webhook
    pending --> failed: Thanh toán thất bại

    paid --> refunded: Admin hoàn tiền

    failed --> [*]
    refunded --> [*]
```
