const { Category, Product } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll('name', 'asc');

  res.status(200).json({
    success: true,
    data: categories,
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name);

  const existing = await Category.findBySlug(slug);
  if (existing) {
    res.status(409);
    throw new Error('Category already exists.');
  }

  const category = await Category.create({ name, slug });

  res.status(201).json({
    success: true,
    data: category,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found.');
  }

  const linkedProducts = await Product.countByCategory(Number(id));
  if (linkedProducts > 0) {
    res.status(400);
    throw new Error('Cannot delete category with linked products.');
  }

  await Category.delete(id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully.',
  });
});

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
