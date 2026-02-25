const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../middleware/cloudinaryUpload');

// POST /api/upload/profile-photo
// Accepts a single file in the field "photo", uploads to Cloudinary, returns secure URL
router.post('/profile-photo', uploadToCloudinary.single('photo'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // multer-storage-cloudinary attaches the Cloudinary result to req.file
        const imageUrl = req.file.path; // secure_url from Cloudinary
        res.status(200).json({ url: imageUrl });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});

module.exports = router;
