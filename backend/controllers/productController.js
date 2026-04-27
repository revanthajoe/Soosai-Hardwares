const { Op, fn, col, where } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

const getProducts = asyncHandler(async (req, res) => {
  const { category, brand, q, featured } = req.query;
  const filter = { isActive: true };
  const andFilters = [];

  if (category) {
    filter.categoryId = Number(category);
  }

  if (brand) {
    andFilters.push(where(fn('LOWER', col('Product.brand')), brand.toLowerCase()));
  }

  if (featured === 'true') {
    filter.isFeatured = true;
  }

  if (q) {
    andFilters.push({ name: { [Op.iLike]: `%${q}%` } });
  }

  if (andFilters.length) {
    filter[Op.and] = andFilters;
  }

  const products = await Product.findAll({
    where: filter,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });
  if (!product || !product.isActive) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({
    where: { slug, isActive: true },
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    brand,
    unit,
    price,
    stock,
    description,
    isActive,
    isFeatured,
  } = req.body;

  const categoryId = Number(category);
  const categoryExists = await Category.findByPk(categoryId);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Invalid category selected.');
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;

  while (await Product.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const product = await Product.create({
    name,
    slug,
    categoryId,
    brand,
    unit,
    price: Number(price),
    stock: Number(stock),
    description,
    image,
    isActive: isActive !== 'false',
    isFeatured: isFeatured === 'true',
  });

  const populatedProduct = await Product.findByPk(product.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  res.status(201).json({
    success: true,
    data: populatedProduct,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    brand,
    unit,
    price,
    stock,
    description,
    isActive,
    isFeatured,
  } = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  if (category) {
    const categoryId = Number(category);
    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      res.status(400);
      throw new Error('Invalid category selected.');
    }
    product.categoryId = categoryId;
  }

  if (name && name !== product.name) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (
      await Product.findOne({
        where: {
          slug,
          id: { [Op.ne]: product.id },
        },
      })
    ) {
      slug = `${baseSlug}-${count}`;
      count += 1;
    }

    product.name = name;
    product.slug = slug;
  }

  if (typeof brand !== 'undefined') product.brand = brand;
  if (typeof unit !== 'undefined') product.unit = unit;
  if (typeof price !== 'undefined') product.price = Number(price);
  if (typeof stock !== 'undefined') product.stock = Number(stock);
  if (typeof description !== 'undefined') product.description = description;
  if (typeof isActive !== 'undefined') product.isActive = isActive === 'true' || isActive === true;
  if (typeof isFeatured !== 'undefined') {
    product.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  if (req.file) {
    product.image = `/uploads/${req.file.filename}`;
  }

  const updated = await product.save();
  const populatedProduct = await Product.findByPk(updated.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  res.status(200).json({
    success: true,
    data: populatedProduct,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found.');
  }

  await product.destroy();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully.',
  });
});

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
