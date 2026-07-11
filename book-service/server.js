const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { getAllowedOrigins } = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// Force IPv4 DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 5001;
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

// Body parser
app.use(express.json());

// Health check
app.get('/api/books', (req, res) => {
    res.json({ message: 'Book service is running!' });
});

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Book service is running on port ${PORT}`);
});

module.exports = { app, server };
