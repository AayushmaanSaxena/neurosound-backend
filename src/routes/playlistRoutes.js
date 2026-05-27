const express = require('express');
const router = express.Router();
const {
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist
} = require('../controllers/playlistController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../middleware/uploadMiddleware');

// All playlist routes are protected — must be logged in
router.get('/', protect, getUserPlaylists);
router.get('/:id', protect, getPlaylistById);
router.post('/', protect, uploadImage.single('image'), createPlaylist);
router.put('/:id', protect, uploadImage.single('image'), updatePlaylist);
router.delete('/:id', protect, deletePlaylist);

// Song management routes
router.post('/:id/songs', protect, addSongToPlaylist);
router.delete('/:id/songs/:songId', protect, removeSongFromPlaylist);

module.exports = router;