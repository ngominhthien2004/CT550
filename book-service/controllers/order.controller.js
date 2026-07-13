const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Book = require('../models/Book');

const parseObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return null;
    }
    return new mongoose.Types.ObjectId(value);
};

const isOrderParticipant = (order, user) => {
    if (user.role === 'admin') {
        return true;
    }

    if (order.buyer.toString() === user._id.toString()) {
        return true;
    }

    return order.items.some((item) => item.seller.toString() === user._id.toString());
};

const isOrderSeller = (order, user) => {
    if (user.role === 'admin') {
        return true;
    }

    return order.items.some((item) => item.seller.toString() === user._id.toString());
};

const getCoverImage = (book) => {
    return book.coverImages && book.coverImages.length > 0 ? book.coverImages[0] : '';
};

const createOrder = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.book');

        if (!cart || cart.items.length === 0) {
            res.status(400);
            return next(new Error('Cart is empty'));
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const cartItem of cart.items) {
            const book = cartItem.book;

            if (!book || !book.isActive || book.status !== 'published') {
                res.status(400);
                return next(new Error(`Book "${book?.title || 'unknown'}" is no longer available`));
            }

            if (book.stock >= 0 && cartItem.quantity > book.stock) {
                res.status(400);
                return next(new Error(`Only ${book.stock} copies of "${book.title}" available`));
            }

            const itemTotal = book.price * cartItem.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                book: book._id,
                title: book.title,
                coverImage: getCoverImage(book),
                price: book.price,
                quantity: cartItem.quantity,
                seller: book.seller,
                ebookFileUrl: book.ebookFile?.url || ''
            });
        }

        const order = await Order.create({
            buyer: req.user._id,
            items: orderItems,
            totalAmount,
            currency: 'usd',
            status: 'pending',
            paymentStatus: 'pending'
        });

        await Cart.deleteOne({ user: req.user._id });

        const populatedOrder = await Order.findById(order._id)
            .populate('items.book', 'title coverImages')
            .populate('buyer', '_id username displayName avatar');

        res.status(201).json(populatedOrder);
    } catch (error) {
        next(error);
    }
};

const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ buyer: req.user._id })
            .populate('items.book', 'title coverImages')
            .populate('buyer', '_id username displayName avatar')
            .sort({ createdAt: -1 })
            .lean();

        res.json(orders);
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const orderId = parseObjectId(req.params.id);
        if (!orderId) {
            res.status(400);
            return next(new Error('Invalid order ID'));
        }

        const order = await Order.findById(orderId)
            .populate('items.book', 'title coverImages')
            .populate('buyer', '_id username displayName avatar');

        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        if (!isOrderParticipant(order, req.user)) {
            res.status(403);
            return next(new Error('Not authorized to view this order'));
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = parseObjectId(req.params.id);
        if (!orderId) {
            res.status(400);
            return next(new Error('Invalid order ID'));
        }

        const { status } = req.body;
        const allowedStatuses = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded'];
        if (!allowedStatuses.includes(status)) {
            res.status(400);
            return next(new Error('Invalid order status'));
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        if (!isOrderSeller(order, req.user)) {
            res.status(403);
            return next(new Error('Not authorized to update this order'));
        }

        const validTransitions = {
            pending: ['paid', 'cancelled'],
            paid: ['fulfilled', 'refunded'],
            fulfilled: [],
            cancelled: [],
            refunded: []
        };

        if (order.status === status) {
            return res.json(order);
        }

        if (!validTransitions[order.status].includes(status)) {
            res.status(400);
            return next(new Error(`Cannot transition order from ${order.status} to ${status}`));
        }

        order.status = status;

        if (status === 'paid') {
            order.paymentStatus = 'paid';
        } else if (status === 'cancelled') {
            order.paymentStatus = 'failed';
        } else if (status === 'refunded') {
            order.paymentStatus = 'refunded';
        }

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('items.book', 'title coverImages')
            .populate('buyer', '_id username displayName avatar');

        res.json(populatedOrder);
    } catch (error) {
        next(error);
    }
};

const getSellerOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'items.seller': req.user._id })
            .populate('items.book', 'title coverImages')
            .populate('buyer', '_id username displayName avatar')
            .sort({ createdAt: -1 })
            .lean();

        res.json(orders);
    } catch (error) {
        next(error);
    }
};

const getDownloadUrl = async (req, res, next) => {
    try {
        const orderId = parseObjectId(req.params.id);
        const itemId = parseObjectId(req.params.itemId);

        if (!orderId || !itemId) {
            res.status(400);
            return next(new Error('Invalid order or item ID'));
        }

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404);
            return next(new Error('Order not found'));
        }

        if (order.buyer.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Not authorized to download this ebook'));
        }

        if (!['paid', 'fulfilled'].includes(order.status)) {
            res.status(403);
            return next(new Error('Order must be paid before downloading'));
        }

        const item = order.items.id(itemId);
        if (!item) {
            res.status(404);
            return next(new Error('Order item not found'));
        }

        res.json({ downloadUrl: item.ebookFileUrl });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getSellerOrders,
    getDownloadUrl
};
