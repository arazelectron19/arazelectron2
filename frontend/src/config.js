// STATIC MODE - No server, No LocalStorage seed
export const USE_REMOTE_API = false;

// APP_VERSION - Force cache reset on all devices
export const APP_VERSION = "11";

// Base path for GitHub Pages
export const BASE_PATH = "/arazelectron2/api";

// Static data URLs (SSOT) - ALWAYS fetch from here
export const STATIC_DATA_SOURCES = {
  categories: `${BASE_PATH}/categories.json?v=${APP_VERSION}`,
  products: `${BASE_PATH}/products.json?v=${APP_VERSION}`
};
