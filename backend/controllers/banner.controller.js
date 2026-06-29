const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// @desc    Get active banners (public)
// @route   GET /api/banners
const getActiveBanners = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
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
      bannerData.image = '/uploads/banners/' + req.file.filename;
    } else {
      res.status(400);
      return next(new Error('Banner image is required'));
    }

    const banner = await Banner.create(bannerData);
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
      // Delete old image if it exists and is in our uploads directory
      if (banner.image && banner.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', 'public', banner.image.replace('/uploads/', 'uploads/'));
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          // Ignore deletion errors
        }
      }
      banner.image = '/uploads/banners/' + req.file.filename;
    }

    const updated = await banner.save();
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
    res.json({ message: 'Banner removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, deleteBanner };
