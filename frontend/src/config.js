// STATIC MODE - No remote API
export const USE_REMOTE_API = false;

// APP_VERSION for cache busting - INCREMENT ON EACH DEPLOY
export const APP_VERSION = "9";

// Static data URLs (SSOT) - with cache busting
export const STATIC_DATA_SOURCES = {
  categories: `/api/categories.json?v=${APP_VERSION}`,
  products: `/api/products.json?v=${APP_VERSION}`
};
