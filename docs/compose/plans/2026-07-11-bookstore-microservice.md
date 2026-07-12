# Book Store Microservice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a digital ebook selling microservice as a separate Express service within the CT550 monorepo, sharing MongoDB and JWT auth with IlluWrl.

**Architecture:** Separate `book-service/` Express app on port 5001, same MongoDB Atlas cluster, same JWT secret. Frontend routes added to existing Vue 3 app. Deployed as a new Render web service.

**Tech Stack:** Express 5, Mongoose, Stripe SDK, Cloudinary, Vue 3 + Pinia + Vite

## Global Constraints

- Backend uses CommonJS (`require`/`module.exports`), NOT ESM
- MongoDB connection reuses `dns.setDefaultResultOrder('ipv4first')` and Google DNS override pattern from `backend/config/db.js`
- JWT verification uses same `JWT_SECRET` as IlluWrl backend
- All date displays use `frontend/src/utils/date.js` (`formatShortDate`)
- Frontend uses Bootstrap 5 CSS + Font Awesome icons
- Test accounts from `docs/reports/auth-test-accounts-2026-04-05.md`

---

### Task 1: Book Service Scaffolding

**Covers:** [S3, S9]

**Files:**
- Create: `book-service/package.json`
- Create: `book-service/server.js`
- Create: `book-service/index.js`
- Create: `book-service/config/db.js`
- Create: `book-service/config/env.js`
- Create: `book-service/config/stripe.js`
- Create: `book-service/middlewares/error.middleware.js`
- Create: `book-service/.env.example`

**Interfaces:**
- Produces: Express app listening on `PORT` (default 5001), MongoDB connection, Stripe client instance

- [ ] **Step 1: Create book-service directory and package.json**

```bash
mkdir book-service
```

```json
// book-service/package.json
{
  "name": "illuwrl-book-service",
  "version": "1.0.0",
  "description": "Digital ebook selling microservice for IlluWrl",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "mongoose": "^8.15.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "multer": "^1.4.5-lts.1",
    "stripe": "^17.7.0",
    "cloudinary": "^2.5.1",
    "helmet": "^8.1.0",
    "express-rate-limit": "^7.5.0"
  }
}
```

- [ ] **Step 2: Create config/env.js**

```js
// book-service/config/env.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
```

- [ ] **Step 3: Create config/db.js**

```js
// book-service/config/db.js
const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

// Force IPv4-first DNS resolution (same as IlluWrl backend)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

- [ ] **Step 4: Create config/stripe.js**

```js
// book-service/config/stripe.js
const Stripe = require('stripe');
const env = require('./env');

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

- [ ] **Step 5: Create middlewares/error.middleware.js**

```js
// book-service/middlewares/error.middleware.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
```

- [ ] **Step 6: Create server.js and index.js**

```js
// book-service/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Security
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Stripe webhook needs raw body — mount before json parser
// app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/books', (req, res) => {
  res.json({ success: true, message: 'Book service is running' });
});

// Routes will be mounted here in later tasks
// app.use('/api/books', require('./routes/book.routes'));
// app.use('/api/cart', require('./routes/cart.routes'));
// app.use('/api/orders', require('./routes/order.routes'));
// app.use('/api/seller', require('./routes/seller.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

```js
// book-service/index.js
const app = require('./server');
const connectDB = require('./config/db');
const env = require('./config/env');

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Book service running on port ${env.PORT}`);
  });
};

start();
```

- [ ] **Step 7: Create .env.example**

```
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 8: Install dependencies and verify startup**

```bash
cd book-service && npm install
```

Run: `node index.js`
Expected: "MongoDB connected: ..." + "Book service running on port 5001"

- [ ] **Step 9: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): scaffold microservice with Express + MongoDB"
```

---

### Task 2: MongoDB Models

**Covers:** [S5]

**Files:**
- Create: `book-service/models/Book.js`
- Create: `book-service/models/Cart.js`
- Create: `book-service/models/Order.js`
- Create: `book-service/models/Review.js`
- Create: `book-service/models/Payout.js`

**Interfaces:**
- Produces: Mongoose models `Book`, `Cart`, `Order`, `Review`, `Payout`

- [ ] **Step 1: Create Book model**

```js
// book-service/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  coverImage: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  format: { type: String, enum: ['pdf', 'epub'], default: 'pdf' },
  fileSize: { type: Number, default: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categories: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  downloadCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ seller: 1, status: 1 });
bookSchema.index({ categories: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);
```

- [ ] **Step 2: Create Cart model**

```js
// book-service/models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, default: 1, min: 1 },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
```

- [ ] **Step 3: Create Order model**

```js
// book-service/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  paymentIntentId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'paid', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ 'items.seller': 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
```

- [ ] **Step 4: Create Review model**

```js
// book-service/models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

reviewSchema.index({ user: 1, book: 1 }, { unique: true });
reviewSchema.index({ book: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
```

- [ ] **Step 5: Create Payout model**

```js
// book-service/models/Payout.js
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date },
}, { timestamps: true });

payoutSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
```

- [ ] **Step 6: Commit**

