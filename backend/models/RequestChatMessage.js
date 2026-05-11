const mongoose = require('mongoose');

const chatAttachmentSchema = mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
}, { _id: false });

const requestChatMessageSchema = mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Request',
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    content: {
        type: String,
        trim: true,
        maxlength: 4000,
        default: '',
    },
    attachments: [chatAttachmentSchema],
    isSystem: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

requestChatMessageSchema.index({ request: 1, createdAt: 1 });

const RequestChatMessage = mongoose.model('RequestChatMessage', requestChatMessageSchema);

module.exports = RequestChatMessage;
