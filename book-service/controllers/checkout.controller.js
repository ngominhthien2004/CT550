const mongoose = require('mongoose');
const stripe = require('../config/stripe');
const Order = require('../models/Order');
const { getFrontendUrl } = require('../config/env');

const createCheckoutSession = async (req, res, next) => {
    try {
        if (!stripe) {
            res.status(503);
            return next(new Error('Stripe is not configured'));
        }

        const { orderId } = req.body;
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            res.status(400);
            return next(new Error('Invalid order ID'));
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        if (order.buyer.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to checkout this order'));
        }

        if (order.status !== 'pending') {
            res.status(400);
            return next(new Error('Order is not available for checkout'));
        }

        const frontendUrl = getFrontendUrl();
        const lineItems = order.items.map((item) => ({
            price_data: {
                currency: order.currency || 'usd',
                product_data: {
                    name: item.title,
                    images: item.coverImage ? [item.coverImage] : []
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItems,
            success_url: `${frontendUrl}/bookstore/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/bookstore/checkout/cancel?orderId=${order._id}`,
            metadata: {
                orderId: String(order._id)
            }
        });

        order.stripeSessionId = session.id;
        await order.save();

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCheckoutSession
};
