const mongoose = require('mongoose');

const bookmarkSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Artwork'
    },
    folder: {
        type: String,
        trim: true,
        default: 'default',
        maxlength: 100
    }
}, {
    timestamps: true
});

bookmarkSchema.index({ user: 1, artwork: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
