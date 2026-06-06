const Artwork = require('../models/Artwork');
const User = require('../models/User');
const Chapter = require('../models/Chapter');
const ReadingProgress = require('../models/ReadingProgress');
const Tag = require('../models/Tag');
const { createNotification } = require('../utils/notification');
const { detectAIWithHuggingFace } = require('../services/huggingface.service');
const { getAiDetectionThreshold } = require('../config/env');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const normalizeTagName = (rawTagName = '') =>
    String(rawTagName)
        .trim()
        .replace(/^#+/, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

const AI_TAG_NAME = normalizeTagName('ai');
const MAX_ARTWORK_IMAGES = 50;

async function runAiDetection(primaryImagePath) {
    try {
        // Check if AI detection is enabled by admin
        let aiEnabled = true;
        try {
            const adminSettings = await User.findOne({ role: 'admin' }).select('aiDetectionEnabled');
            if (adminSettings) {
                aiEnabled = adminSettings.aiDetectionEnabled;
            }
        } catch (_) {
            // If query fails, default to enabled
        }

        if (!aiEnabled) {
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
        const { title, description, type, ageRating, tags, gifNotes, novelContent, novelFormat, novelSeriesName } = req.body;

        if (!req.files || req.files.length === 0) {
            res.status(400);
            return next(new Error('Please upload at least one image'));
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
                // Increment usage count
                tag.usageCount += 1;
                await tag.save();
            }
        }

        const threshold = getAiDetectionThreshold();
        const aiDetection = {
            confidence: null,
            isAI: false,
            threshold,
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
                const isAI = Boolean(detectionResult.isAI) && typeof confidence === 'number'
                    ? confidence >= threshold
                    : false;

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
            gifNotes: gifNotes || '',
        };

        // Set novel-specific fields
        if (artworkType === 'novel') {
            artworkData.novelContent = novelContent || '';
            artworkData.novelFormat = novelFormat || 'oneshot';
            artworkData.novelSeriesName = novelSeriesName || '';
            // For oneshot novels, sync description with novelContent for backward compatibility
            if (novelFormat !== 'series') {
                artworkData.description = artworkData.description || (novelContent || '').slice(0, 500);
            }
        }

        const artwork = await Artwork.create(artworkData);

        // Auto-create a Chapter for oneshot novels with content
        if (artworkType === 'novel' && novelFormat !== 'series' && novelContent) {
            await Chapter.create({
                artwork: artwork._id,
                title: title || 'Chapter 1',
                content: novelContent,
                chapterNumber: 1,
            });
        }

        await createNotification({
            userId: req.user._id,
            artworkId: artwork._id,
            type: 'system',
            message: `Artwork "${artwork.title}" posted successfully.`
        });

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
            sortBy, novelFormat, minWords, maxWords,
        } = req.query;
        const query = {};
        const parsedLimit = Number.parseInt(rawLimit, 10);
        const limit = Number.isNaN(parsedLimit) ? 48 : Math.min(Math.max(parsedLimit, 1), 200);

        if (type) query.type = type;
        if (ageRating) query.ageRating = ageRating;
        if (user) query.user = user;
        if (tag) {
            const foundTag = await Tag.findOne({ name: normalizeTagName(tag) });
            if (foundTag) query.tags = foundTag._id;
        }
        if (q) {
            const keyword = q.trim();
            if (keyword) {
                query.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        // Novel-specific filters (only apply when type is 'novel' or no type filter)
        if (novelFormat && (!type || type === 'novel')) {
            query.novelFormat = novelFormat === 'series' ? 'series' : 'oneshot';
        }
        if ((minWords || maxWords) && (!type || type === 'novel')) {
            query.wordCount = {};
            const minW = Number.parseInt(minWords, 10);
            const maxW = Number.parseInt(maxWords, 10);
            if (!Number.isNaN(minW)) query.wordCount.$gte = minW;
            if (!Number.isNaN(maxW)) query.wordCount.$lte = maxW;
        }

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
            .limit(limit);

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
            // Increment view count
            artwork.viewCount += 1;
            await artwork.save();

            // For novels, include chapter count from Chapter model
            let chapters = [];
            if (artwork.type === 'novel') {
                chapters = await Chapter.find({ artwork: artwork._id })
                    .sort({ chapterNumber: 1 })
                    .select('title chapterNumber wordCount createdAt');
            }

            const result = artwork.toObject({ virtuals: true });
            result.chapters = chapters;
            res.json(result);
        } else {
            res.status(404);
            next(new Error('Artwork not found'));
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
        const { q, type, ageRating } = req.query;

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
            return next(new Error('Artwork not found'));
        }

        // Check if user owns the artwork
        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            return next(new Error('User not authorized to delete this artwork'));
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
        res.json({ message: 'Artwork removed' });
    } catch (error) {
        next(error);
    }
};

// Novel content update
const updateNovelContent = async (req, res, next) => {
    try {
        const { novelContent, novelFormat, novelSeriesName } = req.body;
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }

        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            return next(new Error('Not authorized'));
        }

        if (artwork.type !== 'novel') {
            res.status(400);
            return next(new Error('This artwork is not a novel'));
        }

        artwork.novelContent = novelContent || '';
        artwork.novelFormat = novelFormat || artwork.novelFormat;
        artwork.novelSeriesName = novelSeriesName || artwork.novelSeriesName;

        // Sync description for backward compatibility with oneshot novels
        if (artwork.novelFormat !== 'series' && novelContent) {
            artwork.description = novelContent.slice(0, 500);
        }

        await artwork.save();
        res.json(artwork);
    } catch (error) {
        next(error);
    }
};

