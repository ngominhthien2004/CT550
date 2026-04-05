const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');

const listTags = async (req, res, next) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);

        const tags = await Tag.find({ usageCount: { $gt: 0 } })
            .select('name usageCount')
            .sort({ usageCount: -1, name: 1 })
            .limit(limit);

        res.json(tags);
    } catch (error) {
        next(error);
    }
};

const getTagDetail = async (req, res, next) => {
    try {
        const rawTagName = decodeURIComponent((req.params.tagName || '').toString());
        const normalizedTagName = rawTagName.trim().toLowerCase();

        if (!normalizedTagName) {
            res.status(400);
            return next(new Error('Tag name is required'));
        }

        const tag = await Tag.findOne({ name: normalizedTagName });

        if (!tag) {
            res.status(404);
            return next(new Error('Tag not found'));
        }

        const artworks = await Artwork.find({ tags: tag._id })
            .populate('user', 'username displayName avatar')
            .populate('tags', 'name')
            .sort({ createdAt: -1 });

        res.json({
            tag,
            artworks,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listTags,
    getTagDetail,
};
