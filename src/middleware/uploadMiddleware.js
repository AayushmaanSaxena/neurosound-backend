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
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],//only allow these image formats
    }
});

//FILE SIZE LIMITS
//audio: max 20MB
//images: max 5MB

const uploadAudio = multer({
    storage: audioStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, //20MB
});

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, //5MB
});

//COMBINE UPLOAD
//for uploading both audio and image 
//in a single request

const uploadSong = multer(
    {
        storage: audioStorage,
        limits: { fileSize: 20 * 1024 * 1024 }, //20MB
    }
);

module.exports = {
    uploadAudio,
    uploadImage,
    uploadSong
};
