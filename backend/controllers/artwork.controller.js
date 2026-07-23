const AppError = require('../utils/AppError');
const Artwork = require('../models/Artwork');
const ArtworkReport = require('../models/ArtworkReport');
const User = require('../models/User');
const Setting = require('../models/Setting');
const ReadingProgress = require('../models/ReadingProgress');
const Tag = require('../models/Tag');
const BrowseHistory = require('../models/BrowseHistory');
const ViewEvent = require('../models/ViewEvent');
const { createNotification } = require('../utils/notification');
const { detectAIWithHuggingFace } = require('../services/huggingface.service');
const { buildDateFilter } = require('../utils/dateFilter');

const { getSimilarArtworks: getSimilarArtworksService } = require('../services/similarity.service');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { getOrSet, getOrSetWithL2, delByPrefix, TTL, buildKey } = require('../utils/cache');

const normalizeTagName = (rawTagName = '') =>
    String(rawTagName)
        .trim()
        .replace(/^#+/, '')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();

const AI_TAG_NAME = normalizeTagName('ai');
const MAX_ARTWORK_IMAGES = 50;

async function runAiDetection(primaryImagePath) {
    try {
        const settings = await Setting.getSettings();
        if (!settings.aiDetectionEnabled) {
            return { success: false, error: 'AI detection disabled by admin', disabled: true };
        }

        const imageBuffer = await fs.promises.readFile(primaryImagePath);
        const base64Image = imageBuffer.toString('base64');
        const hfResult = await detectAIWithHuggingFace(base64Image);

        if (hfResult.error) {
            return { success: false, error: hfResult.error };
        }

        return {
            success: true,
            confidence: hfResult.confidence,
            isAI: hfResult.isAI,
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function hasTagId(tagIds, tagId) {
    return tagIds.some((existingId) => String(existingId) === String(tagId));
}

// Create Artwork
const createArtwork = async (req, res, next) => {
    try {
        const { title, description, type, ageRating, tags, novelContent } = req.body;

        if (!req.files || req.files.length === 0) {
            res.status(400);
            return next(new AppError('Please upload at least one image', 'UPLOAD_FAILED', 400));
        }

        if (req.files.length > MAX_ARTWORK_IMAGES) {
            res.status(400);
            return next(new Error(`Please upload no more than ${MAX_ARTWORK_IMAGES} images for one artwork`));
        }

        const publicDir = path.join(__dirname, '..', 'public');
        const rawType = (type || 'illust').toString().toLowerCase();
        const artworkType = ['illust', 'manga', 'gif', 'novel'].includes(rawType) ? rawType : 'illust';

        // Process all uploaded files (same for all artwork types - illust, manga, gif, novel)
        const images = req.files.map((file) => {
            const relativePath = path.relative(publicDir, file.path).replace(/\\/g, '/');
            return `/${relativePath}`;
        });

        // Upload images to Cloudinary for persistent remote storage
        const cloudImages = [];
        for (const file of req.files) {
            try {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: process.env.CLOUDINARY_FOLDER || 'illuwrl-artworks',
                    resource_type: 'image',
                });
                cloudImages.push(result.secure_url);
            } catch (err) {
                console.error('Cloudinary upload failed for', file.path, err.message);
                // Fallback to local path for this image
                cloudImages.push(images[cloudImages.length] || '');
            }
        }
        const finalImages = cloudImages.length > 0 ? cloudImages : images;

        // Handle tags (simplified for phase 1 - convert strings to Tag IDs or just use what is sent)
        let tagIds = [];
        if (tags) {
            const rawTagList = Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [tags];
            const normalizedTagList = rawTagList
                .map((tagName) => normalizeTagName(tagName))
                .filter(Boolean);
            const uniqueTagList = [...new Set(normalizedTagList)];

            for (const tagName of uniqueTagList) {
                let tag = await Tag.findOne({ name: tagName });
                if (!tag) {
                    tag = await Tag.create({ name: tagName });
                }
                tagIds.push(tag._id);
                // Increment usage count atomically
                await Tag.findByIdAndUpdate(tag._id, { $inc: { usageCount: 1 } });
            }
        }

        const aiDetection = {
            confidence: null,
            isAI: false,
            tagged: false,
        };

        // Run AI detection on the primary (first) image
        const primaryFile = req.files[0];
        if (primaryFile && primaryFile.path) {
            const detectionResult = await runAiDetection(primaryFile.path);

            if (detectionResult.success) {
                const confidence = Number.isFinite(detectionResult.confidence)
                    ? detectionResult.confidence
                    : null;
                const isAI = Boolean(detectionResult.isAI);

                aiDetection.confidence = confidence;
                aiDetection.isAI = isAI;

                if (isAI) {
                    const aiTag = await Tag.findOneAndUpdate(
                        { name: AI_TAG_NAME },
                        { $setOnInsert: { name: AI_TAG_NAME, usageCount: 0 } },
                        { new: true, upsert: true }
                    );

                    if (!hasTagId(tagIds, aiTag._id)) {
                        tagIds.push(aiTag._id);
                        await Tag.updateOne(
                            { _id: aiTag._id },
                            { $inc: { usageCount: 1 } }
                        );
                    }

                    aiDetection.tagged = hasTagId(tagIds, aiTag._id);
                }
            } else {
                aiDetection.error = detectionResult.error;
            }
        } else {
            aiDetection.error = 'Primary image unavailable for detection';
        }

        const artworkData = {
            user: req.user._id,
            title,
            description,
            type: artworkType,
            images: finalImages,
            tags: tagIds,
            ageRating,
        };

        // Set novel-specific fields
        if (artworkType === 'novel') {
            artworkData.novelContent = novelContent || '';
            // For oneshot novels (no series), sync description with novelContent for backward compatibility
            if (!req.body.series) {
                artworkData.description = artworkData.description || (novelContent || '').slice(0, 500);
            }
        }

        const artwork = await Artwork.create(artworkData);

        await createNotification({
            userId: req.user._id,
            artworkId: artwork._id,
            type: 'system',
            message: `Artwork "${artwork.title}" posted successfully.`
        });

        // Invalidate cached listings
        delByPrefix('artworks:list');
        delByPrefix('rankings:');
        delByPrefix('discovery:');

        res.status(201).json({
            ...artwork.toObject(),
            aiDetection,
        });
    } catch (error) {
        next(error);
    }
};

// Get All Artworks (with basic filtering)
const getArtworks = async (req, res, next) => {
  try {
    const {
      type, ageRating, user, tag, q, limit: rawLimit,
      sortBy, minWords, maxWords, series, from, to,
      unassigned, includeSeries,
    } = req.query;

    // Only cache public, non-user-specific queries
    const isCacheable = !user && !tag && !q;
    const cacheKey = isCacheable ? buildKey('artworks:list', req.query) : null;

    const fetchArtworks = async () => {
      const query = { isHidden: { $ne: true } };
      const parsedLimit = Number.parseInt(rawLimit, 10);
      const limit = Number.isNaN(parsedLimit) ? 48 : Math.min(Math.max(parsedLimit, 1), 200);

      if (type) query.type = type;
      if (ageRating) query.ageRating = ageRating;
      if (user) query.user = user;
      if (series) query.series = series;
      if (unassigned === 'true') {
        query.series = includeSeries ? { $in: [null, includeSeries] } : null;
      }
      if (tag) {
        const foundTag = await Tag.findOne({ name: normalizeTagName(tag) });
        if (foundTag) query.tags = foundTag._id;
      }
      if (q) {
        const keyword = q.trim();
        if (keyword) {
          const matchingTags = await Tag.find({ name: { $regex: keyword, $options: 'i' } }).select('_id');
          const tagIds = matchingTags.map(t => t._id);
          const orConditions = [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ];
          if (tagIds.length > 0) {
            orConditions.push({ tags: { $in: tagIds } });
          }
          query.$or = orConditions;
        }
      }

      if ((minWords || maxWords) && (!type || type === 'novel')) {
        query.wordCount = {};
        const minW = Number.parseInt(minWords, 10);
        const maxW = Number.parseInt(maxWords, 10);
        if (!Number.isNaN(minW)) query.wordCount.$gte = minW;
        if (!Number.isNaN(maxW)) query.wordCount.$lte = maxW;
      }

      // Date range filter
      Object.assign(query, buildDateFilter(req.query));

      // Determine sort order
      let sortOption = { createdAt: -1 };
      if (sortBy) {
        switch (sortBy) {
          case 'views':
            sortOption = { viewCount: -1 };
            break;
          case 'likes':
            sortOption = { likeCount: -1 };
            break;
          case 'longest':
            sortOption = { wordCount: -1 };
            break;
          case 'shortest':
            sortOption = { wordCount: 1 };
            break;
          default:
            sortOption = { createdAt: -1 };
        }
      }

      const artworks = await Artwork.find(query)
        .select('-novelContent')
        .populate('user', 'username displayName avatar')
        .populate('tags', 'name')
        .sort(sortOption)
        .limit(parsedLimit || 48)
        .lean();

      return artworks;
    };

    let artworks;
    if (isCacheable) {
      artworks = await getOrSet(cacheKey, fetchArtworks, TTL.ARTWORK_LIST);
    } else {
      artworks = await fetchArtworks();
    }

    res.json(artworks);
  } catch (error) {
    next(error);
  }
};

// Get Artwork By ID
const getArtworkById = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id)
            .populate('user', 'username displayName avatar socialLinks')
            .populate('tags', 'name translations');

        if (artwork) {
            // Owner-view guard: don't inflate view count or record a view event
            // when the viewer is the artwork's own author.
            // NOTE: artwork.user is populated above (see line 316), so it's a
            // Mongoose document, not a raw ObjectId. Calling .toString() on a
            // populated doc yields "[object Object]"; we must compare via ._id.
            const isOwnerView = Boolean(
                req.user
                && artwork.user
                && artwork.user._id
                && artwork.user._id.toString() === req.user._id.toString()
            );

            if (!isOwnerView) {
                // Increment view count atomically
                await Artwork.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
                artwork.viewCount = (artwork.viewCount || 0) + 1;

                // Track view event for analytics (append-only log)
                try {
                    await ViewEvent.create({
                        artwork: req.params.id,
                        user: req.user?._id || null,
                    });
                } catch (err) {
                    console.error('Failed to record view event:', err.message);
                    // Non-blocking — don't fail the request
                }
            }

            // Track browse history for authenticated users
            if (req.user) {
                await BrowseHistory.findOneAndUpdate(
                    { user: req.user._id, artwork: artwork._id },
                    { $set: { createdAt: new Date() } },
                    { upsert: true }
                );
                // Cleanup: keep only last 200 entries per user
                const count = await BrowseHistory.countDocuments({ user: req.user._id });
                if (count > 200) {
                    const oldestToKeep = await BrowseHistory.find({ user: req.user._id })
                        .sort({ createdAt: -1 })
                        .skip(200)
                        .limit(1);
                    if (oldestToKeep.length > 0) {
                        await BrowseHistory.deleteMany({
                            user: req.user._id,
                            createdAt: { $lt: oldestToKeep[0].createdAt },
                        });
                    }
                }
            }

            const result = artwork.toObject({ virtuals: true });
            res.json(result);
        } else {
            res.status(404);
            next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }
    } catch (error) {
        next(error);
    }
};