```bash
git add book-service/models/
git commit -m "feat(book-service): add MongoDB models for Book, Cart, Order, Review, Payout"
```

---

### Task 3: Auth & Seller Middleware

**Covers:** [S4]

**Files:**
- Create: `book-service/middlewares/auth.middleware.js`
- Create: `book-service/middlewares/seller.middleware.js`

**Interfaces:**
- Produces: `protect` middleware (attaches `req.user`), `sellerOnly` middleware

- [ ] **Step 1: Create auth middleware**

```js
// book-service/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Verify JWT token — same secret as IlluWrl backend
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { _id: decoded.id || decoded._id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
```

- [ ] **Step 2: Create seller middleware**

```js
// book-service/middlewares/seller.middleware.js
const sellerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Seller access required' });
  }
  next();
};

module.exports = { sellerOnly };
```

- [ ] **Step 3: Commit**

```bash
git add book-service/middlewares/
git commit -m "feat(book-service): add JWT auth and seller role middleware"
```

---

### Task 4: Book CRUD (Controller + Routes)

**Covers:** [S6]

**Files:**
- Create: `book-service/controllers/book.controller.js`
- Create: `book-service/routes/book.routes.js`
- Modify: `book-service/server.js` (mount routes)

**Interfaces:**
- Consumes: `Book` model, `protect` and `sellerOnly` middleware
- Produces: Book CRUD API endpoints

- [ ] **Step 1: Create book controller**

```js
// book-service/controllers/book.controller.js
const Book = require('../models/Book');

// GET /api/books — list books with search, filter, paginate
exports.listBooks = async (req, res, next) => {
  try {
    const {
      search, category, minPrice, maxPrice,
      sort = '-createdAt', page = 1, limit = 12,
    } = req.query;

    const filter = { status: 'published' };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.categories = category;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [books, total] = await Promise.all([
      Book.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Book.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: books,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id — book detail
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// POST /api/books — seller creates book
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, price, coverImage, fileUrl, format, fileSize, categories, tags } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ success: false, message: 'Title and price are required' });
    }

    const book = await Book.create({
      title, author, description, price, coverImage, fileUrl, format, fileSize,
      categories, tags, seller: req.user._id, status: 'published',
    });

    res.status(201).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id — seller updates book
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (book.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const allowed = ['title', 'author', 'description', 'price', 'coverImage', 'fileUrl', 'format', 'fileSize', 'categories', 'tags', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) book[field] = req.body[field];
    });

    await book.save();
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id — seller deletes book
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (book.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await book.deleteOne();
    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Create book routes**

```js
// book-service/routes/book.routes.js
const express = require('express');
const router = express.Router();
const { listBooks, getBook, createBook, updateBook, deleteBook } = require('../controllers/book.controller');
const { protect } = require('../middlewares/auth.middleware');
const { sellerOnly } = require('../middlewares/seller.middleware');

router.get('/', listBooks);
router.get('/:id', getBook);
router.post('/', protect, sellerOnly, createBook);
router.put('/:id', protect, sellerOnly, updateBook);
router.delete('/:id', protect, sellerOnly, deleteBook);

module.exports = router;
```

- [ ] **Step 3: Mount routes in server.js**

Uncomment/add in `book-service/server.js`:
```js
app.use('/api/books', require('./routes/book.routes'));
```

- [ ] **Step 4: Test book CRUD manually**

```bash
cd book-service && node index.js
```

Test with curl:
```bash
# List books (empty at first)
curl http://localhost:5001/api/books

# Create a book (need valid JWT)
curl -X POST http://localhost:5001/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Test Book","price":9.99}'
```

- [ ] **Step 5: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): implement Book CRUD with search and pagination"
```

---

### Task 5: Cart Functionality

**Covers:** [S6]

**Files:**
- Create: `book-service/controllers/cart.controller.js`
- Create: `book-service/routes/cart.routes.js`
- Modify: `book-service/server.js` (mount routes)

**Interfaces:**
- Consumes: `Cart` model, `Book` model, `protect` middleware
- Produces: Cart CRUD API endpoints

- [ ] **Step 1: Create cart controller**

```js
// book-service/controllers/cart.controller.js
const Cart = require('../models/Cart');
const Book = require('../models/Book');

// GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.book', 'title price coverImage format');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart — add item
exports.addToCart = async (req, res, next) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    const book = await Book.findById(bookId);
    if (!book || book.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Book not found or unavailable' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(item => item.book.toString() === bookId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ book: bookId, quantity });
    }

    await cart.save();
    cart = await cart.populate('items.book', 'title price coverImage format');
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/:itemId — update quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();
    const updated = await cart.populate('items.book', 'title price coverImage format');
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/:itemId — remove item
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
    await cart.save();
    const updated = await cart.populate('items.book', 'title price coverImage format');
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Create cart routes**

```js
// book-service/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);

module.exports = router;
```

- [ ] **Step 3: Mount routes in server.js**

```js
app.use('/api/cart', require('./routes/cart.routes'));
```

- [ ] **Step 4: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): implement Cart add/update/remove"
```

---