// Chapter management
const getChapters = async (req, res, next) => {
    try {
        const chapters = await Chapter.find({ artwork: req.params.id })
            .sort({ chapterNumber: 1 })
            .select('-content');
        res.json(chapters);
    } catch (error) {
        next(error);
    }
};

const getChapter = async (req, res, next) => {
    try {
        const chapter = await Chapter.findOne({
            _id: req.params.chapterId,
            artwork: req.params.id,
        });
        if (!chapter) {
            res.status(404);
            return next(new Error('Chapter not found'));
        }
        res.json(chapter);
    } catch (error) {
        next(error);
    }
};

const createChapter = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            res.status(404);
            return next(new Error('Artwork not found'));
        }
        if (artwork.user.toString() !== req.user._id.toString()) {
            res.status(401);
            return next(new Error('Not authorized'));
        }

        const { title, content } = req.body;

        // Get next chapter number
        const lastChapter = await Chapter.findOne({ artwork: req.params.id })
            .sort({ chapterNumber: -1 });
        const chapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;

        const chapter = await Chapter.create({
            artwork: req.params.id,
            title,
            content,
            chapterNumber,
        });

        // Update chapter count on artwork
        artwork.chapterCount = chapterNumber;
        await artwork.save();

        res.status(201).json(chapter);
    } catch (error) {
        next(error);
    }
};

const deleteChapter = async (req, res, next) => {
    try {
        const chapter = await Chapter.findOne({
            _id: req.params.chapterId,
            artwork: req.params.id,
        });
        if (!chapter) {
            res.status(404);
            return next(new Error('Chapter not found'));
        }

        const artwork = await Artwork.findById(req.params.id);
        if (artwork.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            return next(new Error('Not authorized'));
        }

        await chapter.deleteOne();

        // Recalculate chapter count
        const count = await Chapter.countDocuments({ artwork: req.params.id });
        artwork.chapterCount = count;
        await artwork.save();

        res.json({ message: 'Chapter deleted' });
    } catch (error) {
        next(error);
    }
};

// Reading progress
const saveReadingProgress = async (req, res, next) => {
    try {
        const { chapter, progressPercent, scrollPosition } = req.body;

        const progress = await ReadingProgress.findOneAndUpdate(
            { user: req.user._id, artwork: req.params.id },
            {
                user: req.user._id,
                artwork: req.params.id,
                chapter: chapter || null,
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

module.exports = {
    createArtwork,
    getArtworks,
    getArtworkById,
    getAdminArtworks,
    deleteArtwork,
    updateNovelContent,
    getChapters,
    getChapter,
    createChapter,
    deleteChapter,
    saveReadingProgress,
    getReadingProgress,
};
