/**
 * Database Models - Supabase Query Helpers
 * Provides a clean interface over the Supabase client for all database operations
 */

const bcrypt = require('bcryptjs');
const { supabase } = require('../config/db');

// ============================================================
// Schema Initialization (run once on startup)
// ============================================================
/**
 * Verify that expected tables exist via the Supabase REST API.
 * Tables must be created via the Supabase SQL Editor / Dashboard since
 * direct PostgreSQL TCP connections are not available on the free tier.
 */
const initSchema = async () => {
  // Verify key tables are accessible
  const tables = ['users', 'categories', 'products', 'reviews', 'analytics', 'advertisements'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.warn(`Table '${table}' check failed: ${error.message}`);
      console.warn(`Please create tables via the Supabase SQL Editor.`);
    }
  }

  // Ensure default analytics rows exist
  const { data: existing } = await supabase.from('analytics').select('id');
  const existingIds = (existing || []).map(r => r.id);
  const defaults = ['visits', 'whatsapp_orders'];
  for (const id of defaults) {
    if (!existingIds.includes(id)) {
      await supabase.from('analytics').upsert({ id, value: 0 }, { onConflict: 'id' });
    }
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
  async findAll({ category, brand, q, featured, sortBy, page = 1, limit = 20, activeOnly = true } = {}) {
    let query = supabase
      .from('products')
      .select('*, categories!category_id(id, name, slug), reviews(rating)', { count: 'exact' });

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
      query = query.or(`name.ilike.%${q}%,nickname.ilike.%${q}%`);
    }

    const offset = (page - 1) * limit;
    
    // Default sorting
    if (sortBy === 'name-asc') {
      query = query.order('name', { ascending: true });
    } else if (sortBy === 'name-desc') {
      query = query.order('name', { ascending: false });
    } else if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'featured') {
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
    } else if (sortBy === 'price-asc') {
      // Crude sort for VARCHAR price column
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data || []).map(row => {
      const ratings = row.reviews || [];
      const reviewCount = ratings.length;
      const avgRating = reviewCount > 0 
        ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;
      
      const product = Product._reshape(row);
      return {
        ...product,
        reviewCount,
        avgRating,
      };
    });

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

  async getBrands() {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .neq('brand', '');
    if (error) throw error;
    
    // Get unique brands
    const brands = [...new Set(data.map(item => item.brand))];
    return brands.sort();
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

  async findShopReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .is('product_id', null)
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
    // Fetch current value, increment, and update via Supabase client
    const { data: current, error: fetchErr } = await supabase
      .from('analytics')
      .select('value')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const newValue = (current?.value || 0) + 1;
    const { data, error } = await supabase
      .from('analytics')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('value')
      .single();
    if (error) throw error;
    return data?.value || newValue;
  }
};

// ============================================================
// Advertisement Model
// ============================================================
const Advertisement = {
  async findAll({ activeOnly = false } = {}) {
    let query = supabase
      .from('advertisements')
      .select('*')
      .order('display_order', { ascending: true });
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(Advertisement._reshape);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? Advertisement._reshape(data) : null;
  },

  async create(row) {
    const { data, error } = await supabase
      .from('advertisements')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return Advertisement._reshape(data);
  },

  async update(id, updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('advertisements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return Advertisement._reshape(data);
  },

  async delete(id) {
    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabase
      .from('advertisements')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0].display_order : -1;
  },

  _reshape(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      linkUrl: row.link_url,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

module.exports = {
  supabase,
  initSchema,
  Category,
  Product,
  User,
  Review,
  Analytics,
  Advertisement,
};