const getAdminArtworks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;
        const { q, type, ageRating, from, to } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (ageRating) filter.ageRating = ageRating;
        if (q && q.trim()) {
            const keyword = q.trim();
            filter.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ];
        }

        // Date range filter
        Object.assign(filter, buildDateFilter(req.query));

        const [artworks, total] = await Promise.all([
            Artwork.find(filter)
                .populate('user', 'username displayName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Artwork.countDocuments(filter),
        ]);

        res.json({
            artworks,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        next(error);
    }
};

// Delete Artwork
const deleteArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        // Check if user owns the artwork
        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete this artwork', 'FORBIDDEN', 403));
        }

        // Delete files from storage (Cloudinary or local)
        for (const imagePath of artwork.images) {
            // Check if this is a Cloudinary URL
            if (imagePath.includes('res.cloudinary.com')) {
                try {
                    // Extract the public ID from the Cloudinary URL
                    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/filename
                    const urlParts = new URL(imagePath);
                    const pathSegments = urlParts.pathname.split('/');
                    const uploadIndex = pathSegments.indexOf('upload');
                    if (uploadIndex !== -1) {
                        const publicId = pathSegments.slice(uploadIndex + 2).join('/').replace(/\.[^.]+$/, '');
                        await cloudinary.uploader.destroy(publicId);
                    }
                } catch (err) {
                    console.error('Cloudinary delete failed for', imagePath, err.message);
                }
            } else {
                // Delete local file
                const normalizedImagePath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
                const relativeToUploads = normalizedImagePath.startsWith('uploads/')
                    ? normalizedImagePath.slice('uploads/'.length)
                    : normalizedImagePath;
                const fullPath = path.join(__dirname, '..', 'public', 'uploads', relativeToUploads);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        await artwork.deleteOne();
        // Invalidate cached listings
        delByPrefix('artworks:list');
        delByPrefix('artworks:similar');
        delByPrefix('rankings:');
        delByPrefix('discovery:');
        res.json({ message: 'Artwork removed' });
    } catch (error) {
        next(error);
    }
};

