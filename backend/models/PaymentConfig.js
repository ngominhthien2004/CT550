const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const paymentConfigSchema = mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    platformFeeRate: {
        type: Number,
        required: true,
        min: 0.1,
        max: 0.15,
        default: 0.12,
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        default: 'USD',
    },
    country: {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 2,
        default: '',
    },
    campaignName: {
        type: String,
        trim: true,
        maxlength: 120,
        default: '',
    },
    startsAt: {
        type: Date,
        default: null,
    },
    endsAt: {
        type: Date,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);

module.exports = PaymentConfig;
