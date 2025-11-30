// Mock API - LocalStorage-based data management for GitHub Pages
// This replaces the backend API with client-side storage

const STORAGE_KEYS = {
  PRODUCTS: 'araz_elektron_products',
  CATEGORIES: 'araz_elektron_categories',
  ORDERS: 'araz_elektron_orders',
  CONTACT: 'araz_elektron_contact',
};

// Initial mock data
const INITIAL_DATA = {
  products: [
    {
      id: '1',
      name: 'Samsung Galaxy A54 5G',
      price: 899.99,
      category: 'Telefon',
      description: 'Güclü 5G smartfon, 128GB yaddaş',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
      stock: 15,
      is_featured: true,
      specifications: 'Display: 6.4", RAM: 8GB, Camera: 50MP'
    },
    {
      id: '2',
      name: 'Sony WH-1000XM5',
      price: 599.99,
      category: 'Səs Sistemləri',
      description: 'Premium noise-cancelling qulaqlıqlar',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      stock: 8,
      is_featured: true,
      specifications: 'Bluetooth 5.2, 30h battery, ANC'
    },
    {
      id: '3',
      name: 'Dell XPS 13',
      price: 1499.99,
      category: 'Noutbuklar',
      description: 'Ultra-portativ noutbuk iş üçün',
      images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500'],
      stock: 5,
      is_featured: false,
      specifications: 'Intel i7, 16GB RAM, 512GB SSD'
    },
    {
      id: '4',
      name: 'LG 27" 4K Monitor',
      price: 449.99,
      category: 'Monitorlar',
      description: '4K UHD professional monitor',
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'],
      stock: 12,
      is_featured: false,
      specifications: '27", 4K UHD, IPS, HDR10'
    },
    {
      id: '5',
      name: 'Canon EOS R6',
      price: 2499.99,
      category: 'Kamera',
      description: 'Professional mirrorless camera',
      images: ['https://images.unsplash.com/photo-1606103836293-0a063f3b2f47?w=500'],
      stock: 3,
      is_featured: true,
      specifications: '20MP, 4K 60fps, IBIS'
    },
    {
      id: '6',
      name: 'Logitech MX Master 3',
      price: 99.99,
      category: 'Aksesuarlar',
      description: 'Ergonomik simsiz mouse',
      images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
      stock: 25,
      is_featured: false,
      specifications: 'Wireless, USB-C charging, Multi-device'
    }
  ],
  categories: ['Telefon', 'Səs Sistemləri', 'Kompüterlər', 'Kamera', 'Kondisionerlər', 'Noutbuklar', 'Monitorlar', 'Aksesuarlar'],
  contact: {
    phone: '+994 12 345 67 89',
    email: 'info@arazelectron.az',
    address: 'Bakı, Azərbaycan',
    hours: 'Bazar ertəsi - Cümə: 09:00 - 18:00'
  },
  orders: []
};

// Initialize storage if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_DATA.products));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_DATA.categories));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACT)) {
    localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(INITIAL_DATA.contact));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DATA.orders));
  }
};

// Mock API functions
export const mockAPI = {
  // Products
  getProducts: () => {
    return Promise.resolve(JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]'));
  },
  
  getProduct: (id) => {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    return Promise.resolve(products.find(p => p.id === id));
  },
  
  createProduct: (product) => {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const newProduct = {
      ...product,
      id: Date.now().toString(),
    };
    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return Promise.resolve(newProduct);
  },
  
  updateProduct: (id, updates) => {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return Promise.resolve(products[index]);
    }
    return Promise.reject(new Error('Product not found'));
  },
  
  deleteProduct: (id) => {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return Promise.resolve({ message: 'Məhsul silindi' });
  },
  
  // Categories
  getCategories: () => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    return Promise.resolve({ categories });
  },
  
  createCategory: (name) => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    if (!categories.includes(name)) {
      categories.push(name);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
    return Promise.resolve({ message: 'Kateqoriya əlavə edildi' });
  },
  
  deleteCategory: (name) => {
    const categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
    const filtered = categories.filter(c => c !== name);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    return Promise.resolve({ message: 'Kateqoriya silindi' });
  },
  
  // Orders
  getOrders: () => {
    return Promise.resolve(JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]'));
  },
  
  createOrder: (order) => {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return Promise.resolve(newOrder);
  },
  
  updateOrderStatus: (id, status) => {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      return Promise.resolve(orders[index]);
    }
    return Promise.reject(new Error('Order not found'));
  },
  
  // Contact
  getContactInfo: () => {
    return Promise.resolve(JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACT) || '{}'));
  },
  
  updateContactInfo: (info) => {
    localStorage.setItem(STORAGE_KEYS.CONTACT, JSON.stringify(info));
    return Promise.resolve(info);
  },
  
  // Image upload (mock - returns data URL)
  uploadImage: (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result });
      };
      reader.readAsDataURL(file);
    });
  },
  
  // Initialize data
  initializeData: () => {
    initializeStorage();
    return Promise.resolve({ message: 'İlkin məlumatlar yükləndi' });
  }
};