// Update Artwork (title, description, tags, ageRating)
const updateArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to update this artwork', 'FORBIDDEN', 403));
        }

        const { title, description, ageRating, tags, commentsEnabled } = req.body;

        if (title !== undefined) artwork.title = title;
        if (description !== undefined) artwork.description = description;
        if (ageRating !== undefined) artwork.ageRating = ageRating;
        if (commentsEnabled !== undefined) artwork.commentsEnabled = Boolean(commentsEnabled);

        // Handle tag updates if provided
        if (tags !== undefined) {
            const rawTagList = Array.isArray(tags)
                ? tags
                : typeof tags === 'string'
                    ? tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [tags];
            const normalizedTagList = rawTagList
                .map((tagName) => normalizeTagName(tagName))
                .filter(Boolean);
            const uniqueTagList = [...new Set(normalizedTagList)];

            const newTagIds = [];
            for (const tagName of uniqueTagList) {
                let tag = await Tag.findOne({ name: tagName });
                if (!tag) {
                    tag = await Tag.create({ name: tagName });
                }
                newTagIds.push(tag._id);
            }

            // Decrement usage count for removed tags
            const oldTagIds = (artwork.tags || []).map(id => id.toString());
            const newTagIdStrings = newTagIds.map(id => id.toString());
            for (const oldId of oldTagIds) {
                if (!newTagIdStrings.includes(oldId)) {
                    await Tag.findByIdAndUpdate(oldId, { $inc: { usageCount: -1 } });
                }
            }
            // Increment usage count for newly added tags
            for (const newId of newTagIdStrings) {
                if (!oldTagIds.includes(newId)) {
                    await Tag.findByIdAndUpdate(newId, { $inc: { usageCount: 1 } });
                }
            }

            artwork.tags = newTagIds;
        }

        await artwork.save();

        // Invalidate cached listings
        delByPrefix('artworks:list');

        const updated = await Artwork.findById(artwork._id)
            .populate('user', 'username displayName avatar')
            .populate('tags', 'name');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// Novel content update
