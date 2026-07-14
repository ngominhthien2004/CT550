const Book = require('../models/Book');
const { uploadImage, uploadEbook } = require('../config/upload');

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

const createBook = async (req, res, next) => {
    try {
        const { title, description, price, originalPrice, stock, status } = req.body;

        if (!title || !title.trim()) {
            res.status(400);
            return next(new Error('Title is required'));
        }

        const parsedPrice = parseNumber(price, null);
        if (parsedPrice === null || parsedPrice < 0) {
            res.status(400);
            return next(new Error('Price is required and must be a non-negative number'));
        }

        const ebookFileBuffer = req.files?.ebookFile?.[0]?.buffer;
        const ebookFileOriginalName = req.files?.ebookFile?.[0]?.originalname;

        if (!ebookFileBuffer) {
            res.status(400);
            return next(new Error('Ebook file is required'));
        }

        const ebookUpload = await uploadEbook(ebookFileBuffer, ebookFileOriginalName);

        let coverImageUrls = [];
        const coverImageBuffer = req.files?.coverImage?.[0]?.buffer;
        const coverImageOriginalName = req.files?.coverImage?.[0]?.originalname;

        if (coverImageBuffer) {
            const coverUpload = await uploadImage(coverImageBuffer, coverImageOriginalName);
            coverImageUrls = [coverUpload.url];
        }

        const tags = parseArrayInput(req.body.tags);

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
                originalName: ebookFileOriginalName || '',
                mimeType: req.files.ebookFile[0].mimetype || '',
                size: req.files.ebookFile[0].size || 0
            },
            seller: req.user._id,
            status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
            tags
        });

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

        const tags = parseArrayInput(req.body.tags);
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
        if (ebookFileBuffer) {
            const ebookUpload = await uploadEbook(ebookFileBuffer, ebookFileOriginalName);
            book.ebookFile = {
                url: ebookUpload.url,
                publicId: ebookUpload.publicId,
                originalName: ebookFileOriginalName || '',
                mimeType: req.files.ebookFile[0].mimetype || '',
                size: req.files.ebookFile[0].size || 0
            };
        }

        await book.save();
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

        const query = { seller: req.user._id };
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

module.exports = {
    listBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getMyBooks
};
