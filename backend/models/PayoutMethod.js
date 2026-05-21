const mongoose = require('mongoose');
const { PAYOUT_METHODS, SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const payoutMethodSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    method: {
        type: String,
        enum: PAYOUT_METHODS,
        required: true,
    },
    settlementCurrency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
    },
    country: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 2,
        default: 'JP',
    },
    accountLabel: {
        type: String,
        trim: true,
        maxlength: 120,
        required: true,
    },
    providerAccountId: {
        type: String,
        trim: true,
        default: '',
    },
    maskedAccount: {
        type: String,
        trim: true,
        default: '',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending_verification', 'verified', 'disabled'],
        default: 'pending_verification',
    },
}, {
    timestamps: true,
});

payoutMethodSchema.index({ creator: 1, isDefault: 1 });

const PayoutMethod = mongoose.model('PayoutMethod', payoutMethodSchema);

module.exports = PayoutMethod;
