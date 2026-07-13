const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' }
}, {
    timestamps: true
});

categorySchema.pre('save', function (next) {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

const Category = mongoose.model('Category', categorySchema, 'book_categories');

module.exports = Category;
