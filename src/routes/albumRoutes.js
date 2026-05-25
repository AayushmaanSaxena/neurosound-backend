const express = require('express');
const router = express.Router();
const {
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum
} = require('../controllers/albumController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getAllAlbums);
router.get('/:id', getAlbumById);

// Protected routes
router.post('/', protect, uploadImage.single('image'), createAlbum);
router.put('/:id', protect, uploadImage.single('image'), updateAlbum);
router.delete('/:id', protect, deleteAlbum);

module.exports = router;