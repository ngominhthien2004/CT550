function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value || !String(value).trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return String(value).trim();
}

function getPort() {
    return parseInt(process.env.PORT || '5001', 10);
}

function getMongoUri() {
    return process.env.MONGODB_URI || 'mongodb://localhost:27017/ct550-books';
}

function getJwtSecret() {
    return getRequiredEnv('JWT_SECRET');
}

function getStripeSecretKey() {
    return process.env.STRIPE_SECRET_KEY || '';
}

function getStripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
}

function getCloudinaryCloudName() {
    return process.env.CLOUDINARY_CLOUD_NAME || '';
}

function getCloudinaryApiKey() {
    return process.env.CLOUDINARY_API_KEY || '';
}

function getCloudinaryApiSecret() {
    return process.env.CLOUDINARY_API_SECRET || '';
}

function getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
}

function getAllowedOrigins() {
    const rawOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
    const parsedOrigins = rawOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (parsedOrigins.length > 0) {
        return parsedOrigins;
    }

    if (process.env.NODE_ENV !== 'production') {
        return [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
        ];
    }

    return [];
}

module.exports = {
    getRequiredEnv,
    getPort,
    getMongoUri,
    getJwtSecret,
    getStripeSecretKey,
    getStripeWebhookSecret,
    getCloudinaryCloudName,
    getCloudinaryApiKey,
    getCloudinaryApiSecret,
    getFrontendUrl,
    getAllowedOrigins,
};
