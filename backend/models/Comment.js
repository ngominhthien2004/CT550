const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Artwork'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: false,
        trim: true,
        maxlength: 2000
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    stickerUrl: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

commentSchema.path('content').validate(function (value) {
    const hasContent = Boolean(value && value.trim());
    const hasSticker = Boolean(this.stickerUrl && this.stickerUrl.trim());
    return hasContent || hasSticker;
}, 'Either content or stickerUrl is required');

commentSchema.index({ artwork: 1, createdAt: -1 });
commentSchema.index({ artwork: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
