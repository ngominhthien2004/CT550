const mongoose = require('mongoose')

const browseHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true,
    },
  },
  { timestamps: true }
)

// Compound index for efficient per-user queries sorted by recency
browseHistorySchema.index({ user: 1, createdAt: -1 })
// Unique compound to avoid duplicate entries per user per artwork
browseHistorySchema.index({ user: 1, artwork: 1 }, { unique: true })

module.exports = mongoose.model('BrowseHistory', browseHistorySchema)
