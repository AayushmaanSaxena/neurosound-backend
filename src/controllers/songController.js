const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

//GET ALL SONGS
//GET /api/songs
//Public route - no token required

const getAllSongs = async (req, res) => {
    try {
        //JOIN lets us get artist name and album title 
        //in the same query instead of making multiple queries
        const [songs] = await db.query(`
            SELECT 
            songs.id,
            songs.title,
            songs.audio_url,
            songs.cover_image,
            songs.created_at,
            artists.id AS artist_id,
            artists.name AS artist_name,
            albums.id AS album_id,
            albums.title AS album_title
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            LEFT JOIN albums ON songs.album_id = albums.id
            ORDER BY songs.created_at DESC
        `);

        res.status(200).json({
            count: songs.length,
            songs
        });
    }
    catch (error) {
        console.error('Get All Songs Error:', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    };
};

//GET ONE SONG 
//GET /api/songs/:id
//Public route - no token required
const getSongById = async (req, res) => {
    try {
        const { id } = req.params;

        const [songs] = await db.query(`
            SELECT 
            songs.id,
            songs.title,
            songs.audio_url,
            songs.cover_image,
            songs.created_at,   
            artists.id AS artist_id,
            artists.name AS artist_name,
            albums.id AS album_id,
            albums.title AS album_title
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            LEFT JOIN albums ON songs.album_id = albums.id
            WHERE songs.id = ?
        `, [id]);

        if (songs.length === 0) {
            return res.status(404).json({
                message: 'Song not found'
            });
        }

        res.status(200).json({
            song: songs[0]
        });
    }
    catch (error) {
        console.error('Get Song by ID Error:', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    }
};

//CREATE SONG
//POST /api/songs
//Protected route - token required
const createSong = async (req, res) => {
    try {
        const { title, artist_id, album_id, duration } = req.body;

        if (!title || !artist_id) {
            return res.status(400).json({
                message: 'Title and artist are required'
            });
        }

        // req.files is used when uploading multiple files
        // req.files['audio'] is an array — we take index [0]
        if (!req.files || !req.files['audio']) {
            return res.status(400).json({
                message: 'Audio file is required'
            });
        }

        // Check artist exists
        const [artist] = await db.query(
            'SELECT id FROM artists WHERE id = ?', [artist_id]
        );

        if (artist.length === 0) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const audio_url = req.files['audio'][0].path;

        // Cover image is optional
        const cover_image = req.files['image']
            ? req.files['image'][0].path
            : null;

        const [result] = await db.query(
            `INSERT INTO songs 
                (title, artist_id, album_id, audio_url, cover_image, duration) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, artist_id, album_id || null, audio_url, cover_image, duration || null]
        );

        const [newSong] = await db.query(`
            SELECT 
                songs.*,
                artists.name AS artist_name
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            WHERE songs.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Song created successfully',
            song: newSong[0]
        });

    } catch (error) {
        console.error('Create song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// ─────────────────────────────────────────
// UPDATE SONG
// PUT /api/songs/:id
// Protected — must be logged in
// ─────────────────────────────────────────
const updateSong = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, artist_id, album_id, duration } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM songs WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const updatedTitle = title || existing[0].title;
        const updatedArtist = artist_id || existing[0].artist_id;
        const updatedAlbum = album_id || existing[0].album_id;
        const updatedDuration = duration || existing[0].duration;

        // If new cover image uploaded, use it
        // Otherwise keep existing
        const updatedCover = req.files && req.files['image']
            ? req.files['image'][0].path
            : existing[0].cover_image;

        await db.query(
            `UPDATE songs 
             SET title = ?, artist_id = ?, album_id = ?, duration = ?, cover_image = ?
             WHERE id = ?`,
            [updatedTitle, updatedArtist, updatedAlbum, updatedDuration, updatedCover, id]
        );

        const [updatedSong] = await db.query(`
            SELECT songs.*, artists.name AS artist_name
            FROM songs
            LEFT JOIN artists ON songs.artist_id = artists.id
            WHERE songs.id = ?
        `, [id]);

        res.status(200).json({
            message: 'Song updated successfully',
            song: updatedSong[0]
        });

    } catch (error) {
        console.error('Update song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// DELETE SONG
// DELETE /api/songs/:id
// Protected — must be logged in
// ─────────────────────────────────────────
const deleteSong = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if song exists
        const [existing] = await db.query(
            'SELECT * FROM songs WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Delete the audio file from Cloudinary first
        // The public_id is extracted from the Cloudinary URL
        if (existing[0].audio_url) {
            const urlParts = existing[0].audio_url.split('/');
            const publicId = 'neurosound/audio/' + urlParts[urlParts.length - 1].split('.')[0];
            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }

        await db.query('DELETE FROM songs WHERE id = ?', [id]);

        res.status(200).json({ message: 'Song deleted successfully' });

    } catch (error) {
        console.error('Delete song error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllSongs,
    getSongById,
    createSong,
    updateSong,
    deleteSong
}