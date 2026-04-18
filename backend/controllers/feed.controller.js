const Artwork = require('../models/Artwork');
const Follow = require('../models/Follow');

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

        const filter = { user: { $in: followingIds }, isDraft: false };

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

        const startDate = new Date();
        const filter = { isDraft: false };

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
            // Artworks by users who joined in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const rookieUsers = await require('../models/User').find({
                createdAt: { $gte: thirtyDaysAgo }
            }).select('_id');
            const rookieUserIds = rookieUsers.map(u => u._id);
            filter.user = { $in: rookieUserIds };
        }

        const artworks = await Artwork.find(filter)
            .populate('user', 'username displayName avatar')
            .populate('tags', 'name')
            .sort({ likeCount: -1, bookmarkCount: -1, viewCount: -1, createdAt: -1 })
            .limit(limit);

        res.json({ period, type, artworks });
    } catch (error) {
        next(error);
    }
};

const getDiscovery = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { isDraft: false };

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

module.exports = {
    getFeed,
    getRankings,
    getDiscovery
};
