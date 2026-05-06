const DEFAULT_DEV_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
];

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value || !String(value).trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return String(value).trim();
}

function getJwtSecret() {
    return getRequiredEnv('JWT_SECRET');
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
        return DEFAULT_DEV_ORIGINS;
    }

    return [];
}

function getMaxUploadFileSizeBytes() {
    const rawValue = process.env.MAX_UPLOAD_FILE_SIZE_MB;
    const parsedValue = Number.parseInt(rawValue || '10', 10);
    const safeValue = Number.isNaN(parsedValue) || parsedValue <= 0 ? 10 : parsedValue;
    return safeValue * 1024 * 1024;
}

module.exports = {
    getAllowedOrigins,
    getJwtSecret,
    getMaxUploadFileSizeBytes,
    getRequiredEnv,
};
