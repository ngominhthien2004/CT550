const express = require('express');
const { protect, admin } = require('../middlewares/auth.middleware');
const {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');

const router = express.Router();

router.get('/', listCategories);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
