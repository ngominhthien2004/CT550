const errorHandler = (err, req, res, next) => {
    console.error('Error caught in middleware:', err);
    const statusCode = err?.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message).join(', ');
        return res.status(400).json({
            message: messages || 'Validation failed',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            message: `Invalid ${err.path}: ${err.value}`,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        return res.status(409).json({
            message: `Duplicate value for: ${field}`,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    return res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
