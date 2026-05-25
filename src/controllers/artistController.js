const db = require('../config/db');
const cloudinary = require('../config/cloudinary');

//GET ALL ARTISTS
//GET /api/artists
//Public route - no token required  
const getAllArtists = async (req, res) => {
    try {
        //Also count hown many songs each artist have
        const [artists] = await db.query(`
            SELECT
            artists.id,
            artists.name,
            artists.bio,
            artists.image,
            artists.created_at,
            COUNT(DISTINCT songs.id) AS song_count,
            COUNT(DISTINCT albums.id) AS album_count
            FROM artists
            LEFT JOIN songs ON songs.artist_id = artists.id
            LEFT JOIN albums ON albums.artist_id = artists.id
            GROUP BY artists.id
            ORDER BY artists.created_at DESC
        `);

        res.status(200).json({
            count: artists.length,
            artists
        });
    } catch (error) {
        console.error('Get All Artists Error:', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        })
    }
};

//GET ONE ARTIST + THEIR SONGS AND ALBUMS
//GET /api/artists/:id
//Public route - no token required

const getArtistById = async (req, res) => {
    try {
        const { id } = req.params;

        //First get the artist info
        const [artists] = await db.query(`
            SELECT * FROM artists WHERE id = ?
        `, [id]);
        if (artists.length === 0) {
            return res.status(404).json({
                message: 'Artist not found'
            });
        }

        //get all songs by the artists 
        const [songs] = await db.query(`
            SELECT
            songs.id,
            songs.title,
            songs.audio_url,
            songs.cover_image,
            songs.duration,
            albums.title AS album_title
            FROM songs
            LEFT JOIN albums ON songs.album_id = albums.id
            WHERE songs.artist_id = ?
            ORDER BY songs.created_at DESC
        `, [id]);

        //get all albums by the artists
        const [albums] = await db.query(`
            SELECT
            albums.id,
            albums.title,
            albums.cover_image,
            albums.release_year,
            COUNT(songs.id) AS song_count
            FROM albums
            LEFT JOIN songs ON songs.album_id = albums.id
            WHERE albums.artist_id = ?
            GROUP BY albums.id
            ORDER BY albums.created_at DESC
        `, [id]);

        res.status(200).json({
            artist: artists[0],
            songs,
            albums
        });
    } catch (error) {
        console.error('Get Artist by ID Error:', error);
        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    }
};

//CREATE ARTIST
//POST /api/artists
//Private route - token required
const createArtist = async (req, res) => {
    try {
        const { name, bio } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'Artist name is required'
            });
        }

        //if an image was uploaded get its url from cloudinary

        const image = req.file ? req.file.path : null;

        const [result] = await db.query(`
            INSERT INTO artists (name, bio, image) VALUES (?, ?, ?)
        `, [name, bio || null, image]);

        const [newArtist] = await db.query(`
            SELECT * FROM artists WHERE id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Artist created successfully',
            artist: newArtist[0]
        });
    } catch (error) {
        console.error('Create Artist Error:', error);
        res.status(500).json({
            message: 'server error'
        });
    }

};

//  UPDATE ARTIST
//PUT /api/artists/:id
//protected

const updateArtist = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, bio } = req.body;

        const [existing] = await db.query(
            'SELECT * FROM artists WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const updatedName = name || existing[0].name;
        const updatedBio = bio || existing[0].bio;
        // If new image uploaded use it, otherwise keep existing
        const updatedImage = req.file ? req.file.path : existing[0].image;

        await db.query(
            'UPDATE artists SET name = ?, bio = ?, image = ? WHERE id = ?',
            [updatedName, updatedBio, updatedImage, id]
        );

        const [updatedArtist] = await db.query(
            'SELECT * FROM artists WHERE id = ?', [id]
        );

        res.status(200).json({
            message: 'Artist updated successfully',
            artist: updatedArtist[0]
        });

    } catch (error) {
        console.error('Update artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─────────────────────────────────────────
// DELETE ARTIST
// DELETE /api/artists/:id
// Protected
// ─────────────────────────────────────────
const deleteArtist = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM artists WHERE id = ?', [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        // Delete image from Cloudinary if exists
        if (existing[0].image) {
            const urlParts = existing[0].image.split('/');
            const publicId = 'neurosound/images/' + urlParts[urlParts.length - 1].split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Because of CASCADE in our DB schema,
        // deleting an artist also deletes their albums and songs
        await db.query('DELETE FROM artists WHERE id = ?', [id]);

        res.status(200).json({ message: 'Artist deleted successfully' });

    } catch (error) {
        console.error('Delete artist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
};