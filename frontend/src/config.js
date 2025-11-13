// REMOTE API MODE - Cloudflare Pages Functions
export const USE_REMOTE_API = true;

// APP_VERSION
export const APP_VERSION = "14";

// Base path for API (Cloudflare Functions)
export const API_BASE = "/api";

// Static data fallback
export const STATIC_DATA_SOURCES = {
  categories: `/api/categories.v${APP_VERSION}.json`,
  products: `/api/products.v${APP_VERSION}.json`
};
