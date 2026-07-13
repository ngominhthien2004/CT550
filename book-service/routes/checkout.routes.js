const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { createCheckoutSession } = require('../controllers/checkout.controller');

const router = express.Router();

router.post('/', protect, createCheckoutSession);

module.exports = router;
