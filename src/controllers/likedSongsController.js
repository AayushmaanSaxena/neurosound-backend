const db = require('../config/db');

// ─────────────────────────────────────────
// GET ALL LIKED SONGS FOR LOGGED IN USER
// GET /api/liked-songs
// Protected
// ─────────────────────────────────────────
const getLikedSongs = async (req, res) => {
    try {
        const [songs] = await db.query(`
            SELECT 
                songs.id,
                songs.title,
                songs.audio_url,
                songs.cover_image,
                songs.duration,
                artists.name AS artist_name,
                artists.id AS artist_id,
                albums.title AS album_title,
                albums.id AS album_id,
                liked_songs.liked_at
            FROM liked_songs
            JOIN songs ON liked_songs.song_id = songs.id
            LEFT JOIN artists ON songs.artist_id = artists.id
            LEFT JOIN albums ON songs.album_id = albums.id
            WHERE liked_songs.user_id = ?
            ORDER BY liked_songs.liked_at DESC
        `, [req.user.id]);

        res.status(200).json({
            count: songs.length,
            songs
        });

    } catch (error) {
        console.error('Get liked songs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// LIKE A SONG
// POST /api/liked-songs/:songId
// Protected
// ─────────────────────────────────────────
const likeSong = async (req, res) => {
    try {
        const { songId } = req.params;

        // Check if song exists
        const [song] = await db.query(
            'SELECT id, title FROM songs WHERE id = ?', [songId]
        );

        if (song.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM liked_songs WHERE user_id = ? AND song_id = ?',
            [req.user.id, songId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: 'Song is already in your liked songs'
            });
        }

        // Add to liked songs
        await db.query(
            'INSERT INTO liked_songs (user_id, song_id) VALUES (?, ?)',
            [req.user.id, songId]
        );

        res.status(201).json({
            message: `${song[0].title} added to your liked songs`
        });

    } catch (error) {
        console.error('Like song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// UNLIKE A SONG
// DELETE /api/liked-songs/:songId
// Protected
// ─────────────────────────────────────────
const unlikeSong = async (req, res) => {
    try {
        const { songId } = req.params;

        // Check if song is actually liked
        const [existing] = await db.query(
            'SELECT * FROM liked_songs WHERE user_id = ? AND song_id = ?',
            [req.user.id, songId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: 'Song not found in your liked songs'
            });
        }

        await db.query(
            'DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?',
            [req.user.id, songId]
        );

        res.status(200).json({
            message: 'Song removed from your liked songs'
        });

    } catch (error) {
        console.error('Unlike song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// CHECK IF A SONG IS LIKED
// GET /api/liked-songs/:songId/check
// Protected
// Frontend uses this to show filled/empty heart
// ─────────────────────────────────────────
const checkIfLiked = async (req, res) => {
    try {
        const { songId } = req.params;

        const [result] = await db.query(
            'SELECT * FROM liked_songs WHERE user_id = ? AND song_id = ?',
            [req.user.id, songId]
        );

        res.status(200).json({
            isLiked: result.length > 0
            // returns true or false
            // frontend uses this to show filled heart (liked) or empty heart (not liked)
        });

    } catch (error) {
        console.error('Check liked error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// TOGGLE LIKE — like if not liked, unlike if liked
// POST /api/liked-songs/:songId/toggle
// Protected
// This is what the heart button on the frontend calls
// ─────────────────────────────────────────
const toggleLike = async (req, res) => {
    try {
        const { songId } = req.params;

        // Check if song exists
        const [song] = await db.query(
            'SELECT id, title FROM songs WHERE id = ?', [songId]
        );

        if (song.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM liked_songs WHERE user_id = ? AND song_id = ?',
            [req.user.id, songId]
        );

        if (existing.length > 0) {
            // Already liked → unlike it
            await db.query(
                'DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?',
                [req.user.id, songId]
            );
            return res.status(200).json({
                message: 'Song removed from liked songs',
                isLiked: false
            });
        } else {
            // Not liked → like it
            await db.query(
                'INSERT INTO liked_songs (user_id, song_id) VALUES (?, ?)',
                [req.user.id, songId]
            );
            return res.status(201).json({
                message: `${song[0].title} added to liked songs`,
                isLiked: true
            });
        }

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getLikedSongs,
    likeSong,
    unlikeSong,
    checkIfLiked,
    toggleLike
};