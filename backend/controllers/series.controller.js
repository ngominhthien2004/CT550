const Series = require('../models/Series');
const Artwork = require('../models/Artwork');
const Watchlist = require('../models/Watchlist');

const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { getOrSet, getOrSetWithL2, delByPrefix, TTL, buildKey } = require('../utils/cache');
const { computeSeriesStats } = require('../utils/seriesStats');
const { recomputeSeriesTags } = require('../utils/recomputeSeriesTags');
const { createNotification } = require('../utils/notification');

function validateObjectId(id, name = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Invalid ${name} format`);
    err.statusCode = 400;
    throw err;
  }
}

// @desc    Create a new series
// @route   POST /api/series
// @access  Private
const createSeries = async (req, res, next) => {
  try {
    const { title, description, type, coverImage, tags } = req.body;

    if (!title || !type) {
      res.status(400);
      return next(new Error('Title and type are required'));
    }

    if (!['manga', 'novel', 'illust'].includes(type)) {
      res.status(400);
      return next(new Error('Series type must be "manga", "novel", or "illust"'));
    }

    const seriesData = {
      user: req.user._id,
      title,
      description: description || '',
      type,
      coverImage: coverImage || '',
      tags: tags || [],
    };

    const series = await Series.create(seriesData);

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name');

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's series list
// @route   GET /api/series
// @access  Private
const getMySeries = async (req, res, next) => {
  try {
    const { type } = req.query;
    const sortOrder = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const filter = { user: req.user._id };
    if (type && ['manga', 'novel', 'illust'].includes(type)) {
      filter.type = type;
    }

    const series = await Series.find(filter)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount')
      .sort(sortOrder);

    // Compute aggregated stats for each series.
    const enriched = series.map(computeSeriesStats);

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single series by ID
// @route   GET /api/series/:id
// @access  Public
const getSeriesById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');

    const cacheKey = `series:detail:${req.params.id}`;
    const seriesData = await getOrSetWithL2(cacheKey, async () => {
      const series = await Series.findById(req.params.id)
        .populate('user', 'username avatar')
        .populate('tags', 'name')
        .populate({
          path: 'artworks',
          select: 'title images type viewCount likeCount bookmarkCount commentCount tags createdAt',
          populate: { path: 'tags', select: 'name' },
        })
        .lean();

      if (!series) return null;

      // Compute aggregated stats.
      const enriched = computeSeriesStats(series);

      // Suggest tags from the NEWEST artwork (by createdAt) so the author can
      // pre-fill tags when adding a new work to this series.
      const rawArtworks = series.artworks || [];
      let newest = null;
      for (const artwork of rawArtworks) {
        const at = new Date(artwork.createdAt || 0);
        if (!newest || at > new Date(newest.createdAt || 0)) newest = artwork;
      }
      const suggestedTags = (newest?.tags || [])
        .map((tag) => tag?.name)
        .filter(Boolean)
        .slice(0, 10);
      enriched.suggestedTags = suggestedTags;

      // tags/createdAt only needed for the suggestion — keep payload lean.
      rawArtworks.forEach((artwork) => {
        delete artwork.tags;
        delete artwork.createdAt;
      });

      return enriched;
    }, TTL.PUBLIC_PROFILE);

    if (!seriesData) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    res.json(seriesData);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a series
// @route   PUT /api/series/:id
// @access  Private
const updateSeries = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    // Ownership check
    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to update this series'));
    }

    const { title, description, isCompleted, coverImage } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        res.status(400);
        return next(new Error('Title cannot be empty'));
      }
      series.title = title;
    }
    if (description !== undefined) series.description = description;
    if (isCompleted !== undefined) series.isCompleted = isCompleted;
    if (coverImage !== undefined) series.coverImage = coverImage;

    const updated = await series.save();

    const populated = await Series.findById(updated._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount');

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    res.json(computeSeriesStats(populated));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a series
// @route   DELETE /api/series/:id
// @access  Private
const deleteSeries = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to delete this series'));
    }

    // For manga/illust/novel series, unlink artworks
    if (series.artworks?.length > 0) {
      await Artwork.updateMany(
        { _id: { $in: series.artworks } },
        { $unset: { series: '' } }
      );
    }

    await Series.findByIdAndDelete(req.params.id);

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    res.json({ message: 'Series deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add an artwork to a manga/illust series
// @route   POST /api/series/:id/artworks
// @access  Private
const addArtworkToSeries = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to modify this series'));
    }

    if (series.type !== 'manga' && series.type !== 'illust' && series.type !== 'novel') {
      res.status(400);
      return next(new Error('Artworks can only be added to manga, illust, or novel series'));
    }

    const { artworkId } = req.body;

    if (!artworkId) {
      res.status(400);
      return next(new Error('Artwork ID is required'));
    }

    // Verify artwork exists, belongs to same user, and matches series type
    validateObjectId(artworkId, 'artwork ID');
    const artwork = await Artwork.findById(artworkId);

    if (!artwork) {
      res.status(404);
      return next(new Error('Artwork not found'));
    }

    if (String(artwork.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('You can only add your own artworks to a series'));
    }

    if (artwork.type !== series.type) {
      res.status(400);
      return next(new Error(`Only ${series.type} artworks can be added to a ${series.type} series`));
    }

    // Prevent duplicates
    const alreadyAdded = series.artworks.some(
      (id) => String(id) === String(artworkId)
    );
    if (alreadyAdded) {
      res.status(400);
      return next(new Error('Artwork is already in this series'));
    }

    series.artworks.push(artworkId);
    series.artworkCount = series.artworks.length;
    await series.save({ validateBeforeSave: false });

    // Link the artwork to this series
    artwork.series = series._id;
    await artwork.save({ validateBeforeSave: false });

    // Recompute series tags from all artworks
    await recomputeSeriesTags(series._id);

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount');

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    // Notify all users who have this series in their watchlist
    try {
      const watchers = await Watchlist.find({ series: series._id }).select('user');
      const chapterIndex = series.artworkCount;

      for (const watcher of watchers) {
        await createNotification({
          userId: watcher.user,
          actorId: req.user._id,
          artworkId: artworkId,
          type: 'series_new_chapter',
          message: `New chapter "${artwork.title}" added to "${series.title}" (Chapter ${chapterIndex})`,
          metadata: {
            seriesId: series._id,
            seriesTitle: series.title,
            artworkId: artworkId,
            chapterIndex
          }
        });
      }
    } catch (_notifError) {
      // Notification errors should not fail the main request
    }

    res.json(computeSeriesStats(populated));
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an artwork from a manga/illust series
// @route   DELETE /api/series/:id/artworks/:artworkId
// @access  Private
const removeArtworkFromSeries = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to modify this series'));
    }

    if (series.type !== 'manga' && series.type !== 'illust' && series.type !== 'novel') {
      res.status(400);
      return next(new Error('Artworks can only be removed from manga, illust, or novel series'));
    }

    const { artworkId } = req.params;
    validateObjectId(artworkId, 'artwork ID');

    const index = series.artworks.findIndex(
      (id) => String(id) === String(artworkId)
    );

    if (index === -1) {
      res.status(404);
      return next(new Error('Artwork not found in this series'));
    }

    series.artworks.splice(index, 1);
    series.artworkCount = series.artworks.length;
    await series.save({ validateBeforeSave: false });

    // Unlink the artwork from this series
    await Artwork.findByIdAndUpdate(artworkId, { $unset: { series: '' } });

    // Recompute series tags from all remaining artworks
    await recomputeSeriesTags(series._id);

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount');

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    res.json(computeSeriesStats(populated));
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder artworks in a manga/illust series
// @route   PUT /api/series/:id/reorder
// @access  Private
const reorderSeriesArtworks = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to modify this series'));
    }

    if (series.type !== 'manga' && series.type !== 'illust' && series.type !== 'novel') {
      res.status(400);
      return next(new Error('Only manga, illust, or novel series support artwork reordering'));
    }

    const { artworkIds } = req.body;

    if (!Array.isArray(artworkIds)) {
      res.status(400);
      return next(new Error('artworkIds must be an array of artwork IDs'));
    }

    // Validate that the provided IDs match the current series artworks
    const currentIds = series.artworks.map(String).sort();
    const providedIds = artworkIds.map(String).sort();

    if (currentIds.length !== providedIds.length ||
        currentIds.some((id, i) => id !== providedIds[i])) {
      res.status(400);
      return next(new Error('artworkIds must contain exactly the same artwork IDs as the series'));
    }

    series.artworks = artworkIds;
    await series.save({ validateBeforeSave: false });

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount');

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    // Invalidate user's series list cache
    delByPrefix(`user:series:${req.user._id}`);

    res.json(computeSeriesStats(populated));
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a cover image for a series
// @route   PUT /api/series/:id/cover
// @access  Private
const uploadSeriesCover = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id);

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    if (String(series.user) !== String(req.user._id)) {
      res.status(403);
      return next(new Error('Not authorized to update this series'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload an image file'));
    }

    // Upload to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: process.env.CLOUDINARY_FOLDER || 'illuwrl-artworks',
        resource_type: 'image',
      });
      series.coverImage = result.secure_url;
    } catch (err) {
      res.status(500);
      return next(new Error('Cover image upload to cloud storage failed'));
    }

    await series.save({ validateBeforeSave: false });

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount bookmarkCount commentCount');

    // Invalidate series cache
    delByPrefix(`series:detail:${req.params.id}`);

    res.json(computeSeriesStats(populated));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSeries,
  getMySeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
  addArtworkToSeries,
  removeArtworkFromSeries,
  reorderSeriesArtworks,
  uploadSeriesCover,
};
