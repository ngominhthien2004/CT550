const mongoose = require('mongoose');

const likeSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Artwork'
    }
}, {
    timestamps: true
});

likeSchema.index({ user: 1, artwork: 1 }, { unique: true });
likeSchema.index({ user: 1, createdAt: -1 });

const Like = mongoose.model('Like', likeSchema);

module.exports = Like;