/**
 * Database Models - Supabase Query Helpers
 * Provides a clean interface over the Supabase client for all database operations
 */

const bcrypt = require('bcryptjs');
const { supabase, pool } = require('../config/db');

// ============================================================
// Schema Initialization (run once on startup)
// ============================================================
const initSchema = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        brand VARCHAR(100) NOT NULL DEFAULT '',
        unit VARCHAR(20) NOT NULL DEFAULT 'piece',
        price VARCHAR(100) NOT NULL DEFAULT 'Contact for price',
        description TEXT NOT NULL DEFAULT '',
        image VARCHAR(500) NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(50) PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      INSERT INTO analytics (id, value) VALUES ('visits', 0) ON CONFLICT (id) DO NOTHING;
      INSERT INTO analytics (id, value) VALUES ('whatsapp_orders', 0) ON CONFLICT (id) DO NOTHING;
    `);
  } finally {
    client.release();
  }
};

// ============================================================
// Category Model
// ============================================================
const Category = {
  async findAll(orderBy = 'name', orderDir = 'asc') {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order(orderBy, { ascending: orderDir === 'asc' });
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create({ name, slug }) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};

// ============================================================
// Product Model
// ============================================================
const Product = {
  /**
   * Find products with filters, pagination, and category join
   */
  async findAll({ category, brand, q, featured, page = 1, limit = 20, activeOnly = true } = {}) {
    let query = supabase
      .from('products')
      .select('*, categories!category_id(id, name, slug)', { count: 'exact' });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category_id', parseInt(category));
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Reshape the joined data to match the old Sequelize format
    const rows = (data || []).map((row) => Product._reshape(row));

    return { rows, count: count || 0 };
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!category_id(id, name, slug)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? Product._reshape(data) : null;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!category_id(id, name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? Product._reshape(data) : null;
  },

  async findOneBySlug(slug, excludeId = null) {
    let query = supabase
      .from('products')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async create(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select('*, categories!category_id(id, name, slug)')
      .single();
    if (error) throw error;
    return Product._reshape(data);
  },

  async update(id, updates) {
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories!category_id(id, name, slug)')
      .single();
    if (error) throw error;
    return Product._reshape(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async countByCategory(categoryId) {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (error) throw error;
    return count || 0;
  },

  /**
   * Reshape Supabase joined data to match the old Sequelize response format.
   * Converts snake_case to camelCase and moves the nested category.
   */
  _reshape(row) {
    if (!row) return null;

    const category = row.categories || null;
    const reshaped = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      categoryId: row.category_id,
      brand: row.brand,
      unit: row.unit,
      price: row.price,
      stock: row.stock,
      description: row.description,
      image: row.image,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      category: category,
    };

    return reshaped;
  },
};

// ============================================================
// User Model
// ============================================================
const User = {
  async findByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', 'admin')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, created_at, updated_at')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? User._reshape(data) : null;
  },

  async create({ username, password, role = 'admin' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword, role })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async matchPassword(enteredPassword, storedHash) {
    return bcrypt.compare(enteredPassword, storedHash);
  },

  _reshape(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

// ============================================================
// Review Model
// ============================================================
const Review = {
  async findByProductId(productId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(Review._reshape);
  },

  async create({ product_id, author_name, rating, comment }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({ product_id, author_name, rating, comment })
      .select()
      .single();
    if (error) throw error;
    return Review._reshape(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  _reshape(row) {
    if (!row) return null;
    return {
      id: row.id,
      productId: row.product_id,
      authorName: row.author_name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

// ============================================================
// Analytics Model
// ============================================================
const Analytics = {
  async getStats() {
    const { data, error } = await supabase.from('analytics').select('*');
    if (error) throw error;
    const stats = {};
    data.forEach(item => {
      stats[item.id] = item.value;
    });
    return stats;
  },

  async increment(id) {
    // Supabase rpc or raw query is best for atomic increment, but let's use pool for simplicity since we want an atomic update
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE analytics SET value = value + 1, updated_at = NOW() WHERE id = $1 RETURNING value',
        [id]
      );
      return result.rows[0]?.value || 0;
    } finally {
      client.release();
    }
  }
};

module.exports = {
  supabase,
  pool,
  initSchema,
  Category,
  Product,
  User,
  Review,
  Analytics,
};
