const express = require('express');
const router = express.Router();
const {
    getAllArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
} = require('../controllers/artistController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getAllArtists);
router.get('/:id', getArtistById);

// Protected routes
// uploadImage.single('image') means accept one image file
// from a field named 'image'
router.post('/', protect, uploadImage.single('image'), createArtist);
router.put('/:id', protect, uploadImage.single('image'), updateArtist);
router.delete('/:id', protect, deleteArtist);

module.exports = router;