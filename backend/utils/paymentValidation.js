const DEFAULT_PLATFORM_FEE_RATE = 0.12;
const MIN_PLATFORM_FEE_RATE = 0.1;
const MAX_PLATFORM_FEE_RATE = 0.15;

const SUPPORTED_CURRENCIES = ['USD', 'JPY', 'VND', 'EUR', 'SGD'];
const PAYMENT_GATEWAYS = ['stripe', 'paypal', 'vnpay', 'momo', 'crypto', 'bank_qr'];
const PAYOUT_METHODS = ['bank_transfer', 'paypal', 'wise', 'stripe_connect', 'local_bank'];

const PAYOUT_MINIMUMS = {
    JPY: 5000,
    USD: 35,
    VND: 900000,
    EUR: 35,
    SGD: 45,
};

function normalizeCurrency(currency) {
    const normalized = String(currency || 'USD').trim().toUpperCase();
    return SUPPORTED_CURRENCIES.includes(normalized) ? normalized : 'USD';
}

function normalizeFeeRate(rate) {
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate)) {
        return DEFAULT_PLATFORM_FEE_RATE;
    }

    return Math.min(Math.max(numericRate, MIN_PLATFORM_FEE_RATE), MAX_PLATFORM_FEE_RATE);
}

function roundMoney(amount, currency) {
    const normalizedCurrency = normalizeCurrency(currency);
    const zeroDecimalCurrencies = new Set(['JPY', 'VND']);
    const precision = zeroDecimalCurrencies.has(normalizedCurrency) ? 0 : 2;
    const factor = 10 ** precision;

    return Math.round(Number(amount || 0) * factor) / factor;
}

function calculatePaymentBreakdown({ amount, platformFeeRate, currency }) {
    const normalizedCurrency = normalizeCurrency(currency);
    const normalizedAmount = roundMoney(amount, normalizedCurrency);
    const feeRate = normalizeFeeRate(platformFeeRate);
    const platformFeeAmount = roundMoney(normalizedAmount * feeRate, normalizedCurrency);
    const creatorNetAmount = roundMoney(Math.max(normalizedAmount - platformFeeAmount, 0), normalizedCurrency);

    return {
        amount: normalizedAmount,
        currency: normalizedCurrency,
        platformFeeRate: feeRate,
        platformFeeAmount,
        creatorNetAmount,
    };
}

function validatePaymentIntentPayload(payload = {}) {
    const errors = [];
    const amount = Number(payload.amount);
    const targetPrice = Number(payload.targetPrice || 0);
    const gateway = String(payload.gateway || '').trim().toLowerCase();

    if (!Number.isFinite(amount) || amount <= 0) {
        errors.push('Payment amount must be greater than 0.');
    }

    if (targetPrice > 0 && amount < targetPrice) {
        errors.push('Payment amount must meet or exceed the creator target price.');
    }

    if (!PAYMENT_GATEWAYS.includes(gateway)) {
        errors.push('Unsupported payment gateway.');
    }

    if (!SUPPORTED_CURRENCIES.includes(normalizeCurrency(payload.currency))) {
        errors.push('Unsupported currency.');
    }

    return { valid: errors.length === 0, errors };
}

function validatePayoutRequest(payload = {}) {
    const errors = [];
    const currency = normalizeCurrency(payload.currency);
    const amount = Number(payload.amount);
    const method = String(payload.method || '').trim().toLowerCase();
    const minimum = PAYOUT_MINIMUMS[currency] || PAYOUT_MINIMUMS.USD;

    if (!Number.isFinite(amount) || amount < minimum) {
        errors.push(`Payout amount must meet the minimum ${minimum} ${currency}.`);
    }

    if (!PAYOUT_METHODS.includes(method)) {
        errors.push('Unsupported payout method.');
    }

    return { valid: errors.length === 0, errors };
}

function validateQrIntentPayload(payload = {}) {
    const errors = [];
    const expiresInMinutes = Number(payload.expiresInMinutes ?? 15);

    if (!String(payload.bankCode || '').trim()) {
        errors.push('Bank code is required for QR payment.');
    }

    if (!String(payload.bankAccount || '').trim()) {
        errors.push('Bank account is required for QR payment.');
    }

    if (!String(payload.accountName || '').trim()) {
        errors.push('Account name is required for QR payment.');
    }

    if (!String(payload.transferContent || '').trim()) {
        errors.push('Transfer content is required for QR reconciliation.');
    }

    if (!Number.isFinite(expiresInMinutes) || expiresInMinutes < 1 || expiresInMinutes > 60) {
        errors.push('QR expiry must be between 1 and 60 minutes.');
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    DEFAULT_PLATFORM_FEE_RATE,
    MAX_PLATFORM_FEE_RATE,
    MIN_PLATFORM_FEE_RATE,
    PAYMENT_GATEWAYS,
    PAYOUT_METHODS,
    PAYOUT_MINIMUMS,
    SUPPORTED_CURRENCIES,
    calculatePaymentBreakdown,
    normalizeCurrency,
    normalizeFeeRate,
    roundMoney,
    validatePaymentIntentPayload,
    validatePayoutRequest,
    validateQrIntentPayload,
};
