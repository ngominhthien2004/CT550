const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({
  _id: { type: String, required: true },  // singleton key: 'global'
  aiDetectionEnabled: { type: Boolean, default: true },
  autoTaggingEnabled: { type: Boolean, default: false },
}, { timestamps: true });

// In-memory cache
let cache = null;

settingSchema.statics.getSettings = async function () {
  if (cache) return cache;
  cache = await this.findById('global');
  if (!cache) {
    cache = await this.create({ _id: 'global' });
  }
  return cache;
};

settingSchema.statics.updateSettings = async function (updates) {
  const settings = await this.findByIdAndUpdate(
    'global',
    { $set: updates },
    { new: true, upsert: true }
  );
  cache = settings; // invalidate cache
  return settings;
};

settingSchema.statics.invalidateCache = function () {
  cache = null;
};

module.exports = mongoose.model('Setting', settingSchema);
