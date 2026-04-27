import { auth } from './auth';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

  getCategories: () => request('/categories'),
  createCategory: (body) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),

  getProducts: (query = '') => request(`/products${query}`),
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
};
