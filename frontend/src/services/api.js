import { auth } from './auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const cache = new Map();

const parseJSON = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const request = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = auth.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await parseJSON(response);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.errors || [];
    throw error;
  }

  return payload;
};

export const api = {
  health: () => request('/health'),

  login: (body) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCategories: async () => {
    if (cache.has('/categories')) return cache.get('/categories');
    const res = await request('/categories');
    cache.set('/categories', res);
    setTimeout(() => cache.delete('/categories'), 60000); // 1 minute cache
    return res;
  },
  createCategory: (body) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),

  getProducts: async (query = '') => {
    const cacheKey = `/products${query}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const res = await request(cacheKey);
    cache.set(cacheKey, res);
    setTimeout(() => cache.delete(cacheKey), 60000); // 1 minute cache
    return res;
  },
  getBrands: async () => {
    if (cache.has('/products/brands')) return cache.get('/products/brands');
    const res = await request('/products/brands');
    cache.set('/products/brands', res);
    setTimeout(() => cache.delete('/products/brands'), 60000); // 1 minute cache
    return res;
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (formData) =>
    request('/products', {
      method: 'POST',
      body: formData,
    }),
  updateProduct: (id, formData) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, {
      method: 'DELETE',
    }),

  getReviews: (productId) => request(`/reviews/${productId}`),
  createReview: (productId, body) =>
    request(`/reviews/${productId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteReview: (id) =>
    request(`/reviews/${id}`, {
      method: 'DELETE',
    }),

  getAnalytics: () => request('/analytics'),
  incrementVisit: () => request('/analytics/visit', { method: 'POST' }),
  incrementOrder: () => request('/analytics/order', { method: 'POST' }),
};
