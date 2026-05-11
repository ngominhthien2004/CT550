const mongoose = require('mongoose');

const requestEventSchema = mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
        index: true,
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
    },
    fromStatus: {
        type: String,
        trim: true,
        default: '',
    },
    toStatus: {
        type: String,
        trim: true,
        default: '',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: () => ({}),
    },
}, {
    timestamps: true,
});

requestEventSchema.index({ request: 1, createdAt: -1 });

const RequestEvent = mongoose.model('RequestEvent', requestEventSchema);

module.exports = RequestEvent;
