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

        //validate required fields
        if (!title || !artist_id) {
            return res.status(400).json({
                message: 'Please provide title and artist_id'
            });
        }

        //req.file is set by multer when the file is uploaded
        if (!req.file) {
            return res.status(400).json({
                message: 'Audio file is required'
            });
        }

        //req.file.path is the cloudinary URL of the uploaded file
        const audio_url = req.file.path;

        const [result] = await db.query(
            `INSERT INTO songs 
                (title, artist_id, album_id, duration, audio_url) 
            VALUES(?, ?, ?, ?, ?)`,
        [title, artist_id, album_id || null, duration || null, audio_url]
        );

        //fetcht the newly created song to return it
        const [newsong] = await db.query(
            'SELECT * FROM songs WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Song created successfully',
            song: newsong[0]
        });
    }
    catch (error) {
        console.error('Create Song Error:', error);
        res.status(500).json({  
            message: 'Server error. Please try again.'
        });
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

        // Check if song exists
        const [existing] = await db.query(
            'SELECT * FROM songs WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Use existing values if new ones aren't provided
        const updatedTitle = title || existing[0].title;
        const updatedArtist = artist_id || existing[0].artist_id;
        const updatedAlbum = album_id || existing[0].album_id;
        const updatedDuration = duration || existing[0].duration;

        await db.query(
            `UPDATE songs 
             SET title = ?, artist_id = ?, album_id = ?, duration = ?
             WHERE id = ?`,
            [updatedTitle, updatedArtist, updatedAlbum, updatedDuration, id]
        );

        const [updatedSong] = await db.query(
            'SELECT * FROM songs WHERE id = ?', [id]
        );

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