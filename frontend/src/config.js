// STATIC MODE - Hard anti-cache rollout
export const USE_REMOTE_API = false;

// APP_VERSION - Force all devices to hard reset
export const APP_VERSION = "12";

// Base path for GitHub Pages
export const BASE_PATH = "/arazelectron2/api";

// Static data URLs (SSOT) - versioned fetch
export const STATIC_DATA_SOURCES = {
  categories: `${BASE_PATH}/categories.json?v=${APP_VERSION}`,
  products: `${BASE_PATH}/products.json?v=${APP_VERSION}`
};
