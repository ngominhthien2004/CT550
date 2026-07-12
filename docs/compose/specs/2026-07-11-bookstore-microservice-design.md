# Book Store Microservice Design

## [S1] Problem

IlluWrl is an illustration/manga sharing platform. The user wants to add a **digital ebook selling** feature as a separate microservice within the same monorepo. Artists (sellers) can sell ebooks, buyers can purchase and download them.

## [S2] Solution Overview

A new `book-service/` directory in the CT550 monorepo, deployed as a separate Render web service. Shares MongoDB Atlas cluster and JWT authentication with the existing `backend/`. Frontend routes added to the existing Vue 3 app.

**Scope (MVP):**
- CRUD books (seller-managed)
- Cart & Checkout
- Stripe payment integration
- Ebook download after purchase
- Reviews & Ratings
- Multi-vendor (artists as sellers)

## [S3] Directory Structure

```
CT550/
├── backend/                  ← Existing IlluWrl API (port 5000)
├── book-service/             ← New microservice (port 5001)
│   ├── config/
│   │   ├── db.js             ← MongoDB Atlas connection (shared cluster)
│   │   ├── env.js            ← Environment variables
│   │   └── stripe.js         ← Stripe SDK setup
│   ├── models/
│   │   ├── Book.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Payout.js
│   ├── controllers/
│   │   ├── book.controller.js
│   │   ├── cart.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── review.controller.js
│   │   └── download.controller.js
│   ├── routes/
│   │   ├── book.routes.js
│   │   ├── cart.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── review.routes.js
│   │   └── download.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js     ← Verify JWT (shared secret with IlluWrl)
│   │   ├── seller.middleware.js   ← Check seller role
│   │   └── error.middleware.js
│   ├── services/
│   │   ├── stripe.service.js
│   │   └── email.service.js
│   ├── utils/
│   │   └── helpers.js
│   ├── uploads/                   ← Cover images + ebook files
│   ├── index.js
│   ├── server.js
│   └── package.json
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── BookStoreView.vue
│       │   ├── BookDetailView.vue
│       │   ├── CartView.vue
│       │   ├── CheckoutView.vue
│       │   ├── MyBooksView.vue
│       │   ├── SellerDashboardView.vue
│       │   └── SellerUploadView.vue
│       ├── stores/
│       │   ├── book.store.js
│       │   └── cart.store.js
│       └── services/
│           └── bookApi.js
├── render.yaml
└── ...
```

## [S4] Authentication & Authorization

- Shared JWT secret (`JWT_SECRET` env var) between `backend/` and `book-service/`
- `book-service` verifies tokens via its own middleware (no inter-service calls)
- Roles: `user` (buyer), `seller` (can list books), `admin` (management)
- Seller registration: user creates a seller profile (store name, bio, payout info)

## [S5] Data Models

### Book
```
title: String (required)
author: String
description: String
price: Number (required, min 0)
coverImage: String (URL)
fileUrl: String (URL to ebook file)
format: Enum [pdf, epub]
fileSize: Number (bytes)
seller: ObjectId → User (required)
categories: [String]
tags: [String]
downloadCount: Number (default 0)
rating: Number (average)
status: Enum [draft, published, archived]
createdAt: Date
```

### Cart
```
user: ObjectId → User (required, unique)
items: [{
  book: ObjectId → Book
  quantity: Number (default 1)
}]
```

### Order
```
user: ObjectId → User (required)
items: [{
  book: ObjectId → Book
  price: Number (snapshot at purchase)
  seller: ObjectId → User
}]
totalAmount: Number
paymentIntentId: String (Stripe)
status: Enum [pending, paid, delivered, cancelled]
createdAt: Date
```

### Review
```
user: ObjectId → User (required)
book: ObjectId → Book (required)
rating: Number (1-5)
comment: String
createdAt: Date
```
Unique compound index on (user, book).

### Payout
```
seller: ObjectId → User (required)
orders: [ObjectId → Order]
totalAmount: Number
status: Enum [pending, paid]
paidAt: Date
```

