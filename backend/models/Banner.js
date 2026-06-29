const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
  link: { type: String, required: true },
  title: { type: String, default: '' },
  type: { type: String, enum: ['home', 'illust', 'manga', 'gif', 'novel'], default: 'home' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