const updateNovelContent = async (req, res, next) => {
    try {
        const { novelContent } = req.body;
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized', 'FORBIDDEN', 403));
        }

        if (artwork.type !== 'novel') {
            res.status(400);
            return next(new Error('This artwork is not a novel'));
        }

        artwork.novelContent = novelContent || '';

        // Sync description for backward compatibility with oneshot novels (no series)
        if (!artwork.series && novelContent) {
            artwork.description = novelContent.slice(0, 500);
        }

        await artwork.save();
        res.json(artwork);
    } catch (error) {
        next(error);
    }
};

// Reading progress
const saveReadingProgress = async (req, res, next) => {
    try {
        const { progressPercent, scrollPosition } = req.body;

        const progress = await ReadingProgress.findOneAndUpdate(
            { user: req.user._id, artwork: req.params.id },
            {
                user: req.user._id,
                artwork: req.params.id,
                progressPercent: progressPercent || 0,
                scrollPosition: scrollPosition || 0,
                lastReadAt: new Date(),
            },
            { upsert: true, new: true }
        );

        res.json(progress);
    } catch (error) {
        next(error);
    }
};

const getReadingProgress = async (req, res, next) => {
    try {
        const progress = await ReadingProgress.findOne({
            user: req.user._id,
            artwork: req.params.id,
        });
        res.json(progress || { progressPercent: 0 });
    } catch (error) {
        next(error);
    }
};

// ─── Report Artwork ────────────────────────────────────────────────────────────
const reportArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        // Check if user already reported this artwork
        const existingReport = await ArtworkReport.findOne({
            artwork: artwork._id,
            reportedBy: req.user._id,
            status: 'pending',
        });
        if (existingReport) {
            res.status(400);
            return next(new AppError('You have already reported this artwork', 'NOT_ALLOWED', 409));
        }

        const report = await ArtworkReport.create({
            artwork: artwork._id,
            reportedBy: req.user._id,
            reason: req.body.reason || 'other',
            description: req.body.description || '',
        });

        // Increment reportCount on artwork
        await Artwork.findByIdAndUpdate(artwork._id, { $inc: { reportCount: 1 } });

        // Notify all admins
        const admins = await User.find({ role: 'admin' }).select('_id').limit(20);
        await Promise.all(admins.map((admin) =>
            createNotification({
                userId: admin._id,
                actorId: req.user._id,
                artworkId: artwork._id,
                type: 'system:artwork_report',
                message: `Artwork reported: ${artwork.title}`,
                metadata: { reportId: report._id, reportType: 'artwork' },
            })
        ));

        res.status(201).json({ message: 'Report submitted for review' });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get Reported Artworks ──────────────────────────────────────────────
