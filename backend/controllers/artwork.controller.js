const Artwork = require('../models/Artwork');
const Tag = require('../models/Tag');
const fs = require('fs');
const path = require('path');

// Create Artwork
const createArtwork = async (req, res, next) => {
    try {
        const { title, description, type, ageRating, tags } = req.body;
        
        if (!req.files || req.files.length === 0) {
            res.status(400);
            return next(new Error('Please upload at least one image'));
        }

        const publicDir = path.join(__dirname, '..', 'public');
        const images = req.files.map((file) => {
            const relativePath = path.relative(publicDir, file.path).replace(/\\/g, '/');
            return `/${relativePath}`;
        });

        // Handle tags (simplified for phase 1 - convert strings to Tag IDs or just use what is sent)
        // For now, let's assume tags are sent as an array of strings or existing IDs
        let tagIds = [];
        if (tags) {
            const tagList = Array.isArray(tags) ? tags : [tags];
            for (const tagName of tagList) {
                let tag = await Tag.findOne({ name: tagName.toLowerCase() });
                if (!tag) {
                    tag = await Tag.create({ name: tagName.toLowerCase() });
                }
                tagIds.push(tag._id);
                // Increment usage count
                tag.usageCount += 1;
                await tag.save();
            }
        }

        const artwork = await Artwork.create({
            user: req.user._id,
            title,
            description,
            type,
            images,
            tags: tagIds,
            ageRating
        });

        res.status(201).json(artwork);
    } catch (error) {
        next(error);
    }
};

// Get All Artworks (with basic filtering)
const getArtworks = async (req, res, next) => {
    try {
        const { type, ageRating, user, tag, q, limit: rawLimit } = req.query;
        const query = {};
        const parsedLimit = Number.parseInt(rawLimit, 10);
        const limit = Number.isNaN(parsedLimit) ? 48 : Math.min(Math.max(parsedLimit, 1), 200);

        if (type) query.type = type;
        if (ageRating) query.ageRating = ageRating;
        if (user) query.user = user;
        if (tag) {
            const foundTag = await Tag.findOne({ name: tag.toLowerCase() });
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

        const artworks = await Artwork.find(query)
            .populate('user', 'username displayName avatar')
            .populate('tags', 'name')
            .sort({ createdAt: -1 })
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
            res.json(artwork);
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

        // Delete files from storage
        artwork.images.forEach(imagePath => {
            const normalizedImagePath = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
            const relativeToUploads = normalizedImagePath.startsWith('uploads/')
                ? normalizedImagePath.slice('uploads/'.length)
                : normalizedImagePath;
            const fullPath = path.join(__dirname, '..', 'public', 'uploads', relativeToUploads);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        });

        await artwork.deleteOne();
        res.json({ message: 'Artwork removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createArtwork,
    getArtworks,
    getArtworkById,
    getAdminArtworks,
    deleteArtwork
};
