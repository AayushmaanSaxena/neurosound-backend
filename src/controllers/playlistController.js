const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────
// GET ALL PLAYLISTS FOR LOGGED IN USER
// GET /api/playlists
// Protected
// ─────────────────────────────────────────
const getUserPlaylists = async (req, res) => {
    try {
        // req.user.id comes from the JWT token via authMiddleware
        const [playlists] = await db.query(`
            SELECT 
                playlists.id,
                playlists.name,
                playlists.cover_image,
                playlists.created_at,
                COUNT(playlist_songs.song_id) AS song_count
            FROM playlists
            LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
            WHERE playlists.user_id = ?
            GROUP BY playlists.id
            ORDER BY playlists.created_at DESC
        `, [req.user.id]);

        res.status(200).json({
            count: playlists.length,
            playlists
        });

    } catch (error) {
        console.error('Get user playlists error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// GET ONE PLAYLIST WITH ALL ITS SONGS
// GET /api/playlists/:id
// Protected
// ─────────────────────────────────────────
const getPlaylistById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get playlist info
        const [playlists] = await db.query(`
            SELECT playlists.*, users.name AS owner_name
            FROM playlists
            LEFT JOIN users ON playlists.user_id = users.id
            WHERE playlists.id = ?
        `, [id]);

        if (playlists.length === 0) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Make sure only the owner can view their playlist
        if (playlists[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: 'You do not have permission to view this playlist'
            });
        }

        // Get all songs in this playlist
        // We JOIN through playlist_songs to get the actual song data
        const [songs] = await db.query(`
            SELECT 
                songs.id,
                songs.title,
                songs.audio_url,
                songs.cover_image,
                songs.duration,
                artists.name AS artist_name,
                playlist_songs.added_at
            FROM playlist_songs
            JOIN songs ON playlist_songs.song_id = songs.id
            LEFT JOIN artists ON songs.artist_id = artists.id
            WHERE playlist_songs.playlist_id = ?
            ORDER BY playlist_songs.added_at ASC
        `, [id]);

        res.status(200).json({
            playlist: playlists[0],
            songs
        });

    } catch (error) {
        console.error('Get playlist by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// CREATE PLAYLIST
// POST /api/playlists
// Protected
// ─────────────────────────────────────────
const createPlaylist = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Playlist name is required' });
        }

        const cover_image = req.file ? req.file.path : null;

        const [result] = await db.query(
            'INSERT INTO playlists (name, user_id, cover_image) VALUES (?, ?, ?)',
            [name, req.user.id, cover_image]
        );

        const [newPlaylist] = await db.query(
            'SELECT * FROM playlists WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Playlist created successfully',
            playlist: newPlaylist[0]
        });

    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// UPDATE PLAYLIST
// PUT /api/playlists/:id
// Protected
// ─────────────────────────────────────────
const updatePlaylist = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM playlists WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Only the owner can update their playlist
        if (existing[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: 'You do not have permission to update this playlist'
            });
        }

        const updatedName = name || existing[0].name;
        const updatedCover = req.file ? req.file.path : existing[0].cover_image;

        await db.query(
            'UPDATE playlists SET name = ?, cover_image = ? WHERE id = ?',
            [updatedName, updatedCover, id]
        );

        const [updatedPlaylist] = await db.query(
            'SELECT * FROM playlists WHERE id = ?', [id]
        );

        res.status(200).json({
            message: 'Playlist updated successfully',
            playlist: updatedPlaylist[0]
        });

    } catch (error) {
        console.error('Update playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// DELETE PLAYLIST
// DELETE /api/playlists/:id
// Protected
// ─────────────────────────────────────────
const deletePlaylist = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM playlists WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Only the owner can delete their playlist
        if (existing[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: 'You do not have permission to delete this playlist'
            });
        }

        // Delete cover image from Cloudinary if exists
        if (existing[0].cover_image) {
            const urlParts = existing[0].cover_image.split('/');
            const publicId = 'neurosound/images/' + urlParts[urlParts.length - 1].split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // CASCADE in schema automatically deletes playlist_songs rows
        await db.query('DELETE FROM playlists WHERE id = ?', [id]);

        res.status(200).json({ message: 'Playlist deleted successfully' });

    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// ADD SONG TO PLAYLIST
// POST /api/playlists/:id/songs
// Protected
// ─────────────────────────────────────────
const addSongToPlaylist = async (req, res) => {
    try {
        const { id } = req.params; // playlist id
        const { song_id } = req.body;

        if (!song_id) {
            return res.status(400).json({ message: 'Song ID is required' });
        }

        // Check playlist exists and belongs to user
        const [playlist] = await db.query(
            'SELECT * FROM playlists WHERE id = ?', [id]
        );

        if (playlist.length === 0) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: 'You do not have permission to modify this playlist'
            });
        }

        // Check song exists
        const [song] = await db.query(
            'SELECT id FROM songs WHERE id = ?', [song_id]
        );

        if (song.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Check if song is already in the playlist
        const [existing] = await db.query(
            'SELECT * FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
            [id, song_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: 'Song is already in this playlist'
            });
        }

        // Add song to playlist
        await db.query(
            'INSERT INTO playlist_songs (playlist_id, song_id) VALUES (?, ?)',
            [id, song_id]
        );

        res.status(201).json({ message: 'Song added to playlist successfully' });

    } catch (error) {
        console.error('Add song to playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// REMOVE SONG FROM PLAYLIST
// DELETE /api/playlists/:id/songs/:songId
// Protected
// ─────────────────────────────────────────
const removeSongFromPlaylist = async (req, res) => {
    try {
        const { id, songId } = req.params;

        // Check playlist exists and belongs to user
        const [playlist] = await db.query(
            'SELECT * FROM playlists WHERE id = ?', [id]
        );

        if (playlist.length === 0) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist[0].user_id !== req.user.id) {
            return res.status(403).json({
                message: 'You do not have permission to modify this playlist'
            });
        }

        // Check if song is actually in the playlist
        const [existing] = await db.query(
            'SELECT * FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
            [id, songId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                message: 'Song not found in this playlist'
            });
        }

        await db.query(
            'DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?',
            [id, songId]
        );

        res.status(200).json({ message: 'Song removed from playlist successfully' });

    } catch (error) {
        console.error('Remove song from playlist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist
};