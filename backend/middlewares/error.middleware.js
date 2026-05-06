const errorHandler = (err, req, res, next) => {
    console.error('Error caught in middleware:', err);
    const statusCode = err?.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);

    if (err?.code === 'LIMIT_FILE_SIZE') {
        res.status(413);
        return res.json({
            message: 'Uploaded file exceeds the maximum allowed size.',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    }

    if (err?.message === 'Images only!') {
        res.status(400);
    }

    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
