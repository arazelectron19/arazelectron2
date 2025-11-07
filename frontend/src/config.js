// STATIC MODE - No remote API, No LocalStorage fallback
export const USE_REMOTE_API = false;

// APP_VERSION - INCREMENT ON EACH DEPLOY for hard cache reset
export const APP_VERSION = "10";

// Base path for GitHub Pages
export const BASE_PATH = "/arazelectron2";

// Static data URLs (SSOT) - Always fetch from here, NEVER LocalStorage
export const STATIC_DATA_SOURCES = {
  categories: `${BASE_PATH}/api/categories.json?v=${APP_VERSION}`,
  products: `${BASE_PATH}/api/products.json?v=${APP_VERSION}`
};
