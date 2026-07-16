const mongoose = require('mongoose');

const seriesSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['manga', 'novel', 'illust'],
      required: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    // Ordered list of artworks in this series (for manga, illust, and novel types)
    artworks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
      },
    ],
    artworkCount: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for querying user's series
seriesSchema.index({ user: 1, createdAt: -1 });
seriesSchema.index({ user: 1, type: 1 });

const Series = mongoose.model('Series', seriesSchema);
module.exports = Series;
