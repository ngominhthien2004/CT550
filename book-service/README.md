# Book Service

Microservice for buying and selling digital books within IlluWrl.

## Local development

1. Copy `.env.example` to `.env` and fill in your values.
2. **Use the same `MONGODB_URI` and `JWT_SECRET` as `backend/.env`.** The book-service shares the `users` collection and stores its own data in prefixed collections (`book_books`, `book_orders`, `book_carts`, `book_sellerprofiles`) inside the main `CT550` database. A separate local-only database (e.g. `mongodb://localhost:27017/ct550-books-test`) will appear empty because the data lives in the shared `CT550` database.
3. Make sure MongoDB is reachable.
4. Run the service:

```bash
npm install
npm run dev
```

The service listens on `PORT` (default `5001`).

## Render deployment

This service is declared in the root `render.yaml` as `CT550-BookService`.

### Environment variables

The service joins the shared `ct550` env var group so it reuses secrets with the main backend:

- `JWT_SECRET` — must match the main IlluWrl backend so auth tokens validate across services.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — shared media credentials.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — shared Stripe credentials.

Values that should be set per-service:

- `MONGODB_URI` — override in the Render dashboard to use a dedicated database such as `ct550-books` (e.g. `mongodb+srv://.../ct550-books?retryWrites=true&w=majority`). Avoid sharing the same database as the main backend.
- `FRONTEND_URL` — must be the production frontend URL. It is used for Stripe redirect URLs and CORS allowlisting.

### Health check

Render pings `GET /api/book-service/health`.
