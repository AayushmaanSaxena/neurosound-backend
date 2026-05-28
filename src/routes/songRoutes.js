const express = require('express');
const router = express.Router();
const { getAllSongs, getSongById, createSong, updateSong, deleteSong } = require('../controllers/songController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSongFiles, handleUploadError } = require('../middleware/uploadMiddleware');

//public routes
router.get('/', getAllSongs);
router.get('/:id', getSongById);


// Protected routes
// uploadSong.single('audio') means:
// accept one file from a field named 'audio'
// multer uploads it to Cloudinary before createSong runs
router.post('/', protect, uploadSongFiles.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), handleUploadError, createSong);
router.put('/:id', protect, uploadSongFiles.fields([{ name: 'audio', maxCount: 1 }, { name: 'image', maxCount: 1 }]), handleUploadError, updateSong);
router.delete('/:id', protect, deleteSong);

module.exports = router;