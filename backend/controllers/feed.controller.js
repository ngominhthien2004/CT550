const Artwork = require('../models/Artwork');
const Follow = require('../models/Follow');
const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const BrowseHistory = require('../models/BrowseHistory');
const { getForYouArtworks } = require('../services/recommendation.service');
const { buildDateFilter } = require('../utils/dateFilter');
const { getOrSet, delByPrefix, TTL, buildKey } = require('../utils/cache');

const getFeed = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const follows = await Follow.find({ follower: req.user._id }).select('following');
        const followingIds = follows.map((item) => item.following);

        if (followingIds.length === 0) {
            return res.json({ artworks: [], total: 0, page, pages: 0 });
        }

        const filter = { user: { $in: followingIds } };

        const [artworks, total] = await Promise.all([
            Artwork.find(filter)
                .populate('user', 'username displayName avatar')
                .populate('tags', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Artwork.countDocuments(filter)
        ]);

        res.json({
            artworks,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const getRankings = async (req, res, next) => {
  try {
    const period = req.query.period || 'daily';
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit, 10) || 50;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    // Choose TTL based on period
    let ttl;
    switch (period) {
      case 'weekly': ttl = TTL.RANKINGS_WEEKLY; break;
      case 'monthly': ttl = TTL.RANKINGS_MONTHLY; break;
      default: ttl = TTL.RANKINGS_DAILY;
    }

    // Cache key per period+type+page, user-specific annotation is added after cache
    const cacheKey = `rankings:${period}:${type}:${page}:${limit}`;

    // Fetch base data (without user annotation)
    const baseArtworks = await getOrSet(cacheKey, async () => {
      const startDate = new Date();
      const filter = {};
      filter.isHidden = { $ne: true };

      if (type !== 'all') {
        filter.type = type;
      }

      if (period === 'daily') {
        startDate.setDate(startDate.getDate() - 1);
        filter.createdAt = { $gte: startDate };
      } else if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
        filter.createdAt = { $gte: startDate };
      } else if (period === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
        filter.createdAt = { $gte: startDate };
      } else if (period === 'rookie') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const rookieUsers = await User.find({
          createdAt: { $gte: thirtyDaysAgo }
        }).select('_id');
        const rookieUserIds = rookieUsers.map(u => u._id);
        filter.user = { $in: rookieUserIds };
      }

      const [artworks, total] = await Promise.all([
        Artwork.find(filter)
          .populate('user', 'username displayName avatar')
          .populate('tags', 'name')
          .sort({ likeCount: -1, bookmarkCount: -1, viewCount: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Artwork.countDocuments(filter)
      ]);

      return { artworks, total };
    }, ttl);

    let artworks = baseArtworks.artworks;
    const total = baseArtworks.total;

    // Annotate isLiked/isBookmarked if user is authenticated (NOT cached)
    if (req.user && artworks.length > 0) {
      const artworkIds = artworks.map(a => a._id);
      const [userLikes, userBookmarks] = await Promise.all([
        Like.find({ user: req.user._id, artwork: { $in: artworkIds } }).select('artwork').lean(),
        Bookmark.find({ user: req.user._id, artwork: { $in: artworkIds } }).select('artwork').lean()
      ]);
      const likedIds = new Set(userLikes.map(l => l.artwork.toString()));
      const bookmarkedIds = new Set(userBookmarks.map(b => b.artwork.toString()));

      artworks = artworks.map(a => {
        const obj = a.toObject ? a.toObject() : { ...a };
        obj.isLiked = likedIds.has(a._id.toString());
        obj.isBookmarked = bookmarkedIds.has(a._id.toString());
        return obj;
      });
    }

    res.json({ period, type, artworks, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getDiscovery = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const type = req.query.type;
    const skip = (page - 1) * limit;

    const cacheKey = buildKey('discovery', { page, limit, type, ...req.query });
    const data = await getOrSet(cacheKey, async () => {
      const filter = {};
      if (type && type !== 'all' && type !== 'undefined') {
        filter.type = type;
      }

      // Date range filter
      Object.assign(filter, buildDateFilter(req.query));

      const [artworks, total] = await Promise.all([
        Artwork.find(filter)
          .populate('user', 'username displayName avatar')
          .populate('tags', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Artwork.countDocuments(filter)
      ]);

      return { artworks, total };
    }, TTL.DISCOVERY);

    res.json({
      artworks: data.artworks,
      total: data.total,
      page,
      pages: Math.ceil(data.total / limit)
    });
  } catch (error) {
    next(error);
  }
};

const getForYou = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await getForYouArtworks(req.user._id, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    getFeed,
    getRankings,
    getDiscovery,
    getForYou,
};
