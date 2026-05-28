const multer = require('multer');
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

//AUDIO STORAGE
//stores audio files in cloudinary
//under a folder called "neurosound/audio"

const audioStorage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder: 'neurosound/audio',
        resource_type: 'video', //cloudinary treats audio as a type of video, so we set resource_type to 'video' to ensure it accepts audio files
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],//only allow these audio formats
    }
});

//IMAGE STORAGE
//Stores cover images in cloudinary
//under a folder called "neurosound/images"

const imageStorage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder: 'neurosound/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],//only allow these image formats
    }
});

// ─────────────────────────────────────────
// FILE FILTER
// Rejects files that aren't the right type
// This runs before the file is uploaded
// ─────────────────────────────────────────
const audioFileFilter = (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true); // accept the file
    } else {
        cb(new Error('Invalid file type. Only MP3, WAV, OGG and M4A are allowed.'), false);
    }
};

const imageFileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG and WEBP are allowed.'), false);
    }
};

//FILE SIZE LIMITS
//audio: max 20MB
//images: max 5MB

const uploadAudio = multer({
    storage: audioStorage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, //20MB
});

const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB
});

//COMBINE UPLOAD
//for uploading both audio and image 
//in a single request

const uploadSongFiles = multer(
    {
        storage: audioStorage, // Use audio storage for the file
        limits: { fileSize: 20 * 1024 * 1024 }, //20MB
    }
);


// ─────────────────────────────────────────
// MULTER ERROR HANDLER
// Catches multer-specific errors cleanly
// ─────────────────────────────────────────
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 20MB for audio and 5MB for images.'
            });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

module.exports = {
    uploadAudio,
    uploadImage,
    uploadSongFiles,
    handleUploadError
};
