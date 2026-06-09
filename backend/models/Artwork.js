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
        trim: true
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
        enum: ['all', 'r-18', 'r-18g'],
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
    isDraft: {
        type: Boolean,
        default: false
    },
    gifNotes: {
        type: String,
        trim: true,
        default: ''
    },
    // Novel-specific fields
    novelContent: {
        type: String,
        maxlength: 500000,
        trim: true,
        default: '',
    },
    novelFormat: {
        type: String,
        enum: ['oneshot', 'series'],
        default: 'oneshot',
    },
    novelSeriesName: {
        type: String,
        trim: true,
        default: '',
    },
    chapterCount: {
        type: Number,
        default: 1,
    },
    // Real wordCount field (stored, filterable, sortable)
    wordCount: {
        type: Number,
        default: 0,
    },
    // Moderation fields
    isHidden: { type: Boolean, default: false },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    hiddenAt: { type: Date, default: null },
    hiddenReason: { type: String, trim: true, default: '' },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Pre-save hook: calculate wordCount from novelContent
artworkSchema.pre('save', function () {
    if (this.type === 'novel' && this.novelContent) {
        const text = this.novelContent.trim();
        this.wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    }
});

// Virtual: estimated reading time based on word count
artworkSchema.virtual('readingTime').get(function () {
    const words = this.wordCount || 0;
    if (words === 0) return 0;
    return Math.ceil(words / 200);
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;
