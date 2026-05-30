const mongoose = require('mongoose');

const chapterSchema = mongoose.Schema({
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 500000,
    },
    chapterNumber: {
        type: Number,
        required: true,
        min: 1,
    },
    wordCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Compound index for fast lookup
chapterSchema.index({ artwork: 1, chapterNumber: 1 }, { unique: true });

// Pre-save hook to calculate word count
chapterSchema.pre('save', function () {
    if (this.content) {
        const text = this.content.trim();
        this.wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    }
});

const Chapter = mongoose.model('Chapter', chapterSchema);
module.exports = Chapter;
