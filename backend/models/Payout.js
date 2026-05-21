const mongoose = require('mongoose');
const { PAYOUT_METHODS, SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const payoutSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    payoutMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayoutMethod',
    },
    method: {
        type: String,
        enum: PAYOUT_METHODS,
        required: true,
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
    scheduleType: {
        type: String,
        enum: ['on_demand', 'monthly'],
        default: 'on_demand',
    },
    status: {
        type: String,
        enum: ['pending_review', 'processing', 'paid', 'failed', 'cancelled'],
        default: 'pending_review',
        index: true,
    },
    providerPayoutId: {
        type: String,
        trim: true,
        default: '',
    },
    failureReason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: '',
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

payoutSchema.index({ creator: 1, createdAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = Payout;
