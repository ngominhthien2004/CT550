const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
  checkWatchlistStatus,
  getSeriesWatchlistCount
} = require('../controllers/watchlist.controller');

// ── Public ──────────────────────────────────────────────────────
// Watchlist count for a series (no auth required)
router.get('/series/:id/watchlist/count', getSeriesWatchlistCount);

// ── Protected ───────────────────────────────────────────────────
// My watchlist
router.get('/watchlist', protect, getMyWatchlist);

// Series watchlist operations
router.post('/series/:id/watchlist', protect, addToWatchlist);
router.delete('/series/:id/watchlist', protect, removeFromWatchlist);
router.get('/series/:id/watchlist/status', protect, checkWatchlistStatus);

module.exports = router;
