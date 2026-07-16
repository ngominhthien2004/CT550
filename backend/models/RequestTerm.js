const mongoose = require('mongoose');
const { AGE_RATINGS, WORK_TYPES } = require('../utils/requestValidation');

const requestTermSchema = mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    tier: {
        type: String,
        trim: true,
        maxlength: 80,
        default: 'Basic',
    },
    targetPrice: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'USD',
        maxlength: 8,
    },
    acceptedWorkTypes: [{
        type: String,
        enum: WORK_TYPES,
        required: true,
    }],
    estimatedDays: {
        type: Number,
        required: true,
        min: 14,
        max: 60,
    },
    maxOpenRequests: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
    },
    acceptedAgeRatings: [{
        type: String,
        enum: AGE_RATINGS,
        default: 'all',
    }],
    rules: {
        type: String,
        required: true,
        trim: true,
        maxlength: 4000,
    },
    forbiddenTopics: [{
        type: String,
        trim: true,
        maxlength: 80,
    }],
    preferredStyles: [{
        type: String,
        trim: true,
        maxlength: 80,
    }],
    strengths: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
    },
    isOpen: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});

requestTermSchema.index({ creator: 1, isOpen: 1, createdAt: -1 });

const RequestTerm = mongoose.model('RequestTerm', requestTermSchema);

module.exports = RequestTerm;
