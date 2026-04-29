/**
 * Product Controller
 * Handles product CRUD operations with validation and error handling
 */

const { Product, Category } = require('../models');
const { logger } = require('../config/logger');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const slugify = require('../utils/slugify');

// Simple in-memory cache to reduce database queries
const cache = new Map();

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
  const { category, brand, q, featured, sortBy, page = 1, limit = 20 } = req.query;

  logger.debug('Fetching products', { category, brand, q, featured, page, limit });

  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  // Category filter validation
  if (category) {
    const categoryId = parseInt(category);
    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID',
        statusCode: 400,
      });
    }
  }

  const cacheKey = `products_${category}_${brand}_${q}_${featured}_${sortBy}_${pageNum}_${limitNum}`;
  if (cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (cachedData.expiresAt > Date.now()) {
      return res.status(200).json(cachedData.data);
    }
    cache.delete(cacheKey);
  }

  const { rows, count } = await Product.findAll({
    category,
    brand,
    q,
    featured,
    sortBy,
    page: pageNum,
    limit: limitNum,
  });

  const responseData = {
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(count / limitNum),
    },
  };

  cache.set(cacheKey, { data: responseData, expiresAt: Date.now() + 30000 }); // Cache for 30 seconds

  res.status(200).json(responseData);
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

  const product = await Product.findById(productId);

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

  const product = await Product.findBySlug(slug.toLowerCase());

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
  const { name, categoryId, brand, unit, price, nickname, description, isActive, isFeatured } = req.body;

  // Validate required fields
  if (!name || !categoryId || !price) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, categoryId, price',
      statusCode: 400,
    });
  }

  // Validate category exists
  const category = await Category.findById(parseInt(categoryId));
  if (!category) {
    logger.warn(`Invalid category: ${categoryId}`);
    return res.status(400).json({
      success: false,
      message: 'Category not found',
      statusCode: 400,
    });
  }

  // Generate slug
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;
  while (await Product.findOneBySlug(slug)) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  const image = req.cloudinaryUrl || '';

  cache.clear(); // Clear cache when new product is created

  // Create product
  const product = await Product.create({
    name: name.trim(),
    slug,
    category_id: parseInt(categoryId),
    brand: (brand || '').trim(),
    unit: (unit || 'piece').trim(),
    price: String(price).trim(),
    nickname: (nickname || '').trim(),
    description: (description || '').trim(),
    image,
    is_active: isActive !== 'false',
    is_featured: isFeatured === 'true',
  });

  logger.info(`Product created: ${product.id} - ${product.name}`);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
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
  const { name, categoryId, brand, unit, price, nickname, description, isActive, isFeatured } = req.body;

  const productId = parseInt(id);
  if (isNaN(productId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID',
      statusCode: 400,
    });
  }

  const existingProduct = await Product.findById(productId);
  if (!existingProduct) {
    logger.warn(`Product not found for update: ${productId}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  const updates = {};

  // Update category if provided
  if (categoryId) {
    const category = await Category.findById(parseInt(categoryId));
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found',
        statusCode: 400,
      });
    }
    updates.category_id = parseInt(categoryId);
  }

  // Update slug if name changed
  if (name && name !== existingProduct.name) {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOneBySlug(slug, productId)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    updates.name = name.trim();
    updates.slug = slug;
  }

  // Update other fields
  if (brand !== undefined) updates.brand = (brand || '').trim();
  if (unit !== undefined) updates.unit = (unit || 'piece').trim();
  if (price !== undefined) {
    updates.price = String(price).trim();
  }
  if (nickname !== undefined) updates.nickname = (nickname || '').trim();
  if (description !== undefined) updates.description = (description || '').trim();
  if (isActive !== undefined) updates.is_active = isActive === 'true' || isActive === true;
  if (isFeatured !== undefined) updates.is_featured = isFeatured === 'true' || isFeatured === true;

  // Update image if new one uploaded to Cloudinary
  if (req.cloudinaryUrl) {
    // Delete old image from Cloudinary if it exists
    const oldPublicId = getPublicIdFromUrl(existingProduct.image);
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
        logger.info(`Deleted old Cloudinary image: ${oldPublicId}`);
      } catch (err) {
        logger.warn(`Failed to delete old Cloudinary image: ${err.message}`);
      }
    }
    updates.image = req.cloudinaryUrl;
  }

  cache.clear(); // Clear cache when product is updated

  const updatedProduct = await Product.update(productId, updates);

  logger.info(`Product updated: ${productId}`);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct,
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

  const product = await Product.findById(productId);
  if (!product) {
    logger.warn(`Product not found for deletion: ${productId}`);
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      statusCode: 404,
    });
  }

  // Delete image from Cloudinary
  const publicId = getPublicIdFromUrl(product.image);
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId);
      logger.info(`Deleted Cloudinary image: ${publicId}`);
    } catch (err) {
      logger.warn(`Failed to delete Cloudinary image: ${err.message}`);
    }
  }

  cache.clear(); // Clear cache when product is deleted

  await Product.delete(productId);

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
