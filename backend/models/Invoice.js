const mongoose = require('mongoose');
const { SUPPORTED_CURRENCIES } = require('../utils/paymentValidation');

const invoiceLineSchema = mongoose.Schema({
    label: { type: String, required: true, trim: true, maxlength: 160 },
    amount: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = mongoose.Schema({
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
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    currency: {
        type: String,
        enum: SUPPORTED_CURRENCIES,
        required: true,
    },
    subtotalAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    platformFeeAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    lines: [invoiceLineSchema],
    status: {
        type: String,
        enum: ['issued', 'void', 'refunded'],
        default: 'issued',
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
