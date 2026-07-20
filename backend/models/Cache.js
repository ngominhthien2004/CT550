const mongoose = require('mongoose');

/**
 * Cache model with TTL index for persistent L2 caching across server restarts.
 * Data is automatically removed by MongoDB when expiresAt is reached.
 */
const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
}, {
  timestamps: false,
  versionKey: false,
});

module.exports = mongoose.model('Cache', cacheSchema);
