const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    translations: {
        en: { type: String },
        vi: { type: String },
        ja: { type: String }
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