### Task 6: Stripe Payment & Orders

**Covers:** [S6, S7]

**Files:**
- Create: `book-service/controllers/order.controller.js`
- Create: `book-service/controllers/payment.controller.js`
- Create: `book-service/routes/order.routes.js`
- Create: `book-service/services/stripe.service.js`
- Modify: `book-service/server.js`

**Interfaces:**
- Consumes: `Order` model, `Cart` model, `Book` model, Stripe client
- Produces: Checkout session creation, webhook handling, order history

- [ ] **Step 1: Create Stripe service**

```js
// book-service/services/stripe.service.js
const stripe = require('../config/stripe');
const env = require('../config/env');

exports.createCheckoutSession = async (order) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: order.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    })),
    mode: 'payment',
    success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/cart`,
    metadata: { orderId: order._id.toString() },
  });
  return session;
};

exports.constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
};
```

- [ ] **Step 2: Create order controller**

```js
// book-service/controllers/order.controller.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');
const stripeService = require('../services/stripe.service');

// POST /api/orders/checkout — create Stripe session
exports.checkout = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Build order items with price snapshot
    const orderItems = cart.items.map(item => ({
      book: item.book._id,
      title: item.book.title,
      price: item.book.price,
      seller: item.book.seller,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      status: 'pending',
    });

    const session = await stripeService.createCheckoutSession(order);

    order.paymentIntentId = session.payment_intent;
    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/webhook — Stripe webhook
exports.webhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    await Order.findByIdAndUpdate(orderId, { status: 'paid' });

    // Increment download count for each book
    const order = await Order.findById(orderId);
    if (order) {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, { $inc: { downloadCount: 1 } });
      }
    }
  }

  res.json({ received: true });
};

// GET /api/orders — order history
exports.listOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.book', 'title coverImage');
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id — order detail
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.book', 'title coverImage fileUrl format');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 3: Create order routes**

```js
// book-service/routes/order.routes.js
const express = require('express');
const router = express.Router();
const { checkout, webhook, listOrders, getOrder } = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/webhook', express.raw({ type: 'application/json' }), webhook);
router.post('/checkout', protect, checkout);
router.get('/', protect, listOrders);
router.get('/:id', protect, getOrder);

module.exports = router;
```

- [ ] **Step 4: Mount order routes in server.js (before JSON parser)**

Important: Webhook route must be before `express.json()`. Restructure server.js:

```js
// In server.js, BEFORE app.use(express.json()):
app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));

// AFTER app.use(express.json()):
app.use('/api/orders', require('./routes/order.routes'));
```

- [ ] **Step 5: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): implement Stripe checkout and order management"
```

---

### Task 7: Review System

**Covers:** [S6]

**Files:**
- Create: `book-service/controllers/review.controller.js`
- Create: `book-service/routes/review.routes.js`

**Interfaces:**
- Consumes: `Review` model, `Book` model, `Order` model, `protect` middleware
- Produces: Review create and list endpoints

- [ ] **Step 1: Create review controller**

```js
// book-service/controllers/review.controller.js
const Review = require('../models/Review');
const Book = require('../models/Book');
const Order = require('../models/Order');

// POST /api/books/:id/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const bookId = req.params.id;

    // Check user has a paid order for this book
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      status: 'paid',
      'items.book': bookId,
    });
    if (!hasPurchased) {
      return res.status(403).json({ success: false, message: 'You must purchase this book to review it' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ user: req.user._id, book: bookId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already reviewed this book' });
    }

    const review = await Review.create({
      user: req.user._id, book: bookId, rating, comment,
    });

    // Update book average rating
    const stats = await Review.aggregate([
      { $match: { book: review.book } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);
    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, { rating: Math.round(stats[0].avgRating * 10) / 10 });
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id/reviews
exports.listReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ book: req.params.id })
      .sort('-createdAt')
      .populate('user', 'username avatar');
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Create review routes**

```js
// book-service/routes/review.routes.js
const express = require('express');
const router = express.Router();
const { createReview, listReviews } = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/books/:id/reviews', listReviews);
router.post('/books/:id/reviews', protect, createReview);

module.exports = router;
```

- [ ] **Step 3: Mount review routes in server.js**

```js
app.use('/api', require('./routes/review.routes'));
```

- [ ] **Step 4: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): implement book review system with rating aggregation"
```

---

### Task 8: Download & Seller Dashboard

**Covers:** [S6]

**Files:**
- Create: `book-service/controllers/download.controller.js`
- Create: `book-service/controllers/seller.controller.js`
- Create: `book-service/routes/download.routes.js`
- Create: `book-service/routes/seller.routes.js`

**Interfaces:**
- Consumes: `Order` model, `Book` model, `protect` and `sellerOnly` middleware
- Produces: Download endpoint, seller dashboard and book list

- [ ] **Step 1: Create download controller**

```js
// book-service/controllers/download.controller.js
const Order = require('../models/Order');

// GET /api/downloads/:orderId
exports.downloadBook = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('items.book');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order not paid' });
    }

    // Return file URLs for all books in the order
    const files = order.items.map(item => ({
      title: item.book.title,
      fileUrl: item.book.fileUrl,
      format: item.book.format,
    }));

    res.json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 2: Create seller controller**

