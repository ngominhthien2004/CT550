const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: -1, min: -1 },
    coverImages: [{ type: String }],
    ebookFile: {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        originalName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 }
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isActive: { type: Boolean, default: true },
    soldCount: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, lowercase: true, trim: true }]
}, {
    timestamps: true
});

const Book = mongoose.model('Book', bookSchema, 'book_books');

module.exports = Book;
