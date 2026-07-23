const AppError = require('../utils/AppError');
const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');
const mongoose = require('mongoose');
const { getOrSet, getOrSetWithL2, delByPrefix, TTL, buildKey } = require('../utils/cache');

const normalizeTagName = (rawTagName = '') =>
    String(rawTagName)
        .trim()
        .replace(/^#+/, '')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();

const listTags = async (req, res, next) => {
    try {
        const cacheKey = buildKey('tags:list', req.query);
        const tags = await getOrSet(cacheKey, async () => {
            const parsedLimit = Number.parseInt(req.query.limit, 10);
            const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);
            const keyword = String(req.query.q || '').trim();

            const query = { usageCount: { $gt: 0 } };
            if (keyword) {
                query.name = { $regex: normalizeTagName(keyword), $options: 'i' };
            }

            return await Tag.find(query)
                .select('name usageCount')
                .sort({ usageCount: -1, name: 1 })
                .limit(limit)
                .lean();
        }, TTL.ARTWORK_LIST);

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
            return next(new AppError('Tag name is required', 'TAG_NAME_REQUIRED', 400));
        }

        const cacheKey = `tags:detail:${normalizedTagName}`;
        const data = await getOrSetWithL2(cacheKey, async () => {
            const tag = await Tag.findOne({ name: normalizedTagName }).lean();

            if (!tag) return null;

            const artworks = await Artwork.find({ tags: tag._id })
                .populate('user', 'username displayName avatar')
                .populate('tags', 'name')
                .sort({ createdAt: -1 })
                .lean();

            return { tag, artworks };
        }, TTL.TAGS_POPULAR);

        if (!data) {
            res.status(404);
            return next(new AppError('Tag not found', 'TAG_NOT_FOUND', 404));
        }

        res.json(data);
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
            return next(new AppError('Tag not found', 'TAG_NOT_FOUND', 404));
        }

        if (name !== undefined) {
            const normalized = String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/^#+/, '');
            if (!normalized) {
                res.status(400);
                return next(new AppError('Tag name cannot be empty', 'VALIDATION_ERROR', 400));
            }
            // Check for uniqueness
            const existing = await Tag.findOne({ name: normalized, _id: { $ne: id } });
            if (existing) {
                res.status(409);
                return next(new AppError('A tag with this name already exists', 'DUPLICATE_VALUE', 409));
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
        // Invalidate tag caches
        delByPrefix('tags:detail:');
        delByPrefix('tags:list:');
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
            return next(new AppError('Both sourceId and targetId are required', 'VALIDATION_ERROR', 400));
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

        // Invalidate tag caches
        delByPrefix('tags:detail:');
        delByPrefix('tags:list:');
        delByPrefix('tags:popular');

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
            return next(new AppError('Tag not found', 'TAG_NOT_FOUND', 404));
        }

        // Remove tag from all artworks
        await Artwork.updateMany(
            { tags: id },
            { $pull: { tags: id } }
        );

        await Tag.findByIdAndDelete(id);

        // Invalidate tag caches
        delByPrefix('tags:detail:');
        delByPrefix('tags:list:');

        res.json({ message: `Tag "${tag.name}" deleted successfully` });
    } catch (error) {
        next(error);
    }
};

const getPopularSuggestions = async (req, res, next) => {
  try {
    const cacheKey = buildKey('tags:popular', req.query);
    const result = await getOrSetWithL2(cacheKey, async () => {
      const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Optional artwork type filter (e.g. 'illust', 'novel')
      const typeFilter = {};
      if (req.query.type) {
        typeFilter.type = req.query.type;
      }

      // 1️⃣ Top tags from artworks created in the last 30 days
      const recent = await Artwork.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, ...typeFilter } },
        { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);

      const recentIds = recent.map(r => r._id);

      // 2️⃣ If not enough, fallback to all-time top tags (excluding recent ones)
      let allTime = [];
      if (recentIds.length < limit) {
        allTime = await Artwork.aggregate([
          { $match: { tags: { $nin: recentIds }, ...typeFilter } },
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit - recentIds.length },
        ]);
      }

      // 3️⃣ Fetch tag names for all collected IDs
      const allIds = [...recentIds, ...allTime.map(r => r._id)];
      const tags = await Tag.find({ _id: { $in: allIds } }).select('name').lean();
      const tagMap = Object.fromEntries(tags.map(t => [t._id.toString(), t.name]));

      return [
        ...recentIds.map(id => tagMap[id.toString()]),
        ...allTime.map(r => tagMap[r._id.toString()]),
      ].filter(Boolean);
    }, TTL.TAGS_POPULAR);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getPopularIllustSuggestions = async (req, res, next) => {
  try {
    const cacheKey = buildKey('tags:popular-illust', req.query);
    const result = await getOrSetWithL2(cacheKey, async () => {
      const limit = Math.min(parseInt(req.query.limit, 10) || 4, 20);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Helper: get top tag IDs from a date filter
      async function getTopTagIds(sinceDate, max) {
        const match = { type: { $ne: 'novel' } };
        if (sinceDate) match.createdAt = { $gte: sinceDate };

        const results = await Artwork.aggregate([
          { $match: match },
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: max },
        ]);
        return results.map(r => r._id);
      }

      // 1️⃣ Top tags from last 30 days (non-novel artworks)
      let tagIds = await getTopTagIds(thirtyDaysAgo, limit);

      // 2️⃣ Fallback: if not enough, get all-time (exclude 30-day IDs)
      if (tagIds.length < limit) {
        const existingIds = tagIds;
        const allTime = await Artwork.aggregate([
          { $match: { type: { $ne: 'novel' }, tags: { $nin: existingIds } } },
          { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit - tagIds.length },
        ]);
        tagIds = [...tagIds, ...allTime.map(r => r._id)];
      }

      if (!tagIds.length) return [];

      // 3️⃣ Get tag names
      const tags = await Tag.find({ _id: { $in: tagIds } }).select('name').lean();
      const tagMap = Object.fromEntries(tags.map(t => [t._id.toString(), t]));

      // 4️⃣ For each tag, find the most recent non-novel artwork image
      const result = await Promise.all(tagIds.map(async (id) => {
        const tag = tagMap[id.toString()];
        if (!tag) return null;

        const artwork = await Artwork.findOne({ tags: id, type: { $ne: 'novel' } })
          .sort({ createdAt: -1 })
          .select('images')
          .lean();

        return {
          label: `#${tag.name}`,
          image: artwork?.images?.[0] || '',
        };
      }));

      return result.filter(Boolean);
    }, TTL.TAGS_POPULAR);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    listTags,
    getTagDetail,
    getPopularSuggestions,
    getPopularIllustSuggestions,
    adminListTags,
    adminUpdateTag,
    adminMergeTags,
    adminDeleteTag,
};