```js
// book-service/controllers/seller.controller.js
const Book = require('../models/Book');
const Order = require('../models/Order');

// GET /api/seller/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [books, orders, stats] = await Promise.all([
      Book.countDocuments({ seller: sellerId }),
      Order.countDocuments({ 'items.seller': sellerId, status: 'paid' }),
      Order.aggregate([
        { $match: { 'items.seller': sellerId, status: 'paid' } },
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        { $group: { _id: null, totalRevenue: { $sum: '$items.price' }, totalSales: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalBooks: books,
        totalOrders: orders,
        totalRevenue: stats.length > 0 ? stats[0].totalRevenue : 0,
        totalSales: stats.length > 0 ? stats[0].totalSales : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/seller/books
exports.getSellerBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ seller: req.user._id }).sort('-createdAt').lean();
    res.json({ success: true, data: books });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 3: Create download and seller routes**

```js
// book-service/routes/download.routes.js
const express = require('express');
const router = express.Router();
const { downloadBook } = require('../controllers/download.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/:orderId', protect, downloadBook);

module.exports = router;
```

```js
// book-service/routes/seller.routes.js
const express = require('express');
const router = express.Router();
const { getDashboard, getSellerBooks } = require('../controllers/seller.controller');
const { protect } = require('../middlewares/auth.middleware');
const { sellerOnly } = require('../middlewares/seller.middleware');

router.use(protect, sellerOnly);
router.get('/dashboard', getDashboard);
router.get('/books', getSellerBooks);

