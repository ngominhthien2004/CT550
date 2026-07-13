const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { getAllowedOrigins, getPort } = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Force IPv4 DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = getPort();
const allowedOrigins = getAllowedOrigins();
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

// Security middleware
app.use(helmet());

// CORS
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && (allowedOrigins.includes(origin) || isLocalDevOrigin(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stripe webhook — must receive raw body before JSON parser
const { handleStripeWebhook } = require('./controllers/webhook.controller');
app.post('/api/book-service/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Book-service API routes
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'book-service' });
});

app.use('/api/book-service', apiRouter);

app.get('/', (req, res) => {
    res.json({ message: 'CT550 Book Service' });
});

const bookRoutes = require('./routes/book.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const sellerRoutes = require('./routes/seller.routes');

app.use('/api/book-service/books', bookRoutes);
app.use('/api/book-service/categories', categoryRoutes);
app.use('/api/book-service/cart', cartRoutes);
app.use('/api/book-service/orders', orderRoutes);
app.use('/api/book-service/checkout', checkoutRoutes);
app.use('/api/book-service/seller', sellerRoutes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Book service is running on port ${PORT}`);
});

module.exports = { app, server };
