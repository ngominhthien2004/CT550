const mongoose = require('mongoose');

const viewEventSchema = new mongoose.Schema({
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Indexes for analytics queries
viewEventSchema.index({ artwork: 1, createdAt: -1 });
viewEventSchema.index({ createdAt: -1 });

// TTL: drop view-event documents 90 days after creation. View counts are
// already aggregated onto the Artwork document, so retaining individual
// events longer has no product value and would grow the collection
// unbounded.
viewEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('ViewEvent', viewEventSchema);
