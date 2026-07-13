const mongoose = require('mongoose');

const viewEventSchema = new mongoose.Schema({
  artwork: { type: mongoose.Schema.Types.ObjectId, ref: 'Artwork', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Indexes for analytics queries
viewEventSchema.index({ artwork: 1, createdAt: -1 });
viewEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ViewEvent', viewEventSchema);
