const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true },
    coverImage: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ebookFileUrl: { type: String, default: '' }
}, { _id: true });

const orderSchema = mongoose.Schema({
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'usd' },
    status: {
        type: String,
        enum: ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    stripeSessionId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    metadata: { type: Object, default: {} }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema, 'book_orders');

module.exports = Order;
