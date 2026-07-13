const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const {
    getCloudinaryCloudName,
    getCloudinaryApiKey,
    getCloudinaryApiSecret,
} = require('./env');

const cloudName = getCloudinaryCloudName();
const apiKey = getCloudinaryApiKey();
const apiSecret = getCloudinaryApiSecret();

if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
}

const memoryStorage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedEbookTypes = ['application/pdf', 'application/epub+zip'];

const fileFilter = (req, file, cb) => {
    if (allowedImageTypes.includes(file.mimetype) || allowedEbookTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.epub'];
    if (allowedExts.includes(ext)) {
        return cb(null, true);
    }

    cb(new Error(`Unsupported file type: ${file.mimetype || ext}`), false);
};

const upload = multer({
    storage: memoryStorage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
    },
});

const uploadBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        });
        stream.end(buffer);
    });
};

const uploadImage = async (buffer, filename) => {
    const publicId = filename
        ? path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, '_')
        : `book-cover-${Date.now()}`;

    const result = await uploadBuffer(buffer, {
        resource_type: 'image',
        public_id: publicId,
        folder: 'book-service/covers',
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

const uploadEbook = async (buffer, filename) => {
    const publicId = filename
        ? path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, '_')
        : `ebook-${Date.now()}`;

    const result = await uploadBuffer(buffer, {
        resource_type: 'raw',
        public_id: publicId,
        folder: 'book-service/ebooks',
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

module.exports = {
    upload,
    uploadImage,
    uploadEbook,
};
