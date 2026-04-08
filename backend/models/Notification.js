const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    artwork: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork'
    },
    type: {
        type: String,
        enum: ['follow', 'like', 'bookmark', 'comment', 'system'],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
