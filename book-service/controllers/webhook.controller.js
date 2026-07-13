const stripe = require('../config/stripe');
const Order = require('../models/Order');
const Book = require('../models/Book');
const SellerProfile = require('../models/SellerProfile');
const { getStripeWebhookSecret } = require('../config/env');

const handleCheckoutCompleted = async (session) => {
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
        return;
    }

    if (order.status !== 'pending') {
        return;
    }

    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.stripePaymentIntentId = session.payment_intent ? String(session.payment_intent) : '';
    await order.save();

    for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (!book) {
            continue;
        }

        if (book.stock >= 0) {
            book.stock = Math.max(0, book.stock - item.quantity);
        }
        book.soldCount += item.quantity;
        await book.save();

        await SellerProfile.findOneAndUpdate(
            { user: item.seller },
            {
                $inc: {
                    totalSales: item.quantity,
                    totalRevenue: item.price * item.quantity
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }
};

const handleCheckoutExpired = async (session) => {
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
        return;
    }

    if (order.status === 'pending') {
        order.status = 'cancelled';
        order.paymentStatus = 'failed';
        await order.save();
    }
};

const handleStripeWebhook = async (req, res, next) => {
    try {
        const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const signature = req.headers['stripe-signature'] || '';
        const webhookSecret = getStripeWebhookSecret();

        let event;

        if (stripe && webhookSecret && signature) {
            try {
                event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            } catch (error) {
                res.status(400);
                return next(new Error(`Webhook signature verification failed: ${error.message}`));
            }
        } else {
            event = JSON.parse(payload.toString());
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'checkout.session.expired':
                await handleCheckoutExpired(event.data.object);
                break;
            default:
                break;
        }

        res.json({ received: true });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    handleStripeWebhook
};
