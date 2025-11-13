// BACKEND MODE - All devices see same data
export const USE_REMOTE_API = true;

// APP_VERSION - Clear localStorage on version change
export const APP_VERSION = "16";

// API endpoints (relative URLs)
export const API_ENDPOINTS = {
  categories: '/api/categories',
  products: '/api/products',
  categoriesAll: '/api/categories/all',
  orders: '/api/orders'
};

// Backend URL from environment or relative
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
