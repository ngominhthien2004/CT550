const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/setting.controller');

router.get('/', getSettings);
router.put('/', protect, admin, updateSettings);

module.exports = router;