module.exports = router;
```

- [ ] **Step 4: Mount routes in server.js**

```js
app.use('/api/downloads', require('./routes/download.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
```

- [ ] **Step 5: Commit**

```bash
git add book-service/
git commit -m "feat(book-service): implement ebook download and seller dashboard"
```

---

### Task 9: Frontend — Book API Client & Stores

**Covers:** [S10]

**Files:**
- Create: `frontend/src/services/bookApi.js`
- Create: `frontend/src/stores/book.store.js`
- Create: `frontend/src/stores/cart.store.js`

**Interfaces:**
- Produces: `bookApi` HTTP client, `useBookStore`, `useCartStore` Pinia stores

- [ ] **Step 1: Create book API client**

```js
// frontend/src/services/bookApi.js
import api from './api.js'

const BOOK_API = import.meta.env.VITE_BOOK_API_URL || '/api'

export default {
  // Books
  listBooks(params = {}) {
    return api.get(`${BOOK_API}/books`, { params })
  },
  getBook(id) {
    return api.get(`${BOOK_API}/books/${id}`)
  },
  createBook(data) {
    return api.post(`${BOOK_API}/books`, data)
  },
  updateBook(id, data) {
    return api.put(`${BOOK_API}/books/${id}`, data)
  },
  deleteBook(id) {
    return api.delete(`${BOOK_API}/books/${id}`)
  },

  // Cart
  getCart() {
    return api.get(`${BOOK_API}/cart`)
  },
  addToCart(bookId, quantity = 1) {
    return api.post(`${BOOK_API}/cart`, { bookId, quantity })
  },
  updateCartItem(itemId, quantity) {
    return api.put(`${BOOK_API}/cart/${itemId}`, { quantity })
  },
  removeFromCart(itemId) {
    return api.delete(`${BOOK_API}/cart/${itemId}`)
  },

  // Orders
  checkout() {
    return api.post(`${BOOK_API}/orders/checkout`)
  },
  listOrders() {
    return api.get(`${BOOK_API}/orders`)
  },
  getOrder(id) {
    return api.get(`${BOOK_API}/orders/${id}`)
  },

  // Downloads
  getDownloadUrl(orderId) {
    return api.get(`${BOOK_API}/downloads/${orderId}`)
  },

  // Reviews
  listReviews(bookId) {
    return api.get(`${BOOK_API}/books/${bookId}/reviews`)
  },
  createReview(bookId, data) {
    return api.post(`${BOOK_API}/books/${bookId}/reviews`, data)
  },

  // Seller
  getSellerDashboard() {
    return api.get(`${BOOK_API}/seller/dashboard`)
  },
  getSellerBooks() {
    return api.get(`${BOOK_API}/seller/books`)
  },
}
```

- [ ] **Step 2: Create book store**

```js
// frontend/src/stores/book.store.js
import { defineStore } from 'pinia'
import bookApi from '@/services/bookApi.js'

export const useBookStore = defineStore('book', {
  state: () => ({
    books: [],
    currentBook: null,
    pagination: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchBooks(params = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await bookApi.listBooks(params)
        this.books = res.data.data
        this.pagination = res.data.pagination
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load books'
      } finally {
        this.loading = false
      }
    },

    async fetchBook(id) {
      this.loading = true
      this.error = null
      try {
        const res = await bookApi.getBook(id)
        this.currentBook = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load book'
      } finally {
        this.loading = false
      }
    },
  },
})
```

- [ ] **Step 3: Create cart store**

```js
// frontend/src/stores/cart.store.js
import { defineStore } from 'pinia'
import bookApi from '@/services/bookApi.js'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null,
    loading: false,
    error: null,
  }),

  getters: {
    itemCount: (state) => state.cart?.items?.length || 0,
    totalAmount: (state) => state.cart?.items?.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0) || 0,
  },

  actions: {
    async fetchCart() {
      this.loading = true
      try {
        const res = await bookApi.getCart()
        this.cart = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load cart'
      } finally {
        this.loading = false
      }
    },

    async addToCart(bookId) {
      try {
        const res = await bookApi.addToCart(bookId)
        this.cart = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to add to cart'
      }
    },

    async updateQuantity(itemId, quantity) {
      try {
        const res = await bookApi.updateCartItem(itemId, quantity)
        this.cart = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update cart'
      }
    },

    async removeItem(itemId) {
      try {
        const res = await bookApi.removeFromCart(itemId)
        this.cart = res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to remove item'
      }
    },

    async checkout() {
      try {
        const res = await bookApi.checkout()
        return res.data.data
      } catch (err) {
        this.error = err.response?.data?.message || 'Checkout failed'
        throw err
      }
    },
  },
})
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/bookApi.js frontend/src/stores/
git commit -m "feat(frontend): add book API client and Pinia stores"
```

---

### Task 10: Frontend — BookStoreView & BookDetailView

**Covers:** [S10]

**Files:**
- Create: `frontend/src/views/BookStoreView.vue`
- Create: `frontend/src/views/BookDetailView.vue`
- Modify: `frontend/src/router/index.js` (add routes)
- Modify: `frontend/src/components/layout/MainLayoutTemplate.vue` (add nav link)

**Interfaces:**
- Consumes: `useBookStore`, `useCartStore`
- Produces: Book listing page, Book detail page

- [ ] **Step 1: Create BookStoreView.vue**

```vue
<!-- frontend/src/views/BookStoreView.vue -->
<template>
  <div class="book-store">
    <div class="container py-4">
      <h2 class="mb-4">Book Store</h2>

      <!-- Search & Filters -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Search books..."
            @keyup.enter="search"
          />
        </div>
        <div class="col-md-3">
          <select v-model="selectedCategory" class="form-select" @change="search">
            <option value="">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="sortBy" class="form-select" @change="search">
            <option value="-createdAt">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="-price">Price: High to Low</option>
            <option value="-rating">Top Rated</option>
          </select>
        </div>
      </div>

      <!-- Book Grid -->
      <div v-if="bookStore.loading" class="text-center py-5">
        <div class="spinner-border"></div>
      </div>
      <div v-else-if="bookStore.books.length === 0" class="text-center py-5 text-muted">
        No books found.
      </div>
      <div v-else class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
        <div v-for="book in bookStore.books" :key="book._id" class="col">
          <router-link :to="`/books/${book._id}`" class="text-decoration-none">
            <div class="card h-100 book-card">
              <img
                :src="book.coverImage || '/placeholder-book.png'"
                class="card-img-top"
                :alt="book.title"
                style="height: 200px; object-fit: cover;"
              />
              <div class="card-body">
                <h6 class="card-title text-truncate">{{ book.title }}</h6>
                <p class="card-text text-muted small mb-1">{{ book.author || 'Unknown author' }}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="fw-bold text-primary">${{ book.price.toFixed(2) }}</span>
                  <span v-if="book.rating" class="small text-warning">
                    <i class="fas fa-star"></i> {{ book.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Pagination -->
      <nav v-if="bookStore.pagination && bookStore.pagination.pages > 1" class="mt-4">
        <ul class="pagination justify-content-center">
          <li v-for="p in bookStore.pagination.pages" :key="p" class="page-item" :class="{ active: p === currentPage }">
            <button class="page-link" @click="goToPage(p)">{{ p }}</button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '@/stores/book.store.js'

const bookStore = useBookStore()
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('-createdAt')
const currentPage = ref(1)
const categories = ref(['Manga', 'Artbook', 'Novel', 'Tutorial', 'Other'])

const search = () => {
  currentPage.value = 1
  fetchBooks()
}

const goToPage = (page) => {
  currentPage.value = page
  fetchBooks()
}

const fetchBooks = () => {
  bookStore.fetchBooks({
    search: searchQuery.value,
    category: selectedCategory.value,
    sort: sortBy.value,
    page: currentPage.value,
  })
}

onMounted(() => fetchBooks())
</script>

<style scoped>
.book-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
```

- [ ] **Step 2: Create BookDetailView.vue**

```vue
<!-- frontend/src/views/BookDetailView.vue -->
<template>
  <div class="container py-4">
    <div v-if="bookStore.loading" class="text-center py-5">
      <div class="spinner-border"></div>
    </div>
    <div v-else-if="bookStore.currentBook" class="row">
      <!-- Book Info -->
      <div class="col-md-4">
        <img
          :src="bookStore.currentBook.coverImage || '/placeholder-book.png'"
          class="img-fluid rounded shadow"
          :alt="bookStore.currentBook.title"
        />
      </div>
      <div class="col-md-8">
        <h2>{{ bookStore.currentBook.title }}</h2>
        <p class="text-muted">by {{ bookStore.currentBook.author || 'Unknown' }}</p>
        <div v-if="bookStore.currentBook.rating" class="mb-2">
          <span class="text-warning">
            <i v-for="n in 5" :key="n" class="fas" :class="n <= bookStore.currentBook.rating ? 'fa-star' : 'fa-star-half-alt'"></i>
          </span>
          <span class="ms-2">{{ bookStore.currentBook.rating.toFixed(1) }}</span>
        </div>
        <p class="fs-3 fw-bold text-primary my-3">${{ bookStore.currentBook.price.toFixed(2) }}</p>
        <p>{{ bookStore.currentBook.description }}</p>
        <div class="mb-3">
          <span class="badge bg-secondary me-1">{{ bookStore.currentBook.format?.toUpperCase() }}</span>
          <span v-for="cat in bookStore.currentBook.categories" :key="cat" class="badge bg-info me-1">{{ cat }}</span>
        </div>
        <button class="btn btn-primary btn-lg" @click="addToCart">
          <i class="fas fa-cart-plus me-2"></i>Add to Cart
        </button>
        <p v-if="cartStore.error" class="text-danger mt-2">{{ cartStore.error }}</p>
      </div>
    </div>

    <!-- Reviews Section -->
    <div v-if="bookStore.currentBook" class="mt-5">
      <h4>Reviews</h4>
      <div v-if="reviews.length === 0" class="text-muted">No reviews yet.</div>
      <div v-for="review in reviews" :key="review._id" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <strong>{{ review.user?.username || 'Anonymous' }}</strong>
            <span class="text-warning">
              <i v-for="n in 5" :key="n" class="fas" :class="n <= review.rating ? 'fa-star' : 'far fa-star'"></i>
            </span>
          </div>
          <p class="mt-2 mb-0">{{ review.comment }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBookStore } from '@/stores/book.store.js'
import { useCartStore } from '@/stores/cart.store.js'
import bookApi from '@/services/bookApi.js'

const route = useRoute()
const bookStore = useBookStore()
const cartStore = useCartStore()
const reviews = ref([])

const addToCart = async () => {
  await cartStore.addToCart(bookStore.currentBook._id)
}

onMounted(async () => {
  await bookStore.fetchBook(route.params.id)
  const res = await bookApi.listReviews(route.params.id)
  reviews.value = res.data.data
})
</script>
```

- [ ] **Step 3: Add routes to router/index.js**

```js
// Add to frontend/src/router/index.js routes array:
{
  path: '/books',
  name: 'BookStore',
  component: () => import('@/views/BookStoreView.vue'),
},
{
  path: '/books/:id',
  name: 'BookDetail',
  component: () => import('@/views/BookDetailView.vue'),
},
```

- [ ] **Step 4: Add nav link to MainLayoutTemplate.vue sidebar**

```html
<!-- Add to sidebar nav in MainLayoutTemplate.vue -->
<router-link to="/books" class="nav-link">
  <i class="fas fa-book me-2"></i>Book Store
</router-link>
```

- [ ] **Step 5: Run frontend build to verify**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add BookStore and BookDetail views with routing"
```

---

### Task 11: Frontend — Cart, Checkout, MyBooks, Seller Views

**Covers:** [S10]

**Files:**
- Create: `frontend/src/views/CartView.vue`
- Create: `frontend/src/views/CheckoutSuccessView.vue`
- Create: `frontend/src/views/MyBooksView.vue`
- Create: `frontend/src/views/SellerDashboardView.vue`
- Create: `frontend/src/views/SellerUploadView.vue`
- Modify: `frontend/src/router/index.js`

**Interfaces:**
- Consumes: `useCartStore`, `useBookStore`, `bookApi`
- Produces: Cart page, Checkout success, My Books, Seller Dashboard, Seller Upload

- [ ] **Step 1: Create CartView.vue**

```vue
<!-- frontend/src/views/CartView.vue -->
<template>
  <div class="container py-4">
    <h2 class="mb-4">Shopping Cart</h2>
    <div v-if="cartStore.loading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="!cartStore.cart?.items?.length" class="text-center py-5 text-muted">
      Your cart is empty. <router-link to="/books">Browse books</router-link>
    </div>
    <div v-else>
      <div v-for="item in cartStore.cart.items" :key="item._id" class="card mb-3">
        <div class="card-body d-flex align-items-center">
          <img :src="item.book?.coverImage || '/placeholder-book.png'" class="rounded me-3" style="width:60px;height:80px;object-fit:cover;" />
          <div class="flex-grow-1">
            <h6 class="mb-0">{{ item.book?.title }}</h6>
            <span class="text-primary fw-bold">${{ item.book?.price?.toFixed(2) }}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" @click="cartStore.updateQuantity(item._id, item.quantity - 1)">-</button>
            <span>{{ item.quantity }}</span>
            <button class="btn btn-sm btn-outline-secondary" @click="cartStore.updateQuantity(item._id, item.quantity + 1)">+</button>
            <button class="btn btn-sm btn-outline-danger" @click="cartStore.removeItem(item._id)"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
      <div class="text-end mt-4">
        <h4>Total: ${{ cartStore.totalAmount.toFixed(2) }}</h4>
        <button class="btn btn-success btn-lg" @click="handleCheckout">
          <i class="fas fa-credit-card me-2"></i>Checkout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart.store.js'

const cartStore = useCartStore()
const router = useRouter()

onMounted(() => cartStore.fetchCart())

const handleCheckout = async () => {
  try {
    const { url } = await cartStore.checkout()
    window.location.href = url
  } catch (e) { /* error shown in store */ }
}
</script>
```

- [ ] **Step 2: Create CheckoutSuccessView.vue**

```vue
<!-- frontend/src/views/CheckoutSuccessView.vue -->
<template>
  <div class="container py-5 text-center">
    <i class="fas fa-check-circle text-success fa-4x mb-3"></i>
    <h2>Payment Successful!</h2>
    <p class="text-muted">Your books are ready to download.</p>
    <router-link to="/my-books" class="btn btn-primary">Go to My Books</router-link>
  </div>
</template>
```

- [ ] **Step 3: Create MyBooksView.vue**

```vue
<!-- frontend/src/views/MyBooksView.vue -->
<template>
  <div class="container py-4">
    <h2 class="mb-4">My Books</h2>
    <div v-if="loading" class="text-center"><div class="spinner-border"></div></div>
    <div v-else-if="orders.length === 0" class="text-center py-5 text-muted">No purchases yet.</div>
    <div v-else>
      <div v-for="order in orders" :key="order._id" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <span class="text-muted small">{{ formatDate(order.createdAt) }}</span>
            <span class="badge" :class="order.status === 'paid' ? 'bg-success' : 'bg-warning'">{{ order.status }}</span>
          </div>
          <div v-for="item in order.items" :key="item.title" class="d-flex align-items-center mt-2">
            <span class="flex-grow-1">{{ item.title }}</span>
            <a v-if="order.status === 'paid'" :href="item.fileUrl" class="btn btn-sm btn-outline-primary" download>
              <i class="fas fa-download me-1"></i>Download
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatShortDate } from '@/utils/date.js'
import bookApi from '@/services/bookApi.js'

const orders = ref([])
const loading = ref(true)

const formatDate = (d) => formatShortDate(d)

onMounted(async () => {
  try {
    const res = await bookApi.listOrders()
    orders.value = res.data.data.filter(o => o.status === 'paid')
  } finally {
    loading.value = false
  }
})
</script>
```

- [ ] **Step 4: Create SellerDashboardView.vue**

```vue
<!-- frontend/src/views/SellerDashboardView.vue -->
<template>
  <div class="container py-4">
    <h2 class="mb-4">Seller Dashboard</h2>
    <div class="row g-4 mb-4">
      <div class="col-md-3"><div class="card text-center p-3"><div class="fs-3 fw-bold">{{ stats.totalBooks }}</div><div class="text-muted">Books</div></div></div>
      <div class="col-md-3"><div class="card text-center p-3"><div class="fs-3 fw-bold">{{ stats.totalSales }}</div><div class="text-muted">Sales</div></div></div>
      <div class="col-md-3"><div class="card text-center p-3"><div class="fs-3 fw-bold">${{ stats.totalRevenue?.toFixed(2) }}</div><div class="text-muted">Revenue</div></div></div>
      <div class="col-md-3"><div class="card text-center p-3"><div class="fs-3 fw-bold">{{ stats.totalOrders }}</div><div class="text-muted">Orders</div></div></div>
    </div>
    <router-link to="/seller/upload" class="btn btn-primary mb-3"><i class="fas fa-plus me-2"></i>Upload New Book</router-link>
    <div v-for="book in books" :key="book._id" class="card mb-2">
      <div class="card-body d-flex align-items-center">
        <span class="flex-grow-1">{{ book.title }}</span>
        <span class="badge me-2" :class="book.status === 'published' ? 'bg-success' : 'bg-secondary'">{{ book.status }}</span>
        <span class="me-3">${{ book.price.toFixed(2) }}</span>
        <router-link :to="`/seller/edit/${book._id}`" class="btn btn-sm btn-outline-secondary">Edit</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bookApi from '@/services/bookApi.js'

const stats = ref({})
const books = ref([])

onMounted(async () => {
  const [statsRes, booksRes] = await Promise.all([
    bookApi.getSellerDashboard(),
    bookApi.getSellerBooks(),
  ])
  stats.value = statsRes.data.data
  books.value = booksRes.data.data
})
</script>
```

- [ ] **Step 5: Create SellerUploadView.vue**

```vue
<!-- frontend/src/views/SellerUploadView.vue -->
<template>
  <div class="container py-4">
    <h2 class="mb-4">Upload Book</h2>
    <div class="row">
      <div class="col-md-8">
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Title *</label>
            <input v-model="form.title" type="text" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Author</label>
            <input v-model="form.author" type="text" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea v-model="form.description" class="form-control" rows="4"></textarea>
          </div>
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Price ($) *</label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" class="form-control" required />
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Format</label>
              <select v-model="form.format" class="form-select">
                <option value="pdf">PDF</option>
                <option value="epub">ePub</option>
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Categories</label>
              <input v-model="form.categories" type="text" class="form-control" placeholder="Manga, Artbook" />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Cover Image URL</label>
            <input v-model="form.coverImage" type="url" class="form-control" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ebook File URL *</label>
            <input v-model="form.fileUrl" type="url" class="form-control" required />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Uploading...' : 'Publish Book' }}
          </button>
          <p v-if="error" class="text-danger mt-2">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import bookApi from '@/services/bookApi.js'

const router = useRouter()
const submitting = ref(false)
const error = ref(null)
const form = ref({
  title: '', author: '', description: '', price: 0,
  format: 'pdf', categories: '', coverImage: '', fileUrl: '',
})

const submit = async () => {
  submitting.value = true
  error.value = null
  try {
    await bookApi.createBook({
      ...form.value,
      categories: form.value.categories.split(',').map(c => c.trim()).filter(Boolean),
    })
    router.push('/seller/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Upload failed'
  } finally {
    submitting.value = false
  }
}
</script>
```

- [ ] **Step 6: Add routes to router/index.js**

```js
// Add to routes array:
{ path: '/cart', name: 'Cart', component: () => import('@/views/CartView.vue'), meta: { requiresAuth: true } },
{ path: '/checkout/success', name: 'CheckoutSuccess', component: () => import('@/views/CheckoutSuccessView.vue'), meta: { requiresAuth: true } },
{ path: '/my-books', name: 'MyBooks', component: () => import('@/views/MyBooksView.vue'), meta: { requiresAuth: true } },
{ path: '/seller/dashboard', name: 'SellerDashboard', component: () => import('@/views/SellerDashboardView.vue'), meta: { requiresAuth: true } },
{ path: '/seller/upload', name: 'SellerUpload', component: () => import('@/views/SellerUploadView.vue'), meta: { requiresAuth: true } },
```

- [ ] **Step 7: Add sidebar nav links**

```html
<router-link to="/cart" class="nav-link">
  <i class="fas fa-shopping-cart me-2"></i>Cart
</router-link>
<router-link to="/my-books" class="nav-link">
  <i class="fas fa-book-open me-2"></i>My Books
</router-link>
<router-link to="/seller/dashboard" class="nav-link">
  <i class="fas fa-store me-2"></i>Seller Dashboard
</router-link>
```

- [ ] **Step 8: Run frontend build**

```bash
cd frontend && npm run build
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add Cart, Checkout, MyBooks, Seller views"
```

---

### Task 12: Deploy Configuration

**Covers:** [S9]

**Files:**
- Modify: `render.yaml`
- Modify: `frontend/vite.config.js` (add proxy for book-service)

**Interfaces:**
- Consumes: All book-service routes
- Produces: Render deployment config, Vite dev proxy

- [ ] **Step 1: Update render.yaml**

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

- [ ] **Step 2: Add Vite proxy for book-service**

In `frontend/vite.config.js`, add to the `server.proxy` config:

```js
'/api/books': { target: VITE_BOOK_API_URL || 'http://localhost:5001', changeOrigin: true },
'/api/cart': { target: VITE_BOOK_API_URL || 'http://localhost:5001', changeOrigin: true },
'/api/orders': { target: VITE_BOOK_API_URL || 'http://localhost:5001', changeOrigin: true },
'/api/seller': { target: VITE_BOOK_API_URL || 'http://localhost:5001', changeOrigin: true },
'/api/downloads': { target: VITE_BOOK_API_URL || 'http://localhost:5001', changeOrigin: true },
```

- [ ] **Step 3: Add env var to frontend .env.example**

```
VITE_BOOK_API_URL=http://localhost:5001
```

- [ ] **Step 4: Final frontend build check**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add render.yaml frontend/
git commit -m "feat(deploy): add BookService to Render config and Vite proxy"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Scaffolding | book-service/package.json, server.js, config/ |
| 2 | Models | models/Book.js, Cart.js, Order.js, Review.js, Payout.js |
| 3 | Auth middleware | middlewares/auth.middleware.js, seller.middleware.js |
| 4 | Book CRUD | controllers/book.controller.js, routes/book.routes.js |
| 5 | Cart | controllers/cart.controller.js, routes/cart.routes.js |
| 6 | Payment & Orders | controllers/order.controller.js, services/stripe.service.js |
| 7 | Reviews | controllers/review.controller.js, routes/review.routes.js |
| 8 | Download & Seller | controllers/download.controller.js, seller.controller.js |
| 9 | Frontend stores | services/bookApi.js, stores/book.store.js, cart.store.js |
| 10 | BookStore & Detail views | BookStoreView.vue, BookDetailView.vue |
| 11 | Cart & Seller views | CartView.vue, MyBooksView.vue, SellerDashboardView.vue |
| 12 | Deploy config | render.yaml, vite.config.js proxy |
