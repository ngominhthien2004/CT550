const express = require('express');
const {
    createPaymentIntent,
    createQrPaymentIntent,
    createPayoutMethod,
    getMyBalance,
    getMyPayments,
    getMyPayouts,
    getMyTransactions,
    getPayoutMethods,
    handlePaymentWebhook,
    refundPayment,
    releaseEscrow,
    requestPayout,
    simulateBankQrConfirmation,
    upsertPaymentConfig,
} = require('../controllers/payment.controller');
const { protect, admin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/intents', protect, createPaymentIntent);
router.post('/qr-intents', protect, createQrPaymentIntent);
router.post('/webhooks/:gateway', handlePaymentWebhook);
router.post('/:id/release', protect, releaseEscrow);
router.post('/:id/refund', protect, refundPayment);
router.post('/:id/simulate-bank-confirm', protect, simulateBankQrConfirmation);
router.get('/mine', protect, getMyPayments);
router.get('/balance', protect, getMyBalance);
router.get('/transactions', protect, getMyTransactions);

router.route('/payout-methods')
    .get(protect, getPayoutMethods)
    .post(protect, createPayoutMethod);

router.route('/payouts')
    .get(protect, getMyPayouts)
    .post(protect, requestPayout);

router.put('/admin/config', protect, admin, upsertPaymentConfig);

module.exports = router;
