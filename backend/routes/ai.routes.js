const express = require('express');
const multer = require('multer');
const {
    chat,
    agentChat,
    recommendArtworks,
    searchByAI,
    summarizeArtwork,
    detectAIImage,
    autoTagUpload,
} = require('../controllers/ai.controller.js');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/chat', protect, chat);
router.post('/agent-chat', protect, agentChat);
router.post('/recommend', protect, recommendArtworks);
router.post('/search', protect, searchByAI);
router.post('/summarize/:artworkId', protect, summarizeArtwork);
router.post('/detect-image', protect, upload.single('image'), detectAIImage);
router.post('/auto-tag', protect, upload.single('image'), autoTagUpload);

module.exports = router;
