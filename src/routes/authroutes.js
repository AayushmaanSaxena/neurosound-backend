const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, refresh } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');

// Public routes — no token required
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);


// Protected routes — token required
// protect runs first, then getMe
// If protect calls next() → getMe runs
// If protect sends a 401 → getMe never runs
router.get('/me', protect, getMe);

module.exports = router;