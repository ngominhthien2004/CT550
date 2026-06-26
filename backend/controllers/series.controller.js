const Series = require('../models/Series');
const Artwork = require('../models/Artwork');
const Chapter = require('../models/Chapter');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

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

    // For novel series, create a linked Artwork to hold chapters
    if (type === 'novel') {
      const artwork = await Artwork.create({
        user: req.user._id,
        title,
        description: description || '',
        type: 'novel',
        images: [],
        tags: tags || [],
        chapterCount: 0,
      });

      seriesData.novelArtwork = artwork._id;
    }

    const series = await Series.create(seriesData);

    // Set the series reference on the linked artwork
    if (type === 'novel') {
      await Artwork.findByIdAndUpdate(seriesData.novelArtwork, {
        series: series._id,
      });
    }

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name');

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
      .populate('artworks', 'title images type viewCount likeCount commentCount')
      .populate('novelArtwork', 'title type chapterCount wordCount viewCount likeCount commentCount')
      .sort(sortOrder);

    // Compute aggregated stats for each series
    const enriched = series.map((s) => {
      const doc = s.toObject();
      if (doc.type === 'novel' && doc.novelArtwork) {
        doc.totalViews = doc.novelArtwork.viewCount || 0;
        doc.totalLikes = doc.novelArtwork.likeCount || 0;
        doc.totalComments = doc.novelArtwork.commentCount || 0;
      } else if ((doc.type === 'manga' || doc.type === 'illust') && doc.artworks?.length > 0) {
        doc.totalViews = doc.artworks.reduce((sum, a) => sum + (a.viewCount || 0), 0);
        doc.totalLikes = doc.artworks.reduce((sum, a) => sum + (a.likeCount || 0), 0);
        doc.totalComments = doc.artworks.reduce((sum, a) => sum + (a.commentCount || 0), 0);
      } else {
        doc.totalViews = 0;
        doc.totalLikes = 0;
        doc.totalComments = 0;
      }
      // totalReactions is not tracked yet — keep as 0
      return doc;
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single series by ID
// @route   GET /api/series/:id
// @access  Private
const getSeriesById = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');
    const series = await Series.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type viewCount likeCount commentCount')
      .populate('novelArtwork', 'title type chapterCount wordCount viewCount likeCount commentCount');

    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    // Increment view count (skip for owner)
    const isOwner = req.user && String(series.user._id || series.user) === String(req.user._id);
    if (!isOwner) {
      series.totalViews += 1;
      await series.save({ validateBeforeSave: false });
    }

    // Compute aggregated stats
    const doc = series.toObject();
    if (doc.type === 'novel' && doc.novelArtwork) {
      doc.totalViews = (doc.novelArtwork.viewCount || 0) + (isOwner ? 0 : 1); // +1 for page view if not owner
      doc.totalLikes = doc.novelArtwork.likeCount || 0;
      doc.totalComments = doc.novelArtwork.commentCount || 0;
    } else if ((doc.type === 'manga' || doc.type === 'illust') && doc.artworks?.length > 0) {
      doc.totalViews = doc.artworks.reduce((sum, a) => sum + (a.viewCount || 0), 0) + (isOwner ? 0 : 1);
      doc.totalLikes = doc.artworks.reduce((sum, a) => sum + (a.likeCount || 0), 0);
      doc.totalComments = doc.artworks.reduce((sum, a) => sum + (a.commentCount || 0), 0);
    }

    res.json(doc);
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

    // If the series title changed and it has a linked novel artwork, sync the artwork title
    if (title !== undefined && series.type === 'novel' && series.novelArtwork) {
      await Artwork.findByIdAndUpdate(series.novelArtwork, {
        title,
      });
    }

    const populated = await Series.findById(updated._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name');

    res.json(populated);
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

    // For novel series, optionally delete the linked artwork and its chapters
    if (series.type === 'novel' && series.novelArtwork) {
      await Chapter.deleteMany({ artwork: series.novelArtwork });
      await Artwork.findByIdAndDelete(series.novelArtwork);
    }

    // For manga/illust series, unlink artworks
    if ((series.type === 'manga' || series.type === 'illust') && series.artworks?.length > 0) {
      await Artwork.updateMany(
        { _id: { $in: series.artworks } },
        { $unset: { series: '' } }
      );
    }

    await Series.findByIdAndDelete(req.params.id);

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

    if (series.type !== 'manga' && series.type !== 'illust') {
      res.status(400);
      return next(new Error('Artworks can only be added to manga or illust series'));
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

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type');

    res.json(populated);
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

    if (series.type !== 'manga' && series.type !== 'illust') {
      res.status(400);
      return next(new Error('Artworks can only be removed from manga or illust series'));
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

    const populated = await Series.findById(series._id)
      .populate('user', 'username avatar')
      .populate('tags', 'name')
      .populate('artworks', 'title images type');

    res.json(populated);
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

    if (series.type !== 'manga' && series.type !== 'illust') {
      res.status(400);
      return next(new Error('Only manga or illust series support artwork reordering'));
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
      .populate('artworks', 'title images type');

    res.json(populated);
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
      .populate('artworks', 'title images type');

    res.json(populated);
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
