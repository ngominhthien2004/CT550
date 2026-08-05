const mongoose = require('mongoose');

const watchlistSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    series: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Series'
    }
}, {
    timestamps: true
});

// Prevent duplicate watchlist entries
watchlistSchema.index({ user: 1, series: 1 }, { unique: true });

// For efficient queries: get all series watched by a user
watchlistSchema.index({ user: 1, createdAt: -1 });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
