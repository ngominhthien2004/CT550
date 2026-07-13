# Book Service

Microservice for buying and selling digital books within IlluWrl.

## Local development

1. Copy `.env.example` to `.env` and fill in your values.
2. Make sure MongoDB is reachable.
3. Run the service:

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
