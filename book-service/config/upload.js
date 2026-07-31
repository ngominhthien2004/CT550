const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
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
const allowedEbookTypes = ['application/zip'];

const fileFilter = (req, file, cb) => {
    if (allowedImageTypes.includes(file.mimetype) || allowedEbookTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip'];
    if (allowedExts.includes(ext)) {
        return cb(null, true);
    }

    cb(new Error(`Unsupported file type: ${file.mimetype || ext}`), false);
};

const upload = multer({
    storage: memoryStorage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200 MB
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

const uploadComicPage = async (buffer, pageNumber) => {
    const publicId = `comic-page-${Date.now()}-${pageNumber}`;

    const result = await uploadBuffer(buffer, {
        resource_type: 'image',
        public_id: publicId,
        folder: 'book-service/pages',
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
    };
};

function createZipFromImages(buffers, filenames) {
    const zip = new AdmZip();
    for (let i = 0; i < buffers.length; i++) {
        const name = filenames[i] || `page-${i + 1}.png`;
        const ext = path.extname(name) || '.png';
        const entryName = `page-${String(i + 1).padStart(3, '0')}${ext}`;
        zip.addFile(entryName, Buffer.from(buffers[i]));
    }
    return zip.toBuffer();
}

module.exports = {
    upload,
    uploadImage,
    uploadEbook,
    uploadComicPage,
    createZipFromImages,
};
