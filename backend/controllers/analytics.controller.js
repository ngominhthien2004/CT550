const Artwork = require('../models/Artwork');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const ViewEvent = require('../models/ViewEvent');
const { getDateRange, buildTrendResponse } = require('../utils/analytics');

/**
 * GET /api/users/dashboard/analytics/overview
 * Returns total overview stats + % change vs previous period.
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || '30d';
    const range = getDateRange(period);

    // Get all artwork IDs for this user
    const artworkIds = await Artwork.find({ user: userId }).distinct('_id');

    if (artworkIds.length === 0) {
      return res.json({
        views: { total: 0, current: 0, previous: 0, changePercent: 0 },
        likes: { total: 0, current: 0, previous: 0, changePercent: 0 },
        bookmarks: { total: 0, current: 0, previous: 0, changePercent: 0 },
        comments: { total: 0, current: 0, previous: 0, changePercent: 0 },
        followers: { total: 0, current: 0, previous: 0, changePercent: 0 },
      });
    }

    // ── Views ──
    const allViews = await ViewEvent.countDocuments({ artwork: { $in: artworkIds } });
    const currentViews = await ViewEvent.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    });
    const previousViews = await ViewEvent.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.previousStartDate, $lt: range.startDate },
    });

    // ── Likes ──
    const allLikes = await Like.countDocuments({ artwork: { $in: artworkIds } });
    const currentLikes = await Like.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    });
    const previousLikes = await Like.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.previousStartDate, $lt: range.startDate },
    });

    // ── Bookmarks ──
    const allBookmarks = await Bookmark.countDocuments({ artwork: { $in: artworkIds } });
    const currentBookmarks = await Bookmark.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    });
    const previousBookmarks = await Bookmark.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.previousStartDate, $lt: range.startDate },
    });

    // ── Comments ──
    const allComments = await Comment.countDocuments({ artwork: { $in: artworkIds } });
    const currentComments = await Comment.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    });
    const previousComments = await Comment.countDocuments({
      artwork: { $in: artworkIds },
      createdAt: { $gte: range.previousStartDate, $lt: range.startDate },
    });

    // ── Followers ──
    const allFollowers = await Follow.countDocuments({ following: userId });
    const currentFollowers = await Follow.countDocuments({
      following: userId,
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    });
    const previousFollowers = await Follow.countDocuments({
      following: userId,
      createdAt: { $gte: range.previousStartDate, $lt: range.startDate },
    });

    const { calculateChange } = require('../utils/analytics');

    res.json({
      views: { total: allViews, current: currentViews, previous: previousViews, changePercent: calculateChange(currentViews, previousViews) },
      likes: { total: allLikes, current: currentLikes, previous: previousLikes, changePercent: calculateChange(currentLikes, previousLikes) },
      bookmarks: { total: allBookmarks, current: currentBookmarks, previous: previousBookmarks, changePercent: calculateChange(currentBookmarks, previousBookmarks) },
      comments: { total: allComments, current: currentComments, previous: previousComments, changePercent: calculateChange(currentComments, previousComments) },
      followers: { total: allFollowers, current: currentFollowers, previous: previousFollowers, changePercent: calculateChange(currentFollowers, previousFollowers) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard/analytics/trends?period=30d&type=views
 * Returns daily trend data for charting.
 */
const getTrends = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || '30d';
    const type = req.query.type || 'views';
    const range = getDateRange(period);

    const artworkIds = await Artwork.find({ user: userId }).distinct('_id');

    if (artworkIds.length === 0) {
      return res.json({ labels: [], current: [], previous: [], currentTotal: 0, previousTotal: 0, changePercent: 0 });
    }

    let rawData;

    switch (type) {
      case 'views':
        rawData = await ViewEvent.aggregate([
          { $match: { artwork: { $in: artworkIds }, createdAt: { $gte: range.previousStartDate } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]);
        break;
      case 'likes':
        rawData = await Like.aggregate([
          { $match: { artwork: { $in: artworkIds }, createdAt: { $gte: range.previousStartDate } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]);
        break;
      case 'bookmarks':
        rawData = await Bookmark.aggregate([
          { $match: { artwork: { $in: artworkIds }, createdAt: { $gte: range.previousStartDate } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]);
        break;
      case 'comments':
        rawData = await Comment.aggregate([
          { $match: { artwork: { $in: artworkIds }, createdAt: { $gte: range.previousStartDate } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]);
        break;
      default:
        rawData = [];
    }

    const result = buildTrendResponse(rawData, range);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard/analytics/breakdown?sort=views&limit=10
 * Returns top artworks by metric.
 */
const getArtworkBreakdown = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sort = req.query.sort || 'views';
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    let sortField;
    switch (sort) {
      case 'likes': sortField = 'likeCount'; break;
      case 'bookmarks': sortField = 'bookmarkCount'; break;
      case 'comments': sortField = 'commentCount'; break;
      default: sortField = 'viewCount';
    }

    const artworks = await Artwork.find({ user: userId })
      .select('title type images viewCount likeCount bookmarkCount commentCount createdAt')
      .sort({ [sortField]: -1 })
      .limit(limit)
      .lean();

    // Map to safe public response
    const items = artworks.map(a => ({
      _id: a._id,
      title: a.title,
      type: a.type,
      thumbnail: a.images?.[0] || '',
      views: a.viewCount || 0,
      likes: a.likeCount || 0,
      bookmarks: a.bookmarkCount || 0,
      comments: a.commentCount || 0,
      createdAt: a.createdAt,
    }));

    res.json({ items, sort, total: items.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard/analytics/followers?period=30d
 * Returns follower growth trend data.
 */
const getFollowerGrowth = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || '30d';
    const range = getDateRange(period);

    const rawData = await Follow.aggregate([
      { $match: { following: userId, createdAt: { $gte: range.previousStartDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const result = buildTrendResponse(rawData, range);

    // Get total followers count
    const totalFollowers = await Follow.countDocuments({ following: userId });

    res.json({
      ...result,
      totalFollowers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard/analytics/artwork/:id
 * Returns detailed analytics for a single artwork.
 */
const getArtworkAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const artworkId = req.params.id;
    const period = req.query.period || '30d';
    const range = getDateRange(period);

    // Verify ownership
    const artwork = await Artwork.findOne({ _id: artworkId, user: userId })
      .select('title type images viewCount likeCount bookmarkCount commentCount createdAt')
      .lean();

    if (!artwork) {
      res.status(404);
      return next(new Error('Artwork not found or not owned by you'));
    }

    // View trend for this specific artwork
    const viewData = await ViewEvent.aggregate([
      { $match: { artwork: artwork._id, createdAt: { $gte: range.previousStartDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const viewTrend = buildTrendResponse(viewData, range);

    // Like trend
    const likeData = await Like.aggregate([
      { $match: { artwork: artwork._id, createdAt: { $gte: range.previousStartDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const likeTrend = buildTrendResponse(likeData, range);

    res.json({
      artwork: {
        _id: artwork._id,
        title: artwork.title,
        type: artwork.type,
        thumbnail: artwork.images?.[0] || '',
        totalViews: artwork.viewCount || 0,
        totalLikes: artwork.likeCount || 0,
        totalBookmarks: artwork.bookmarkCount || 0,
        totalComments: artwork.commentCount || 0,
        createdAt: artwork.createdAt,
      },
      trends: {
        views: viewTrend,
        likes: likeTrend,
      },
      period,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getTrends,
  getArtworkBreakdown,
  getFollowerGrowth,
  getArtworkAnalytics,
};
