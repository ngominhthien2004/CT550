const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth.middleware');
const { reportUser, getMyReports, getAdminUserReports, resolveUserReport, getModerationCaseDetail } = require('../controllers/userReport.controller');

// User report routes
router.post('/:id/report', protect, reportUser);
router.get('/me/reports', protect, getMyReports);

// Admin report routes
router.get('/admin/reports', protect, admin, getAdminUserReports);
router.patch('/admin/reports/:id/resolve', protect, admin, resolveUserReport);
router.get('/admin/reports/detail', protect, admin, getModerationCaseDetail);

module.exports = router;
