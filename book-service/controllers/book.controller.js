const Book = require('../models/Book');
const { uploadImage, uploadEbook, uploadComicPage, createZipFromImages } = require('../config/upload');
const { upsertTags } = require('../utils/tagSync');
const { extractComicPages } = require('../utils/comicZip');

const parsePositiveInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseArrayInput = (value) => {
    if (Array.isArray(value)) {
        return value.filter(Boolean).map((item) => String(item).trim());
    }

    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).map((item) => String(item).trim());
            }
        } catch {
            // Not JSON — treat as comma-separated
        }

        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const isAuthorizedToModify = (book, user) => {
    return book.seller.toString() === user._id.toString() || user.role === 'admin';
};

const listBooks = async (req, res, next) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePositiveInt(req.query.limit, 12);
        const skip = (page - 1) * limit;

        const query = { isActive: true };

        const status = req.query.status || 'published';
        if (['draft', 'published', 'archived'].includes(status)) {
            query.status = status;
        }

        if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
            query.price = {};
            const minPrice = parseNumber(req.query.minPrice, null);
            const maxPrice = parseNumber(req.query.maxPrice, null);

            if (minPrice !== null) {
                query.price.$gte = minPrice;
            }
            if (maxPrice !== null) {
                query.price.$lte = maxPrice;
            }
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { tags: searchRegex }
            ];
        }

        let sortOption = {};
        switch (req.query.sort) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'bestselling':
                sortOption = { soldCount: -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
        }

        const [books, total] = await Promise.all([
            Book.find(query)
                .populate('seller', '_id username displayName avatar')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(query)
        ]);

        res.json({
            data: books,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getBookById = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('seller', '_id username displayName avatar');

        if (!book || !book.isActive) {
            res.status(404);
            return next(new Error('Book not found'));
        }

        res.json(book);
    } catch (error) {
        next(error);
    }
};

