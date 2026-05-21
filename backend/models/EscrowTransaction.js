const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const escrowTransactionSchema = mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Payment',
        index: true,
    },
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
        index: true,
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    walletOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    type: {
        type: String,
        enum: ['hold', 'release', 'refund', 'platform_fee', 'gateway_fee', 'fx_adjustment', 'payout'],
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
    },
    balanceAfter: {
        type: Number,
        min: 0,
        default: 0,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
    },
}, {
    timestamps: true,
});

escrowTransactionSchema.index({ walletOwner: 1, currency: 1, createdAt: -1 });
escrowTransactionSchema.index({ request: 1, createdAt: -1 });

const EscrowTransaction = mongoose.model('EscrowTransaction', escrowTransactionSchema);

module.exports = EscrowTransaction;
