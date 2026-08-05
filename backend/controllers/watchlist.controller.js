const Watchlist = require('../models/Watchlist');
const Series = require('../models/Series');
const mongoose = require('mongoose');
const { delByPrefix, getOrSetWithL2, TTL } = require('../utils/cache');

function validateObjectId(id, name = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Invalid ${name} format`);
    err.statusCode = 400;
    throw err;
  }
}

// @desc    Add a series to watchlist
// @route   POST /api/series/:id/watchlist
// @access  Private
const addToWatchlist = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');

    const series = await Series.findById(req.params.id);
    if (!series) {
      res.status(404);
      return next(new Error('Series not found'));
    }

    // Prevent watching own series
    if (String(series.user) === String(req.user._id)) {
      res.status(400);
      return next(new Error('You cannot watch your own series'));
    }

    // Check if already watching
    const existing = await Watchlist.findOne({
      user: req.user._id,
      series: req.params.id
    });

    if (existing) {
      res.status(400);
      return next(new Error('Series is already in your watchlist'));
    }

    const watchlist = await Watchlist.create({
      user: req.user._id,
      series: req.params.id
    });

    // Invalidate cache
    delByPrefix(`watchlist:${req.user._id}`);
    delByPrefix(`series:watchlist:${req.params.id}`);

    res.status(201).json({
      success: true,
      watchlistId: watchlist._id,
      message: 'Series added to watchlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a series from watchlist
// @route   DELETE /api/series/:id/watchlist
// @access  Private
const removeFromWatchlist = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');

    const watchlist = await Watchlist.findOneAndDelete({
      user: req.user._id,
      series: req.params.id
    });

    if (!watchlist) {
      res.status(404);
      return next(new Error('Series not found in your watchlist'));
    }

    // Invalidate cache
    delByPrefix(`watchlist:${req.user._id}`);
    delByPrefix(`series:watchlist:${req.params.id}`);

    res.json({
      success: true,
      message: 'Series removed from watchlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my watchlist
// @route   GET /api/watchlist
// @access  Private
const getMyWatchlist = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `watchlist:${req.user._id}:${page}:${limit}`;

    const result = await getOrSetWithL2(cacheKey, async () => {
      const [items, total] = await Promise.all([
        Watchlist.find({ user: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .populate({
            path: 'series',
            select: 'title type coverImage artworkCount isCompleted createdAt updatedAt artworks',
            populate: [
              { path: 'user', select: 'username displayName avatar' },
              { path: 'tags', select: 'name' },
              { path: 'artworks', select: 'images', options: { limit: 1 } }
            ]
          }),
        Watchlist.countDocuments({ user: req.user._id })
      ]);

      return {
        items: items.filter(w => w.series), // Filter out deleted series
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }, TTL.SHORT);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Check if a series is in my watchlist
// @route   GET /api/series/:id/watchlist/status
// @access  Private
const checkWatchlistStatus = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');

    const watchlist = await Watchlist.findOne({
      user: req.user._id,
      series: req.params.id
    });

    res.json({
      isWatching: !!watchlist,
      watchlistId: watchlist?._id || null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get watchlist count for a series
// @route   GET /api/series/:id/watchlist/count
// @access  Public
const getSeriesWatchlistCount = async (req, res, next) => {
  try {
    validateObjectId(req.params.id, 'series ID');

    const count = await Watchlist.countDocuments({ series: req.params.id });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
  checkWatchlistStatus,
  getSeriesWatchlistCount
};
