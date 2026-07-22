const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, default: '', maxlength: 2000, trim: true }
}, {
    timestamps: true
});

// One review per user per book
reviewSchema.index({ user: 1, book: 1 }, { unique: true });
// For listing reviews by book
reviewSchema.index({ book: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema, 'book_reviews');
