const Category = require('../models/Category');

const listCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 }).lean();
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { name, description, icon } = req.body;

        if (!name || !name.trim()) {
            res.status(400);
            return next(new Error('Category name is required'));
        }

        const category = await Category.create({
            name: name.trim(),
            description: description?.trim() || '',
            icon: icon?.trim() || ''
        });

        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            res.status(404);
            return next(new Error('Category not found'));
        }

        const { name, description, icon, slug } = req.body;

        if (name !== undefined) {
            category.name = name.trim();
        }
        if (description !== undefined) {
            category.description = description.trim();
        }
        if (icon !== undefined) {
            category.icon = icon.trim();
        }
        if (slug !== undefined) {
            category.slug = slug.toLowerCase().trim();
        }

        await category.save();
        res.json(category);
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            res.status(404);
            return next(new Error('Category not found'));
        }

        await category.deleteOne();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
