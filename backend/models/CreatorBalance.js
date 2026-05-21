const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const creatorBalanceSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
    },
    pendingAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    availableAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    lifetimeEarnedAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    lifetimePayoutAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
});

creatorBalanceSchema.index({ creator: 1, currency: 1 }, { unique: true });

const CreatorBalance = mongoose.model('CreatorBalance', creatorBalanceSchema);

module.exports = CreatorBalance;
