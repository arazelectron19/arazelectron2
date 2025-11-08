// FULLY STATIC MODE - No Emergent server, GitHub Pages only
export const USE_REMOTE_API = false;

// APP_VERSION - Versioned file names (not query params)
export const APP_VERSION = "14";

// Base path for GitHub Pages
export const BASE_PATH = "/arazelectron2/api";

// Static data URLs - VERSIONED FILE NAMES
export const STATIC_DATA_SOURCES = {
  categories: `${BASE_PATH}/categories.v${APP_VERSION}.json`,
  products: `${BASE_PATH}/products.v${APP_VERSION}.json`
};
