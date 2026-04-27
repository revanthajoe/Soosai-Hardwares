/**
 * Product Controller
 * Handles product CRUD operations with validation and error handling
 */

const { Op, fn, col, where } = require('sequelize');
const { Product, Category } = require('../models');
const { logger } = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 20)
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (searches in name)
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured products
 *     responses:
 *       200:
 *         description: Products list
 *       500:
 *         description: Server error
 */
const getProducts = asyncHandler(async (req, res) => {
  const { category, brand, q, featured, page = 1, limit = 20 } = req.query;

  logger.debug('Fetching products', { category, brand, q, featured, page, limit });

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  const filter = { isActive: true };
  const andFilters = [];

  // Category filter
  if (category) {
    const categoryId = parseInt(category);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
        statusCode: 400,
      });
    }
    filter.categoryId = categoryId;
  }

  // Brand filter
  if (brand && typeof brand === 'string') {
    andFilters.push(where(fn('LOWER', col('Product.brand')), Op.like, `%${brand.toLowerCase()}%`));
  }

  // Featured filter
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  // Search query
  if (q && typeof q === 'string') {
    andFilters.push(where(fn('LOWER', col('Product.name')), Op.like, `%${q.toLowerCase()}%`));
  }

  if (andFilters.length > 0) {
    filter[Op.and] = andFilters;
  }

  const { count, rows } = await Product.findAndCountAll({
    where: filter,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    order: [['createdAt', 'DESC']],
    offset: (pageNum - 1) * limitNum,
    limit: limitNum,
  });

  res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(count / limitNum),
    },
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const productId = parseInt(id);
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
      statusCode: 400,
    });
  }

  const product = await Product.findByPk(productId, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  if (!product || !product.isActive) {
    logger.warn(`Product not found: ${productId}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Invalid slug',
      statusCode: 400,
    });
  }

  const product = await Product.findOne({
    where: { slug: slug.toLowerCase(), isActive: true },
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  if (!product) {
    logger.warn(`Product slug not found: ${slug}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - categoryId
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               brand:
 *                 type: string
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, categoryId, brand, unit, price, stock, description, isActive, isFeatured } = req.body;

  // Validate required fields
  if (!name || !categoryId || !price || stock === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, categoryId, price, stock',
      statusCode: 400,
    });
  }

  // Validate category exists
  const category = await Category.findByPk(parseInt(categoryId));
  if (!category) {
    logger.warn(`Invalid category: ${categoryId}`);
    return res.status(400).json({
      success: false,
      message: 'Category not found',
      statusCode: 400,
    });
  }

  // Validate numeric fields
  const numPrice = parseFloat(price);
  const numStock = parseInt(stock);
  if (isNaN(numPrice) || numPrice < 0 || isNaN(numStock) || numStock < 0) {
    return res.status(400).json({
      success: false,
      message: 'Price and stock must be valid positive numbers',
      statusCode: 400,
    });
  }

  // Generate slug
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;
  while (await Product.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  // Handle file upload
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  // Create product
  const product = await Product.create({
    name: name.trim(),
    slug,
    categoryId: parseInt(categoryId),
    brand: (brand || '').trim(),
    unit: (unit || 'piece').trim(),
    price: numPrice,
    stock: numStock,
    description: (description || '').trim(),
    image,
    isActive: isActive !== 'false',
    isFeatured: isFeatured === 'true',
  });

  // Fetch populated product
  const populatedProduct = await Product.findByPk(product.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  logger.info(`Product created: ${product.id} - ${product.name}`);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: populatedProduct,
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               brand:
 *                 type: string
 *               unit:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, categoryId, brand, unit, price, stock, description, isActive, isFeatured } = req.body;

  const productId = parseInt(id);
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
      statusCode: 400,
    });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    logger.warn(`Product not found for update: ${productId}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  // Update category if provided
  if (categoryId) {
    const category = await Category.findByPk(parseInt(categoryId));
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found',
        statusCode: 400,
      });
    }
    product.categoryId = parseInt(categoryId);
  }

  // Update slug if name changed
  if (name && name !== product.name) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (
      await Product.findOne({
        where: { slug, id: { [Op.ne]: productId } },
      })
    ) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    product.name = name.trim();
    product.slug = slug;
  }

  // Update other fields
  if (brand !== undefined) product.brand = (brand || '').trim();
  if (unit !== undefined) product.unit = (unit || 'piece').trim();
  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number',
        statusCode: 400,
      });
    }
    product.price = numPrice;
  }
  if (stock !== undefined) {
    const numStock = parseInt(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a valid positive number',
        statusCode: 400,
      });
    }
    product.stock = numStock;
  }
  if (description !== undefined) product.description = (description || '').trim();
  if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;

  // Update image if uploaded
  if (req.file) {
    product.image = `/uploads/${req.file.filename}`;
  }

  await product.save();

  // Fetch populated product
  const populatedProduct = await Product.findByPk(productId, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
  });

  logger.info(`Product updated: ${productId}`);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: populatedProduct,
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const productId = parseInt(id);
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
      statusCode: 400,
    });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    logger.warn(`Product not found for deletion: ${productId}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  await product.destroy();

  logger.info(`Product deleted: ${productId}`);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: { id: productId },
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
