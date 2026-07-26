const mongoose = require('mongoose');

const artworkSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['illust', 'manga', 'gif', 'novel'],
        default: 'illust'
    },
    images: [{
        type: String,
        required: true
    }],
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    ageRating: {
        type: String,
        required: true,
        enum: ['all', 'r-18'],
        default: 'all'
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likeCount: {
        type: Number,
        default: 0
    },
    bookmarkCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    reportCount: { type: Number, default: 0 },
    // Novel-specific fields
    novelContent: {
        type: String,
        maxlength: 500000,
        trim: true,
        default: '',
    },
    // Real wordCount field (stored, filterable, sortable)
    wordCount: {
        type: Number,
        default: 0,
    },
    // Series link (for manga artworks belonging to a series)
    series: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Series',
        default: null,
    },
    // Moderation fields
    isHidden: { type: Boolean, default: false },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hiddenAt: { type: Date, default: null },
    hiddenReason: { type: String, trim: true, default: '' },
    // Interaction settings
    commentsEnabled: { type: Boolean, default: true },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

/**
 * Check whether a text is CJK-heavy (Chinese/Japanese/Korean).
 * Returns true if more than 30 % of characters are CJK.
 */
function isCJKText(text) {
    if (!text) return false;
    const chars = [...text];
    if (chars.length === 0) return false;
    const cjkRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\uac00-\ud7af\u1100-\u11ff]/;
    const cjkCount = chars.filter(c => cjkRegex.test(c)).length;
    return (cjkCount / chars.length) > 0.3;
}

/**
 * Count "words" in a way that works for both CJK and non-CJK text.
 * - CJK-heavy text → count all non-whitespace characters (standard for JP/CN/KR novels)
 * - Non-CJK text    → count whitespace-separated tokens (standard for EN/VN novels)
 */
function countContentWords(text) {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    if (isCJKText(trimmed)) {
        return [...trimmed].filter(c => !/\s/.test(c)).length;
    }
    return trimmed.split(/\s+/).filter(Boolean).length;
}

// Pre-save hook: calculate wordCount from novelContent
artworkSchema.pre('save', function () {
    if (this.type === 'novel' && this.novelContent) {
        const text = this.novelContent.trim();
        const cjk = isCJKText(text);
        this.wordCount = text ? countContentWords(text) : 0;
    }
});

// Virtual: estimated reading time based on word count
artworkSchema.virtual('readingTime').get(function () {
    const words = this.wordCount || 0;
    if (words === 0) return 0;
    const rate = isCJKText(this.novelContent || '') ? 400 : 200;
    return Math.ceil(this.wordCount / rate);
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;
