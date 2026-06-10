const mongoose = require('mongoose');

const requestRevisionSchema = mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
        index: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    round: {
        type: Number,
        required: true,
        min: 1,
        max: 2,
    },
    notes: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
    },
}, {
    timestamps: true,
});

requestRevisionSchema.index({ request: 1, round: 1 }, { unique: true });

const RequestRevision = mongoose.model('RequestRevision', requestRevisionSchema);

module.exports = RequestRevision;
