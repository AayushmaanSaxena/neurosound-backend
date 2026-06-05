const db = require('../config/db');

// ─────────────────────────────────────────
// SEARCH
// GET /api/search?q=searchterm
// Public — no auth needed
// ─────────────────────────────────────────
const search = async (req, res) => {
    try {
        // Get the search term from query parameter
        // Example: /api/search?q=weeknd → req.query.q = 'weeknd'
        const { q } = req.query;

        // If no search term provided, return empty results
        if (!q || q.trim() === '') {
            return res.status(400).json({
                message: 'Please provide a search term'
            });
        }

        // Trim whitespace and convert to lowercase for comparison
        const searchTerm = q.trim();

        // The % wildcards let us match anywhere in the string
        // We pass it as a variable to prevent SQL injection
        const likeTerm = `%${searchTerm}%`;

        // ─────────────────────────────────
        // Search songs
        // ─────────────────────────────────
        const [songs] = await db.query(`
            SELECT 
                songs.id,
                songs.title,
                songs.audio_url,
                songs.cover_image,
                songs.duration,
                artists.name AS artist_name,
                albums.title AS album_title
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            LEFT JOIN albums ON songs.album_id = albums.id
            WHERE LOWER(songs.title) LIKE LOWER(?)
            ORDER BY songs.title ASC
            LIMIT 10
        `, [likeTerm]);

        // ─────────────────────────────────
        // Search artists
        // ─────────────────────────────────
        const [artists] = await db.query(`
            SELECT 
                artists.id,
                artists.name,
                artists.bio,
                artists.image,
                COUNT(DISTINCT songs.id) AS song_count
            FROM artists
            LEFT JOIN songs ON songs.artist_id = artists.id
            WHERE LOWER(artists.name) LIKE LOWER(?)
            GROUP BY artists.id
            ORDER BY artists.name ASC
            LIMIT 5
        `, [likeTerm]);

        // ─────────────────────────────────
        // Search albums
        // ─────────────────────────────────
        const [albums] = await db.query(`
            SELECT 
                albums.id,
                albums.title,
                albums.cover_image,
                albums.release_year,
                artists.name AS artist_name,
                COUNT(songs.id) AS song_count
            FROM albums
            LEFT JOIN artists ON albums.artist_id = artists.id
            LEFT JOIN songs ON songs.album_id = albums.id
            WHERE LOWER(albums.title) LIKE LOWER(?)
            GROUP BY albums.id
            ORDER BY albums.title ASC
            LIMIT 5
        `, [likeTerm]);

        // ─────────────────────────────────
        // Calculate total results found
        // ─────────────────────────────────
        const totalResults = songs.length + artists.length + albums.length;

        // If nothing found across all categories
        if (totalResults === 0) {
            return res.status(200).json({
                query: searchTerm,
                totalResults: 0,
                message: 'No results found',
                songs: [],
                artists: [],
                albums: []
            });
        }

        res.status(200).json({
            query: searchTerm,
            totalResults,
            songs,
            artists,
            albums
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// SEARCH SONGS ONLY
// GET /api/search/songs?q=searchterm
// Public
// ─────────────────────────────────────────
const searchSongs = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Please provide a search term' });
        }

        const likeTerm = `%${q.trim()}%`;

        const [songs] = await db.query(`
            SELECT 
                songs.id,
                songs.title,
                songs.audio_url,
                songs.cover_image,
                songs.duration,
                artists.name AS artist_name,
                albums.title AS album_title
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            LEFT JOIN albums ON songs.album_id = albums.id
            WHERE LOWER(songs.title) LIKE LOWER(?)
            OR LOWER(artists.name) LIKE LOWER(?)
            ORDER BY songs.title ASC
            LIMIT 20
        `, [likeTerm, likeTerm]);

        // Notice we search by BOTH song title AND artist name
        // So searching "weeknd" finds all The Weeknd's songs too

        res.status(200).json({
            query: q.trim(),
            count: songs.length,
            songs
        });

    } catch (error) {
        console.error('Search songs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// SEARCH ARTISTS ONLY
// GET /api/search/artists?q=searchterm
// Public
// ─────────────────────────────────────────
const searchArtists = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Please provide a search term' });
        }

        const likeTerm = `%${q.trim()}%`;

        const [artists] = await db.query(`
            SELECT 
                artists.id,
                artists.name,
                artists.bio,
                artists.image,
                COUNT(DISTINCT songs.id) AS song_count,
                COUNT(DISTINCT albums.id) AS album_count
            FROM artists
            LEFT JOIN songs ON songs.artist_id = artists.id
            LEFT JOIN albums ON albums.artist_id = artists.id
            WHERE LOWER(artists.name) LIKE LOWER(?)
            GROUP BY artists.id
            ORDER BY artists.name ASC
            LIMIT 10
        `, [likeTerm]);

        res.status(200).json({
            query: q.trim(),
            count: artists.length,
            artists
        });

    } catch (error) {
        console.error('Search artists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { search, searchSongs, searchArtists };