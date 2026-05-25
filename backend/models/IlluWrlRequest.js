const mongoose = require('mongoose');

const illuWrlRequestSchema = mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    message: {
        type: String,
        trim: true,
        maxlength: 10000,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'cancelled'],
        default: 'pending',
        index: true,
    },
}, {
    timestamps: true,
});

illuWrlRequestSchema.index(
    { requester: 1, recipient: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' },
    }
);

const IlluWrlRequest = mongoose.model('IlluWrlRequest', illuWrlRequestSchema);

module.exports = IlluWrlRequest;
