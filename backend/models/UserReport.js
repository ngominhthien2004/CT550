const mongoose = require('mongoose');

const userReportSchema = mongoose.Schema({
    reportedUser: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'inappropriate', 'harassment', 'impersonation', 'other'],
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, trim: true, default: '' },
}, {
    timestamps: true,
});

userReportSchema.index({ reportedUser: 1, reportedBy: 1 });
userReportSchema.index({ status: 1, createdAt: -1 });

const UserReport = mongoose.model('UserReport', userReportSchema);
module.exports = UserReport;
