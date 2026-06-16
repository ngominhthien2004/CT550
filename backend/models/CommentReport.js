const mongoose = require('mongoose');

const commentReportSchema = mongoose.Schema({
    comment: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment', index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'inappropriate', 'harassment', 'other'],
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, trim: true, default: '' },
}, {
    timestamps: true,
});

commentReportSchema.index({ comment: 1, reportedBy: 1 });
commentReportSchema.index({ status: 1, createdAt: -1 });

const CommentReport = mongoose.model('CommentReport', commentReportSchema);
module.exports = CommentReport;
