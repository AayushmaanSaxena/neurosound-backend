const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────
// GET ALL ALBUMS
// GET /api/albums
// Public
// ─────────────────────────────────────────
const getAllAlbums = async (req, res) => {
    try {
        const [albums] = await db.query(`
            SELECT 
                albums.id,
                albums.title,
                albums.cover_image,
                albums.release_year,
                albums.created_at,
                artists.id AS artist_id,
                artists.name AS artist_name,
                COUNT(songs.id) AS song_count
            FROM albums
            LEFT JOIN artists ON albums.artist_id = artists.id
            LEFT JOIN songs ON songs.album_id = albums.id
            GROUP BY albums.id
            ORDER BY albums.created_at DESC
        `);

        res.status(200).json({
            count: albums.length,
            albums
        });

    } catch (error) {
        console.error('Get all albums error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// GET ONE ALBUM + ITS SONGS
// GET /api/albums/:id
// Public
// ─────────────────────────────────────────
const getAlbumById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get album info with artist name
        const [albums] = await db.query(`
            SELECT 
                albums.*,
                artists.name AS artist_name,
                artists.image AS artist_image
            FROM albums
            LEFT JOIN artists ON albums.artist_id = artists.id
            WHERE albums.id = ?
        `, [id]);

        if (albums.length === 0) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Get all songs in this album
        const [songs] = await db.query(`
            SELECT 
                songs.id,
                songs.title,
                songs.audio_url,
                songs.cover_image,
                songs.duration
            FROM songs
            WHERE songs.album_id = ?
            ORDER BY songs.id ASC
        `, [id]);

        res.status(200).json({
            album: albums[0],
            songs
        });

    } catch (error) {
        console.error('Get album by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// CREATE ALBUM
// POST /api/albums
// Protected
// ─────────────────────────────────────────
const createAlbum = async (req, res) => {
    try {
        const { title, artist_id, release_year } = req.body;

        if (!title || !artist_id) {
            return res.status(400).json({
                message: 'Title and artist are required'
            });
        }

        // Check if artist exists
        const [artist] = await db.query(
            'SELECT id FROM artists WHERE id = ?', [artist_id]
        );

        if (artist.length === 0) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const cover_image = req.file ? req.file.path : null;

        const [result] = await db.query(
            `INSERT INTO albums 
                (title, artist_id, cover_image, release_year) 
             VALUES (?, ?, ?, ?)`,
            [title, artist_id, cover_image, release_year || null]
        );

        const [newAlbum] = await db.query(
            'SELECT * FROM albums WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Album created successfully',
            album: newAlbum[0]
        });

    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// UPDATE ALBUM
// PUT /api/albums/:id
// Protected
// ─────────────────────────────────────────
const updateAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, artist_id, release_year } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM albums WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Album not found' });
        }

        const updatedTitle = title || existing[0].title;
        const updatedArtist = artist_id || existing[0].artist_id;
        const updatedYear = release_year || existing[0].release_year;
        const updatedCover = req.file ? req.file.path : existing[0].cover_image;

        await db.query(
            `UPDATE albums 
             SET title = ?, artist_id = ?, release_year = ?, cover_image = ?
             WHERE id = ?`,
            [updatedTitle, updatedArtist, updatedYear, updatedCover, id]
        );

        const [updatedAlbum] = await db.query(
            'SELECT * FROM albums WHERE id = ?', [id]
        );

        res.status(200).json({
            message: 'Album updated successfully',
            album: updatedAlbum[0]
        });

    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// DELETE ALBUM
// DELETE /api/albums/:id
// Protected
// ─────────────────────────────────────────
const deleteAlbum = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM albums WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Delete cover image from Cloudinary if exists
        if (existing[0].cover_image) {
            const urlParts = existing[0].cover_image.split('/');
            const publicId = 'neurosound/images/' + urlParts[urlParts.length - 1].split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Songs inside this album will have album_id set to NULL
        // because of ON DELETE SET NULL in our schema
        await db.query('DELETE FROM albums WHERE id = ?', [id]);

        res.status(200).json({ message: 'Album deleted successfully' });

    } catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllAlbums,
    getAlbumById,
    createAlbum,
    updateAlbum,
    deleteAlbum
};