const getReportedArtworks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const status = req.query.status || '';
        const filter = status ? { status } : {};

        // Date range filter
        Object.assign(filter, buildDateFilter(req.query));

        const [reports, total] = await Promise.all([
            ArtworkReport.find(filter)
                .populate('artwork', 'title type images isHidden')
                .populate('reportedBy', 'username displayName')
                .populate('resolvedBy', 'username displayName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ArtworkReport.countDocuments(filter),
        ]);

        res.json({
            reports,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Resolve Artwork Report ─────────────────────────────────────────────
const resolveArtworkReport = async (req, res, next) => {
    try {
        const { id: reportId } = req.params;
        const { action, note } = req.body;

        const report = await ArtworkReport.findById(reportId);
        if (!report) {
            res.status(404);
            return next(new Error('Report not found'));
        }

        report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
        report.resolutionNote = note || '';
        await report.save();

        res.json({ message: `Report ${report.status}`, reportId: report._id });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Hide Artwork ───────────────────────────────────────────────────────
const hideArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findByIdAndUpdate(
            req.params.id,
            {
                isHidden: true,
                hiddenBy: req.user._id,
                hiddenAt: new Date(),
                hiddenReason: req.body.reason || 'Violated platform guidelines',
            },
            { new: true }
        );
        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        // Auto-resolve all pending reports for this artwork
        await ArtworkReport.updateMany(
            { artwork: artwork._id, status: 'pending' },
            { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date(), resolutionNote: 'Artwork hidden by admin' }
        );

        // Notify the artwork owner
        await createNotification({
            userId: artwork.user,
            actorId: req.user._id,
            type: 'system',
            message: `Your artwork "${artwork.title}" has been hidden: ${req.body.reason || 'Violated platform guidelines'}`,
        });

        res.json({ message: 'Artwork hidden', artwork });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Unhide Artwork ────────────────────────────────────────────────────
const unhideArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findByIdAndUpdate(
            req.params.id,
            {
                isHidden: false,
                hiddenBy: null,
                hiddenAt: null,
                hiddenReason: '',
            },
            { new: true }
        );
        if (!artwork) {
            res.status(404);
            return next(new AppError('Artwork not found', 'ARTWORK_NOT_FOUND', 404));
        }

        await createNotification({
            userId: artwork.user,
            actorId: req.user._id,
            type: 'system',
            message: `Your artwork "${artwork.title}" has been reinstated.`,
        });

        res.json({ message: 'Artwork unhidden', artwork });
    } catch (error) {
        next(error);
    }
};

// ─── Admin: Get Hidden Artworks ────────────────────────────────────────────────
const getHiddenArtworks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;

        const filter = { isHidden: true };

        // Date range filter (use createdAt since hiddenAt might not always be set)
        Object.assign(filter, buildDateFilter(req.query));

        const [artworks, total] = await Promise.all([
            Artwork.find(filter)
                .populate('user', 'username displayName')
                .populate('hiddenBy', 'username displayName')
                .sort({ hiddenAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Artwork.countDocuments(filter),
        ]);

        res.json({
            artworks,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/artworks/:id/similar
 * Returns similar artworks using collaborative filtering (item-to-item Jaccard similarity).
 * Uses optionalAuth so logged-in users get personalized results.
 */
const getSimilarArtworks = async (req, res, next) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit, 10) || 24;
        const cacheKey = `artworks:similar:${id}:${limit}`;
        const results = await getOrSetWithL2(cacheKey, async () => {
            return await getSimilarArtworksService(id, limit);
        }, TTL.SIMILAR_ARTWORKS);
        res.json(results);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createArtwork,
    getArtworks,
    getArtworkById,
    getAdminArtworks,
    deleteArtwork,
    updateArtwork,
    updateNovelContent,
    saveReadingProgress,
    getReadingProgress,
    reportArtwork,
    getReportedArtworks,
    resolveArtworkReport,
    hideArtwork,
    unhideArtwork,
    getHiddenArtworks,
    getSimilarArtworks,
};
