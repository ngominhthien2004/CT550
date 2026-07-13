const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { upload } = require('../config/upload');
const {
    listBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    getMyBooks
} = require('../controllers/book.controller');

const router = express.Router();

const bookUpload = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'ebookFile', maxCount: 1 }
]);

router.get('/', listBooks);
router.get('/my-books', protect, getMyBooks);
router.get('/:id', getBookById);
router.post('/', protect, bookUpload, createBook);
router.put('/:id', protect, bookUpload, updateBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;
