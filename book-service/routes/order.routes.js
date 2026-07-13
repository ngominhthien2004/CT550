const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getSellerOrders,
    getDownloadUrl
} = require('../controllers/order.controller');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/seller', protect, getSellerOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);
router.get('/:id/download/:itemId', protect, getDownloadUrl);

module.exports = router;
