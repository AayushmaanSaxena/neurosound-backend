const express = require('express');
const router = express.Router();
const {
    getLikedSongs,
    likeSong,
    unlikeSong,
    checkIfLiked,
    toggleLike
} = require('../controllers/likedSongsController');
const { protect } = require('../middleware/authMiddleware');

// All liked songs routes are protected
router.get('/', protect, getLikedSongs);
router.post('/:songId', protect, likeSong);
router.delete('/:songId', protect, unlikeSong);
router.get('/:songId/check', protect, checkIfLiked);
router.post('/:songId/toggle', protect, toggleLike);

module.exports = router;