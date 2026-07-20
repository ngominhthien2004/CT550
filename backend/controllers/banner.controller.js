const Banner = require('../models/Banner');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const { getOrSetWithL2, delByPrefix, TTL, buildKey } = require('../utils/cache');

const CACHE_PREFIX = 'banners';

// @desc    Get active banners (public)
// @route   GET /api/banners
const getActiveBanners = async (req, res, next) => {
  try {
    const cacheKey = buildKey(CACHE_PREFIX, req.query);
    const banners = await getOrSetWithL2(cacheKey, async () => {
      const filter = { isActive: true };
      if (req.query.type) {
        filter.type = req.query.type;
      }
      return await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    }, TTL.BANNERS);
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all banners (admin)
// @route   GET /api/banners/admin
const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a banner (admin)
// @route   POST /api/banners
const createBanner = async (req, res, next) => {
  try {
    const { link, title, type, isActive, sortOrder } = req.body;

    if (!link) {
      res.status(400);
      return next(new Error('Link is required'));
    }

    const bannerData = {
      link,
      title: title || '',
      type: type || 'home',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    };

    // If an image file was uploaded
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'illuwrl-banners',
        resource_type: 'image',
      });
      bannerData.image = result.secure_url;
    } else {
      res.status(400);
      return next(new Error('Banner image is required'));
    }

    const banner = await Banner.create(bannerData);

    // Invalidate banner cache
    delByPrefix(CACHE_PREFIX);

    res.status(201).json(banner);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a banner (admin)
// @route   PUT /api/banners/:id
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      return next(new Error('Banner not found'));
    }

    const { link, title, type, isActive, sortOrder } = req.body;

    if (link !== undefined) banner.link = link;
    if (title !== undefined) banner.title = title;
    if (type !== undefined) banner.type = type;
    if (isActive !== undefined) banner.isActive = isActive;
    if (sortOrder !== undefined) banner.sortOrder = sortOrder;

    // If a new image was uploaded, replace the old one
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'illuwrl-banners',
        resource_type: 'image',
      });
      banner.image = result.secure_url;
    }

    const updated = await banner.save();

    // Invalidate banner cache
    delByPrefix(CACHE_PREFIX);

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a banner (admin)
// @route   DELETE /api/banners/:id
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404);
      return next(new Error('Banner not found'));
    }

    // Delete the image file
    if (banner.image && banner.image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', banner.image.replace('/uploads/', 'uploads/'));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore deletion errors
      }
    }

    await Banner.findByIdAndDelete(req.params.id);

    // Invalidate banner cache
    delByPrefix(CACHE_PREFIX);

    res.json({ message: 'Banner removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };