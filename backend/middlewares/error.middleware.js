const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    console.error('Error caught in middleware:', err);
    const statusCode = err?.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);

    // Handle AppError — carries a machine-readable code
    if (err instanceof AppError) {
        return res.json({
            message: err.message,
            code: err.code,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    if (err?.code === 'LIMIT_FILE_SIZE') {
        res.status(413);
        return res.json({
            message: 'Uploaded file exceeds the maximum allowed size.',
            code: 'FILE_TOO_LARGE',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    if (err?.message === 'Images only!') {
        res.status(400);
    }

    // Custom upload errors
    if (err?.message && (
        err.message.includes('GIF uploads required') ||
        err.message.includes('ZIP archives are not accepted')
    )) {
        res.status(400);
    }

    // Handle Mongoose validation errors — return 400 instead of 500
    if (err.name === 'ValidationError') {
        res.status(400);
        const messages = Object.values(err.errors).map(e => e.message).join(', ');
        return res.json({
            message: messages || 'Validation failed',
            code: 'VALIDATION_ERROR',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Handle Mongoose CastError (invalid ObjectId format) — return 400
    if (err.name === 'CastError') {
        res.status(400);
        return res.json({
            message: `Invalid ${err.path}: ${err.value}`,
            code: 'INVALID_ID',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Handle MongoDB duplicate key errors — return 409
    if (err.code === 11000) {
        res.status(409);
        const field = Object.keys(err.keyValue).join(', ');
        return res.json({
            message: `Duplicate value for: ${field}`,
            code: 'DUPLICATE_VALUE',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    // Handle rate limit exceeded — return 429
    if (err.statusCode === 429) {
        return res.status(429).json({
            message: err.message || 'Too many requests, please try again later.',
            code: 'RATE_LIMITED',
            retryAfter: err.retryAfter || null,
        });
    }

    // Generic 500 fallback
    if (!err.message || statusCode >= 500) {
        return res.json({
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    res.json({
        message: err.message,
        code: err.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
