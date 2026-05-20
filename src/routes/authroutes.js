const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authMiddleware');
// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);


// Protected routes — token required
// protect runs first, then getMe
// If protect calls next() → getMe runs
// If protect sends a 401 → getMe never runs
router.get('/me', protect, getMe);

module.exports = router;