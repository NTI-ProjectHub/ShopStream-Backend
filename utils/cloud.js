const cloudinary = require('./cloudinary');

exports.uploadCloud = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(); // no file uploaded, just skip
        }

        // Convert buffer to data URI for Cloudinary
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'menus', // optional: organize in a folder
        });

        req.menuImage = result.secure_url; // attach uploaded image URL to request
        return next();
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ 
            message: 'Internal server error',
            process: "Cloudinary Upload"
        });
    }
};

// function to delete image from cloudinary by using imageURL
exports.deleteCloud = async (imageURL) => {
    if (!imageURL) return null;
    try {
        const parts = imageURL.split('/');
        const lastPart = parts.slice(-2).join('/'); // e.g., v12345/folder/file.jpg
        const publicId = lastPart.replace(/\.[^/.]+$/, ''); // remove extension
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
};