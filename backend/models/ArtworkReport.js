const mongoose = require('mongoose');

const artworkReportSchema = mongoose.Schema({
    artwork: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Artwork', index: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'inappropriate', 'copyright', 'harassment', 'nsfw', 'other'],
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, trim: true, default: '' },
}, {
    timestamps: true,
});

artworkReportSchema.index({ artwork: 1, reportedBy: 1 });
artworkReportSchema.index({ status: 1, createdAt: -1 });

const ArtworkReport = mongoose.model('ArtworkReport', artworkReportSchema);
module.exports = ArtworkReport;