## [S6] API Routes

### Books
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/books` | No | List books (search, filter, paginate) |
| GET | `/api/books/:id` | No | Book detail |
| POST | `/api/books` | Seller | Upload new book |
| PUT | `/api/books/:id` | Seller (owner) | Update book |
| DELETE | `/api/books/:id` | Seller (owner) | Delete book |

### Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart` | User | Add to cart |
| PUT | `/api/cart/:itemId` | User | Update quantity |
| DELETE | `/api/cart/:itemId` | User | Remove item |

### Orders & Payment
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders/checkout` | User | Create Stripe checkout session |
| POST | `/api/orders/webhook` | Stripe | Stripe webhook (raw body) |
| GET | `/api/orders` | User | Order history |
| GET | `/api/orders/:id` | User | Order detail |

### Reviews
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/books/:id/reviews` | User | Create review |
| GET | `/api/books/:id/reviews` | No | List reviews |

### Downloads
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/downloads/:orderId` | User | Download ebook (paid order only) |

### Seller
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/seller/dashboard` | Seller | Seller stats |
| GET | `/api/seller/books` | Seller | Seller's own books |

## [S7] Payment Flow (Stripe)

1. User clicks "Checkout" → frontend calls `POST /api/orders/checkout`
2. Backend creates Stripe Checkout Session with line items, success/cancel URLs
3. Frontend redirects to Stripe-hosted checkout page
4. On success, Stripe redirects to `/checkout/success?session_id=...`
5. Stripe fires webhook to `POST /api/orders/webhook`
6. Webhook verifies signature, updates order status to `paid`
7. User can now download ebook via `GET /api/downloads/:orderId`

## [S8] File Storage

- **Cover images**: Cloudinary unsigned upload (free tier: 25GB bandwidth/month)
- **Ebook files**: Cloudinary raw upload or Backblaze B2 (free tier: 10GB storage)
- URLs stored in Book model as strings

## [S9] Deployment on Render

Add to `render.yaml`:

```yaml
- type: web
  name: CT550-BookService
  env: node
  region: oregon
  plan: free
  rootDir: book-service
  buildCommand: npm install
  startCommand: node index.js
  healthCheckPath: /api/books
  envVarGroups:
    - name: ct550-book-service
  repo: https://github.com/ngominhthien2004/CT550
```

**Environment variables (ct550-book-service group):**
- `MONGODB_URI` — same cluster as IlluWrl
- `JWT_SECRET` — same secret as IlluWrl
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PORT` — 5001

**Frontend proxy:** Add to `frontend/vite.config.js`:
```js
'/api/books': { target: BOOK_SERVICE_URL, changeOrigin: true },
'/api/cart': { target: BOOK_SERVICE_URL, changeOrigin: true },
'/api/orders': { target: BOOK_SERVICE_URL, changeOrigin: true },
'/api/seller': { target: BOOK_SERVICE_URL, changeOrigin: true },
'/api/downloads': { target: BOOK_SERVICE_URL, changeOrigin: true },
```

**Routing conflict:** Both services use `/api/*`. Options:
1. **book-service uses `/api/books/*`, `/api/cart/*`, etc.** — prefix-based routing
2. **book-service uses `/book-api/*`** — completely separate prefix
3. **Single API gateway** — more complex, overkill for MVP

Recommendation: Option 1 (prefix-based). IlluWrl routes don't overlap with book routes.

## [S10] Frontend Routes

| Route | Component | Auth |
|-------|-----------|------|
| `/books` | BookStoreView | No |
| `/books/:id` | BookDetailView | No |
| `/cart` | CartView | User |
| `/checkout/success` | CheckoutSuccessView | User |
| `/my-books` | MyBooksView (purchased) | User |
| `/seller/dashboard` | SellerDashboardView | Seller |
| `/seller/upload` | SellerUploadView | Seller |
| `/seller/edit/:id` | SellerEditView | Seller |

Add nav link to MainLayoutTemplate sidebar: "Book Store" with book icon.
