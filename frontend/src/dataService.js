// Single Source of Truth - Static JSON files
const STATIC_DATA_SOURCES = {
  categories: '/api/categories.json',
  products: '/api/products.json'
};

// In-memory store for admin edits (before export)
let inMemoryStore = {
  categories: null,
  products: null,
  isDirty: false
};

export const dataService = {
  // Load from static JSON files (SSOT)
  async loadCategories() {
    if (inMemoryStore.categories && inMemoryStore.isDirty) {
      return inMemoryStore.categories;
    }
    
    try {
      const response = await fetch(STATIC_DATA_SOURCES.categories);
      if (!response.ok) throw new Error('Categories fetch failed');
      const data = await response.json();
      inMemoryStore.categories = data;
      return data;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  },

  async loadProducts() {
    if (inMemoryStore.products && inMemoryStore.isDirty) {
      return inMemoryStore.products;
    }
    
    try {
      const response = await fetch(STATIC_DATA_SOURCES.products);
      if (!response.ok) throw new Error('Products fetch failed');
      const data = await response.json();
      inMemoryStore.products = data;
      return data;
    } catch (error) {
      console.error('Failed to load products:', error);
      return [];
    }
  },

  // In-memory CRUD (no backend)
  createProduct(product) {
    if (!inMemoryStore.products) inMemoryStore.products = [];
    const newProduct = {
      ...product,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };
    inMemoryStore.products.push(newProduct);
    inMemoryStore.isDirty = true;
    return newProduct;
  },

  updateProduct(id, updates) {
    if (!inMemoryStore.products) return false;
    const index = inMemoryStore.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    inMemoryStore.products[index] = { ...inMemoryStore.products[index], ...updates };
    inMemoryStore.isDirty = true;
    return true;
  },

  deleteProduct(id) {
    if (!inMemoryStore.products) return false;
    const index = inMemoryStore.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    inMemoryStore.products.splice(index, 1);
    inMemoryStore.isDirty = true;
    return true;
  },

  createCategory(category) {
    if (!inMemoryStore.categories) inMemoryStore.categories = [];
    const newCategory = {
      ...category,
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };
    inMemoryStore.categories.push(newCategory);
    inMemoryStore.isDirty = true;
    return newCategory;
  },

  deleteCategory(id) {
    if (!inMemoryStore.categories) return false;
    const index = inMemoryStore.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    inMemoryStore.categories.splice(index, 1);
    inMemoryStore.isDirty = true;
    return true;
  },

  // Export data for download
  getExportData() {
    return {
      categories: inMemoryStore.categories || [],
      products: inMemoryStore.products || [],
      isDirty: inMemoryStore.isDirty
    };
  },

  // Import data
  importData(categories, products) {
    inMemoryStore.categories = categories;
    inMemoryStore.products = products;
    inMemoryStore.isDirty = true;
  },

  // Check if there are unsaved changes
  hasUnsavedChanges() {
    return inMemoryStore.isDirty;
  },

  // Reset dirty flag after export
  markAsSaved() {
    inMemoryStore.isDirty = false;
  }
};
