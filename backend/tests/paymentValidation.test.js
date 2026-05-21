const assert = require('node:assert/strict');
const test = require('node:test');

const {
    DEFAULT_PLATFORM_FEE_RATE,
    SUPPORTED_CURRENCIES,
    calculatePaymentBreakdown,
    normalizeCurrency,
    validatePaymentIntentPayload,
    validateQrIntentPayload,
    validatePayoutRequest,
} = require('../utils/paymentValidation');

test('calculates configurable platform fee and creator net amount', () => {
    const breakdown = calculatePaymentBreakdown({
        amount: 10000,
        platformFeeRate: 0.15,
        currency: 'JPY',
    });

    assert.equal(breakdown.amount, 10000);
    assert.equal(breakdown.platformFeeRate, 0.15);
    assert.equal(breakdown.platformFeeAmount, 1500);
    assert.equal(breakdown.creatorNetAmount, 8500);
    assert.equal(breakdown.currency, 'JPY');
});

test('uses default fee rate and normalizes supported currencies', () => {
    assert.equal(normalizeCurrency('vnd'), 'VND');
    assert.equal(normalizeCurrency('unknown'), 'USD');
    assert.ok(SUPPORTED_CURRENCIES.includes('JPY'));

    const breakdown = calculatePaymentBreakdown({ amount: 200, currency: 'usd' });
    assert.equal(breakdown.platformFeeRate, DEFAULT_PLATFORM_FEE_RATE);
    assert.equal(breakdown.platformFeeAmount, 24);
    assert.equal(breakdown.creatorNetAmount, 176);
});

test('validates payment intent payload for supported gateway and target price', () => {
    const valid = validatePaymentIntentPayload({
        amount: 120,
        targetPrice: 100,
        gateway: 'stripe',
        currency: 'USD',
    });
    const invalid = validatePaymentIntentPayload({
        amount: 99,
        targetPrice: 100,
        gateway: 'cash',
        currency: 'USD',
    });

    assert.equal(valid.valid, true);
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join('\n'), /target price/i);
    assert.match(invalid.errors.join('\n'), /gateway/i);
});

test('validates bank QR intent metadata for manual reconciliation', () => {
    const valid = validateQrIntentPayload({
        bankCode: 'VCB',
        bankAccount: '1234567890',
        accountName: 'ILLUWRL ESCROW',
        transferContent: 'REQ-ABC123',
        expiresInMinutes: 15,
    });
    const invalid = validateQrIntentPayload({
        bankCode: 'VCB',
        bankAccount: '',
        transferContent: '',
        expiresInMinutes: 0,
    });

    assert.equal(valid.valid, true);
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join('\n'), /bank account/i);
    assert.match(invalid.errors.join('\n'), /transfer content/i);
    assert.match(invalid.errors.join('\n'), /expiry/i);
});

test('accepts bank_qr as a supported payment intent gateway', () => {
    const result = validatePaymentIntentPayload({
        amount: 200000,
        targetPrice: 150000,
        gateway: 'bank_qr',
        currency: 'VND',
    });

    assert.equal(result.valid, true);
});

test('validates payout minimums per settlement currency', () => {
    const valid = validatePayoutRequest({ amount: 5000, currency: 'JPY', method: 'bank_transfer' });
    const invalid = validatePayoutRequest({ amount: 4999, currency: 'JPY', method: 'bank_transfer' });

    assert.equal(valid.valid, true);
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join('\n'), /minimum/i);
});
