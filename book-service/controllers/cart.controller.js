const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Book = require('../models/Book');

const parseObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return null;
    }
    return new mongoose.Types.ObjectId(value);
};

const parsePositiveInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.book', 'title price coverImages stock status isActive ebookFile.url seller')
            .lean();

        if (!cart) {
            return res.json({ items: [] });
        }

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

const addToCart = async (req, res, next) => {
    try {
        const { bookId, quantity } = req.body;

        const bookObjectId = parseObjectId(bookId);
        if (!bookObjectId) {
            res.status(400);
            return next(new Error('Invalid book ID'));
        }

        const book = await Book.findById(bookObjectId);
        if (!book || !book.isActive || book.status !== 'published') {
            res.status(400);
            return next(new Error('Book is not available for purchase'));
        }

        const requestedQuantity = parsePositiveInt(quantity, 1);
        if (book.stock >= 0 && requestedQuantity > book.stock) {
            res.status(400);
            return next(new Error(`Only ${book.stock} copies available`));
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const existingItem = cart.items.find(
            (item) => item.book.toString() === bookObjectId.toString()
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + requestedQuantity;
            if (book.stock >= 0 && newQuantity > book.stock) {
                res.status(400);
                return next(new Error(`Only ${book.stock} copies available`));
            }
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({ book: bookObjectId, quantity: requestedQuantity });
        }

        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.book', 'title price coverImages stock status isActive ebookFile.url seller');

        res.status(200).json(populatedCart);
    } catch (error) {
        next(error);
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        const itemObjectId = parseObjectId(itemId);
        if (!itemObjectId) {
            res.status(400);
            return next(new Error('Invalid cart item ID'));
        }

        const newQuantity = parsePositiveInt(quantity, null);
        if (newQuantity === null) {
            res.status(400);
            return next(new Error('Quantity must be a positive number'));
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404);
            return next(new Error('Cart not found'));
        }

        const item = cart.items.id(itemObjectId);
        if (!item) {
            res.status(404);
            return next(new Error('Cart item not found'));
        }

        if (newQuantity <= 0) {
            item.deleteOne();
            await cart.save();
            return res.json(cart);
        }

        const book = await Book.findById(item.book);
        if (!book || !book.isActive || book.status !== 'published') {
            res.status(400);
            return next(new Error('Book is no longer available'));
        }

        if (book.stock >= 0 && newQuantity > book.stock) {
            res.status(400);
            return next(new Error(`Only ${book.stock} copies available`));
        }

        item.quantity = newQuantity;
        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.book', 'title price coverImages stock status isActive ebookFile.url seller');

        res.json(populatedCart);
    } catch (error) {
        next(error);
    }
};

const removeFromCart = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const itemObjectId = parseObjectId(itemId);
        if (!itemObjectId) {
            res.status(400);
            return next(new Error('Invalid cart item ID'));
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404);
            return next(new Error('Cart not found'));
        }

        const item = cart.items.id(itemObjectId);
        if (!item) {
            res.status(404);
            return next(new Error('Cart item not found'));
        }

        item.deleteOne();
        await cart.save();

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

const clearCart = async (req, res, next) => {
    try {
        await Cart.deleteOne({ user: req.user._id });
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
