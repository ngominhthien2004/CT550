const Setting = require('../models/Setting');

const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowedFields = ['aiDetectionEnabled', 'aiDetectionThreshold'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      res.status(400);
      return next(new Error('No valid fields to update'));
    }
    const settings = await Setting.updateSettings(updates);
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
