const express = require('express');
const router = express.Router();
const { registerUser, loginUser, oauthLogin } = require('../controllers/auth.controller');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/oauth', oauthLogin);

module.exports = router;
