const mongoose = require('mongoose');
const { PAYMENT_GATEWAYS, SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const fxSchema = mongoose.Schema({
    sourceCurrency: { type: String, enum: SUPPORTED_CURRENCIES, default: 'USD' },
    settlementCurrency: { type: String, enum: SUPPORTED_CURRENCIES, default: 'USD' },
    rate: { type: Number, min: 0, default: 1 },
    provider: { type: String, trim: true, default: 'internal' },
    quotedAt: { type: Date, default: null },
}, { _id: false });

const feeBreakdownSchema = mongoose.Schema({
    platformFeeRate: { type: Number, min: 0, max: 0.5, default: 0.12 },
    platformFeeAmount: { type: Number, min: 0, default: 0 },
    creatorNetAmount: { type: Number, min: 0, default: 0 },
    gatewayFeeAmount: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
}, { _id: false });

const paymentSchema = mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        index: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
    },
    gateway: {
        type: String,
        enum: PAYMENT_GATEWAYS,
        required: true,
    },
    status: {
        type: String,
        enum: ['requires_action', 'authorized', 'held', 'failed', 'refunded', 'released', 'disputed'],
        default: 'requires_action',
        index: true,
    },
    providerPaymentIntentId: {
        type: String,
        trim: true,
        index: true,
        default: '',
    },
    providerChargeId: {
        type: String,
        trim: true,
        default: '',
    },
    clientSecret: {
        type: String,
        trim: true,
        default: '',
    },
    idempotencyKey: {
        type: String,
        trim: true,
        index: true,
        default: '',
    },
    paymentMethodLabel: {
        type: String,
        trim: true,
        default: '',
    },
    feeBreakdown: {
        type: feeBreakdownSchema,
        default: () => ({}),
    },
    fx: {
        type: fxSchema,
        default: () => ({}),
    },
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    failureReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    releasedAt: { type: Date, default: null },
}, {
    timestamps: true,
});

paymentSchema.index({ request: 1, status: 1 });
paymentSchema.index({ requester: 1, createdAt: -1 });
paymentSchema.index({ creator: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
