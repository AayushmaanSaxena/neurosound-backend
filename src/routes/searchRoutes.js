const express = require('express');
const router = express.Router();
const { search, searchSongs, searchArtists } = require('../controllers/searchController');

// All search routes are public — no auth needed
// GET /api/search?q=term          → search everything
// GET /api/search/songs?q=term    → songs only
// GET /api/search/artists?q=term  → artists only
router.get('/', search);
router.get('/songs', searchSongs);
router.get('/artists', searchArtists);

module.exports = router;