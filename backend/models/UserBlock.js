const mongoose = require('mongoose');

const userBlockSchema = mongoose.Schema({
    blocker: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    blocked: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
}, {
    timestamps: true,
});

userBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const UserBlock = mongoose.model('UserBlock', userBlockSchema);

module.exports = UserBlock;
