/**
 * Custom error class that carries an error code for frontend i18n mapping.
 * - `message`: human-readable English message (used as fallback)
 * - `code`: machine-readable error code (e.g. 'TAG_NAME_REQUIRED') for frontend translation
 * - `statusCode`: HTTP status code (default 400)
 */
class AppError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

module.exports = AppError;
