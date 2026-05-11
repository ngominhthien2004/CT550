const express = require('express');
const multer = require('multer');
const {
    chat,
    recommendArtworks,
    searchByAI,
    summarizeArtwork,
    detectAIImage,
} = require('../controllers/ai.controller.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/chat', chat);
router.post('/recommend', recommendArtworks);
router.post('/search', searchByAI);
router.post('/summarize/:artworkId', summarizeArtwork);
router.post('/detect-image', upload.single('image'), detectAIImage);

module.exports = router;