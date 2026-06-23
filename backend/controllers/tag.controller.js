const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');

const normalizeTagName = (rawTagName = '') =>
    String(rawTagName)
        .trim()
        .replace(/^#+/, '')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();

const listTags = async (req, res, next) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);
        const keyword = String(req.query.q || '').trim();

        const query = { usageCount: { $gt: 0 } };
        if (keyword) {
            query.name = { $regex: normalizeTagName(keyword), $options: 'i' };
        }

        const tags = await Tag.find(query)
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
        const normalizedTagName = normalizeTagName(rawTagName);

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

const adminListTags = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const skip = (page - 1) * limit;
        const { q, sortBy } = req.query;

        const filter = {};
        if (q) {
            filter.name = { $regex: String(q).trim(), $options: 'i' };
        }

        let sortOption = { usageCount: -1, name: 1 };
        if (sortBy === 'name') sortOption = { name: 1 };
        if (sortBy === 'created') sortOption = { createdAt: -1 };
        if (sortBy === 'usageCount') sortOption = { usageCount: -1, name: 1 };

        const [tags, total] = await Promise.all([
            Tag.find(filter)
                .select('name translations usageCount createdAt')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Tag.countDocuments(filter),
        ]);

        res.json({ tags, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

const adminUpdateTag = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, translations } = req.body;

        const tag = await Tag.findById(id);
        if (!tag) {
            res.status(404);
            return next(new Error('Tag not found'));
        }

        if (name !== undefined) {
            const normalized = String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/^#+/, '');
            if (!normalized) {
                res.status(400);
                return next(new Error('Tag name cannot be empty'));
            }
            // Check for uniqueness
            const existing = await Tag.findOne({ name: normalized, _id: { $ne: id } });
            if (existing) {
                res.status(409);
                return next(new Error('A tag with this name already exists'));
            }
            tag.name = normalized;
        }

        if (translations !== undefined) {
            if (typeof translations === 'object') {
                tag.translations = {
                    ...tag.translations,
                    ...translations,
                };
            }
        }

        await tag.save();
        res.json(tag);
    } catch (error) {
        next(error);
    }
};

const adminMergeTags = async (req, res, next) => {
    try {
        const { sourceId, targetId } = req.body;

        if (!sourceId || !targetId) {
            res.status(400);
            return next(new Error('Both sourceId and targetId are required'));
        }

        if (sourceId === targetId) {
            res.status(400);
            return next(new Error('Cannot merge a tag into itself'));
        }

        const [sourceTag, targetTag] = await Promise.all([
            Tag.findById(sourceId),
            Tag.findById(targetId),
        ]);

        if (!sourceTag) {
            res.status(404);
            return next(new Error('Source tag not found'));
        }
        if (!targetTag) {
            res.status(404);
            return next(new Error('Target tag not found'));
        }

        // Update all artworks using source tag to use target tag
        await Artwork.updateMany(
            { tags: sourceId },
            { $addToSet: { tags: targetId } }
        );

        // Remove source tag from all artworks
        await Artwork.updateMany(
            { tags: sourceId },
            { $pull: { tags: sourceId } }
        );

        // Update usage counts
        const sourceUsageCount = await Artwork.countDocuments({ tags: targetId });
        targetTag.usageCount = sourceUsageCount;
        await targetTag.save();

        // Delete source tag
        await Tag.findByIdAndDelete(sourceId);

        res.json({
            message: `Merged "${sourceTag.name}" into "${targetTag.name}"`,
            targetTag,
        });
    } catch (error) {
        next(error);
    }
};

const adminDeleteTag = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tag = await Tag.findById(id);
        if (!tag) {
            res.status(404);
            return next(new Error('Tag not found'));
        }

        // Remove tag from all artworks
        await Artwork.updateMany(
            { tags: id },
            { $pull: { tags: id } }
        );

        await Tag.findByIdAndDelete(id);

        res.json({ message: `Tag "${tag.name}" deleted successfully` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listTags,
    getTagDetail,
    adminListTags,
    adminUpdateTag,
    adminMergeTags,
    adminDeleteTag,
};
