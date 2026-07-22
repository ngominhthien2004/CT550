const Review = require('../models/Review');
const Book = require('../models/Book');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// ── Helpers ────────────────────────────────────────────────

const recalcBookRating = async (bookId) => {
    const stats = await Review.aggregate([
        { $match: { book: new mongoose.Types.ObjectId(bookId) } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const reviewCount = stats.length > 0 ? stats[0].count : 0;

    await Book.findByIdAndUpdate(bookId, { rating, reviewCount });
};

// ── Controllers ────────────────────────────────────────────

// GET /api/book-service/books/:id/reviews — list reviews for a book
exports.listReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [reviews, total] = await Promise.all([
            Review.find({ book: req.params.id })
                .populate('user', '_id username displayName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Review.countDocuments({ book: req.params.id })
        ]);

        res.json({
            data: reviews,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/book-service/books/:id/reviews — create review
exports.createReview = async (req, res, next) => {
    try {
        const { rating, content } = req.body;
        const bookId = req.params.id;

        // Validate rating
        const parsedRating = Number(rating);
        if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            res.status(400);
            return next(new Error('Rating must be a number between 1 and 5'));
        }

        // Check book exists
        const book = await Book.findById(bookId);
        if (!book || !book.isActive) {
            res.status(404);
            return next(new Error('Book not found'));
        }

        // Check if user already reviewed this book
        const existing = await Review.findOne({ user: req.user._id, book: bookId });
        if (existing) {
            res.status(400);
            return next(new Error('You have already reviewed this book'));
        }

        // Check user has purchased this book
        const hasPurchased = await Order.findOne({
            buyer: req.user._id,
            status: 'paid',
            'items.book': bookId
        });
        if (!hasPurchased) {
            res.status(403);
            return next(new Error('You must purchase this book before reviewing'));
        }

        const review = await Review.create({
            user: req.user._id,
            book: bookId,
            rating: parsedRating,
            content: content?.trim() || ''
        });

        // Update book rating
        await recalcBookRating(bookId);

        const populated = await Review.findById(review._id)
            .populate('user', '_id username displayName avatar')
            .lean();

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// PUT /api/book-service/reviews/:id — update review
exports.updateReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            res.status(404);
            return next(new Error('Review not found'));
        }

        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to update this review'));
        }

        const { rating, content } = req.body;

        if (rating !== undefined) {
            const parsedRating = Number(rating);
            if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                res.status(400);
                return next(new Error('Rating must be a number between 1 and 5'));
            }
            review.rating = parsedRating;
        }

        if (content !== undefined) {
            review.content = String(content).trim();
        }

        await review.save();
        await recalcBookRating(review.book);

        const populated = await Review.findById(review._id)
            .populate('user', '_id username displayName avatar')
            .lean();

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/book-service/reviews/:id — delete review
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            res.status(404);
            return next(new Error('Review not found'));
        }

        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Not authorized to delete this review'));
        }

        const bookId = review.book;
        await review.deleteOne();
        await recalcBookRating(bookId);

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        next(error);
    }
};
