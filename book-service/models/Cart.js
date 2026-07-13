const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    addedAt: { type: Date, default: Date.now }
}, { _id: true });

const cartSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: false, updatedAt: true }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
