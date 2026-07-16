const mongoose = require('mongoose');

const readingProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true,
    },
    progressPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    scrollPosition: {
        type: Number,
        default: 0,
    },
    lastReadAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

readingProgressSchema.index({ user: 1, artwork: 1 }, { unique: true });

const ReadingProgress = mongoose.model('ReadingProgress', readingProgressSchema);
module.exports = ReadingProgress;
