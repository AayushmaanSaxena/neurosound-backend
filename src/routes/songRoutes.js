const express = require('express');
const router = express.Router();
const { getAllSongs, getSongById, createSong, updateSong, deleteSong } = require('../controllers/songController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSong } = require('../middleware/uploadMiddleware');

//public routes
router.get('/', getAllSongs);
router.get('/:id', getSongById);


// Protected routes
// uploadSong.single('audio') means:
// accept one file from a field named 'audio'
// multer uploads it to Cloudinary before createSong runs
router.post('/', protect, uploadSong.single('audio'), createSong);
router.put('/:id', protect, updateSong);
router.delete('/:id', protect, deleteSong);

module.exports = router;