const normalizeTag = (raw) => {
    const trimmed = String(raw || '').trim().toLowerCase().replace(/^#/, '');
    return trimmed;
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags
        .map(normalizeTag)
        .filter((t) => t.length > 0 && t.length <= 50)
        .slice(0, 10);
};

const createBook = async (req, res, next) => {
    try {
        const { title, description, price, originalPrice, stock, status } = req.body;

        if (!title || !title.trim()) {
            res.status(400);
            return next(new Error('Title is required'));
        }

        if (title.trim().length > 100) {
            res.status(400);
            return next(new Error('Title must be 100 characters or less'));
        }

        const parsedPrice = parseNumber(price, null);
        if (parsedPrice === null || parsedPrice < 0) {
            res.status(400);
            return next(new Error('Price is required and must be a non-negative number'));
        }

        const ebookFileBuffer = req.files?.ebookFile?.[0]?.buffer;
        const ebookFileOriginalName = req.files?.ebookFile?.[0]?.originalname;
        const imageBuffers = req.files?.images?.map(f => f.buffer) || [];
        const imageNames = req.files?.images?.map(f => f.originalname) || [];

        const isZip = /\.zip$/i.test(ebookFileOriginalName || '') || req.files?.ebookFile?.[0]?.mimetype === 'application/zip';
        const isMultiImage = imageBuffers.length > 0;

        if (!ebookFileBuffer && !isMultiImage) {
            res.status(400);
            return next(new Error('At least one ebook file or images must be provided'));
        }

        let ebookUpload;
        let comicPages = [];

        if (isZip) {
            [ebookUpload, comicPages] = await Promise.all([
                uploadEbook(ebookFileBuffer, ebookFileOriginalName),
                extractComicPages(ebookFileBuffer)
            ]);
        } else if (isMultiImage) {
            const pageUploadPromises = imageBuffers.map((buffer, i) => uploadComicPage(buffer, i + 1));
            const zipBuffer = createZipFromImages(imageBuffers, imageNames);

            const [uploadedPages, zipUpload] = await Promise.all([
                Promise.all(pageUploadPromises),
                uploadEbook(zipBuffer, 'comic-pages.zip')
            ]);

            comicPages = uploadedPages.map((uploaded, i) => ({
                url: uploaded.url,
                publicId: uploaded.publicId,
                pageNumber: i + 1
            }));
            ebookUpload = zipUpload;
        } else {
            // Lone non-zip file on the ebookFile field: upload as a plain
            // ebook with no page breakdown.
            ebookUpload = await uploadEbook(ebookFileBuffer, ebookFileOriginalName);
        }

        let coverImageUrls = [];
        const coverImageBuffer = req.files?.coverImage?.[0]?.buffer;
        const coverImageOriginalName = req.files?.coverImage?.[0]?.originalname;

        if (coverImageBuffer) {
            const coverUpload = await uploadImage(coverImageBuffer, coverImageOriginalName);
            coverImageUrls = [coverUpload.url];
        }

        const tags = normalizeTags(parseArrayInput(req.body.tags));

        const book = await Book.create({
            title: title.trim(),
            description: description?.trim() || '',
            price: parsedPrice,
            originalPrice: parseNumber(originalPrice, null),
            stock: parseNumber(stock, -1),
            coverImages: coverImageUrls,
            ebookFile: {
                url: ebookUpload.url,
                publicId: ebookUpload.publicId,
                originalName: ebookFileOriginalName || (isMultiImage ? 'comic-pages.zip' : ''),
                mimeType: req.files?.ebookFile?.[0]?.mimetype || (isMultiImage ? 'application/zip' : ''),
                size: req.files?.ebookFile?.[0]?.size || 0
            },
            pages: comicPages,
            seller: req.user._id,
            status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
            tags
        });

        await upsertTags(tags).catch(() => {});

        res.status(201).json(book);
    } catch (error) {
        next(error);
    }
};

const updateBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book || !book.isActive) {
            res.status(404);
            return next(new Error('Book not found'));
        }

        if (!isAuthorizedToModify(book, req.user)) {
            res.status(403);
            return next(new Error('Not authorized to update this book'));
        }

        const { title, description, price, originalPrice, stock, status } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                res.status(400);
                return next(new Error('Title cannot be empty'));
            }
            if (title.trim().length > 100) {
                res.status(400);
                return next(new Error('Title must be 100 characters or less'));
            }
            book.title = title.trim();
        }
        if (description !== undefined) {
            book.description = description.trim();
        }
        if (price !== undefined) {
            const parsedPrice = parseNumber(price, null);
            if (parsedPrice === null || parsedPrice < 0) {
                res.status(400);
                return next(new Error('Price must be a non-negative number'));
            }
            book.price = parsedPrice;
        }
        if (originalPrice !== undefined) {
            book.originalPrice = parseNumber(originalPrice, null);
        }
        if (stock !== undefined) {
            book.stock = parseNumber(stock, -1);
        }
        if (status !== undefined && ['draft', 'published', 'archived'].includes(status)) {
            book.status = status;
        }

        const tags = normalizeTags(parseArrayInput(req.body.tags));
        if (tags.length > 0 || req.body.tags !== undefined) {
            book.tags = tags;
        }

        const coverImageBuffer = req.files?.coverImage?.[0]?.buffer;
        const coverImageOriginalName = req.files?.coverImage?.[0]?.originalname;
        if (coverImageBuffer) {
            const coverUpload = await uploadImage(coverImageBuffer, coverImageOriginalName);
            book.coverImages = [coverUpload.url];
        }

        const ebookFileBuffer = req.files?.ebookFile?.[0]?.buffer;
        const ebookFileOriginalName = req.files?.ebookFile?.[0]?.originalname;
        const imageBuffers = req.files?.images?.map(f => f.buffer) || [];
        const imageNames = req.files?.images?.map(f => f.originalname) || [];
        const isMultiImage = imageBuffers.length > 0;

        if (ebookFileBuffer || isMultiImage) {
            const isZip = /\.zip$/i.test(ebookFileOriginalName || '') || req.files?.ebookFile?.[0]?.mimetype === 'application/zip';

            let ebookUpload;
            if (isZip) {
                const [rawZipUpload, comicPages] = await Promise.all([
                    uploadEbook(ebookFileBuffer, ebookFileOriginalName),
                    extractComicPages(ebookFileBuffer)
                ]);
                ebookUpload = rawZipUpload;
                book.pages = comicPages;
            } else if (isMultiImage) {
                const pageUploadPromises = imageBuffers.map((buffer, i) => uploadComicPage(buffer, i + 1));
                const zipBuffer = createZipFromImages(imageBuffers, imageNames);

                const [uploadedPages, zipUpload] = await Promise.all([
                    Promise.all(pageUploadPromises),
                    uploadEbook(zipBuffer, 'comic-pages.zip')
                ]);

                book.pages = uploadedPages.map((uploaded, i) => ({
                    url: uploaded.url,
                    publicId: uploaded.publicId,
                    pageNumber: i + 1
                }));
                ebookUpload = zipUpload;
            } else {
                ebookUpload = await uploadEbook(ebookFileBuffer, ebookFileOriginalName);
                // Replacing a comic with a plain ebook: drop stale page URLs.
                book.pages = [];
            }

            book.ebookFile = {
                url: ebookUpload.url,
                publicId: ebookUpload.publicId,
                originalName: ebookFileOriginalName || (isMultiImage ? 'comic-pages.zip' : ''),
                mimeType: req.files?.ebookFile?.[0]?.mimetype || (isMultiImage ? 'application/zip' : ''),
                size: req.files?.ebookFile?.[0]?.size || 0
            };
        }

        await book.save();

        if (req.body.tags !== undefined) {
            await upsertTags(book.tags).catch(() => {});
        }

        res.json(book);
    } catch (error) {
        next(error);
    }
};

