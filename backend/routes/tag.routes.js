const express = require('express');
const { listTags, getTagDetail } = require('../controllers/tag.controller');

const router = express.Router();

router.get('/', listTags);
router.get('/:tagName', getTagDetail);

module.exports = router;
