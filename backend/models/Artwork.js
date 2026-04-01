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
        enum: ['illust', 'manga', 'ugoira', 'novel'],
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
    isDraft: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;