const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            res.status(404);
            return next(new Error('Book not found'));
        }

        if (!isAuthorizedToModify(book, req.user)) {
            res.status(403);
            return next(new Error('Not authorized to delete this book'));
        }

        book.isActive = false;
        book.status = 'archived';
        await book.save();

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getMyBooks = async (req, res, next) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePositiveInt(req.query.limit, 12);
        const skip = (page - 1) * limit;

        const query = { seller: req.user._id, isActive: true };
        if (req.query.status && ['draft', 'published', 'archived'].includes(req.query.status)) {
            query.status = req.query.status;
        }

        const [books, total] = await Promise.all([
            Book.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(query)
        ]);

        res.json({
            data: books,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getSellerPublishedBooks = async (req, res, next) => {
    try {
        const page = parsePositiveInt(req.query.page, 1);
        const limit = parsePositiveInt(req.query.limit, 12);
        const skip = (page - 1) * limit;

        const query = { seller: req.params.sellerId, status: 'published', isActive: true };

        const [books, total] = await Promise.all([
            Book.find(query)
                .populate('seller', '_id username displayName avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: books,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getRelatedBooks = async (req, res, next) => {
    try {
        const { bookId, tags, limit } = req.query;

        if (!bookId) {
            return res.status(400).json({ success: false, message: 'bookId query parameter is required' });
        }

        const query = {
            isActive: true,
            status: 'published',
            _id: { $ne: bookId }
        };

        if (tags) {
            const tagArray = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
            if (tagArray.length > 0) {
                query.tags = { $in: tagArray };
            }
        }

        const limitNum = Math.min(Math.max(parsePositiveInt(limit, 8), 1), 20);
        const books = await Book.find(query)
            .populate('seller', '_id username displayName avatar')
            .sort({ soldCount: -1 })
            .limit(limitNum);

        res.json({ success: true, data: books });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getMyBooks,
    getSellerPublishedBooks,
    getRelatedBooks
};
