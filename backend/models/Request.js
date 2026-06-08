const mongoose = require('mongoose');
const {
    AGE_RATINGS,
    REQUEST_STATUSES,
    VISIBILITY_VALUES,
    WORK_TYPES,
} = require('../utils/requestValidation');

const requestFileSchema = mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
}, { _id: false });

const fanLetterSchema = mongoose.Schema({
    rating: { type: Number, min: 1, max: 5 },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    createdAt: { type: Date, default: null },
}, { _id: false });

const requestSchema = mongoose.Schema({
    term: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'RequestTerm',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 12000,
    },
    workType: {
        type: String,
        enum: WORK_TYPES,
        required: true,
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 60,
    }],
    specifics: {
        pose: { type: String, trim: true, maxlength: 600, default: '' },
        outfit: { type: String, trim: true, maxlength: 600, default: '' },
        mood: { type: String, trim: true, maxlength: 600, default: '' },
        lighting: { type: String, trim: true, maxlength: 600, default: '' },
        angle: { type: String, trim: true, maxlength: 600, default: '' },
        other: { type: String, trim: true, maxlength: 1200, default: '' },
    },
    proposedAmount: {
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
    visibility: {
        type: String,
        enum: VISIBILITY_VALUES,
        default: 'private',
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    ageRating: {
        type: String,
        enum: AGE_RATINGS,
        default: 'all',
    },
    status: {
        type: String,
        enum: Object.values(REQUEST_STATUSES),
        default: REQUEST_STATUSES.PENDING,
        index: true,
    },
    referenceImages: [requestFileSchema],
    draftFiles: [requestFileSchema],
    finalFiles: [requestFileSchema],
    giftFiles: [requestFileSchema],
    revisionCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 2,
    },
    autoCompleteAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    extensionRequestedAt: { type: Date, default: null },
    extensionDays: { type: Number, default: 0, min: 0, max: 30 },
    chatClosedAt: { type: Date, default: null },
    licenseTier: {
        type: String,
        enum: ['personal', 'commercial'],
        default: 'personal',
    },
    fanLetter: {
        type: fanLetterSchema,
        default: () => ({}),
    },
}, {
    timestamps: true,
});

requestSchema.index({ creator: 1, status: 1, createdAt: -1 });
requestSchema.index({ requester: 1, status: 1, createdAt: -1 });
requestSchema.index({ visibility: 1, status: 1, createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
