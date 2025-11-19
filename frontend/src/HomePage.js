import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hardRefreshIfNeeded } from "./version";
import { firestoreService } from "./firestoreService";
import { mockAPI } from "./mockAPI";
import logo from "./assets/logo.png";
import { useCart } from "./contexts/CartContext";
import CartIcon from "./components/CartIcon";
import CartDrawer from "./components/CartDrawer";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
    
    // Listen for product updates from AdminPanel
    const handleProductsUpdate = () => {
      console.log('Products updated, reloading...');
      loadData();
    };
    
    window.addEventListener('products-updated', handleProductsUpdate);
    
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check version and hard reload if needed
      const reloading = await hardRefreshIfNeeded();
      if (reloading) {
        return;
      }
      
      // Load directly from Firestore
      const [productsData, categoriesData, contactsData] = await Promise.all([
        firestoreService.getProducts(),
        firestoreService.getCategories(),
        firestoreService.getContacts()
      ]);
      
      console.log('✅ Loaded from Firestore:', {
        products: productsData.length,
        categories: categoriesData.length,
        contacts: contactsData.length
      });
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setContacts(contactsData || []);
      
    } catch (error) {
      console.error('❌ Firestore load error:', error);
      alert('⚠️ Firestore bağlantı xətası! Firebase console-da security rules yoxlayın.');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    // Kateqoriya filteri
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Axtarış filteri (ad və kateqoriyaya görə)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      );
    }
    
    // Kateqoriya order-ə görə sort et
    // Kateqoriya order xəritəsi yarat
    const categoryOrderMap = {};
    categories.forEach(cat => {
      categoryOrderMap[cat.name] = cat.order || 999;
    });
    
    // Məhsulları sort et: əvvəl kateqoriya order-ə görə, sonra ad-a görə
    const sorted = filtered.sort((a, b) => {
      const orderA = categoryOrderMap[a.category] ?? 999;
      const orderB = categoryOrderMap[b.category] ?? 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Eyni kateqoriyada ada görə sort
      return a.name.localeCompare(b.name, 'az');
    });
    
    return sorted;
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload();
              }}
            >
              <img 
                src={logo} 
                alt="Araz Elektron Logo"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Araz Elektron</h1>
                <p className="text-sm text-orange-100">Keyfiyyətli elektron avadanlıqlar</p>
              </div>
            </Link>
            
            {/* Cart Icon */}
            <CartIcon onClick={() => setIsCartOpen(true)} />
          </div>
        </div>
      </header>

      {/* Axtarış Paneli */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl" style={{ width: '60%' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Məhsul axtar..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  data-testid="search-input"
                />
                <button
                  onClick={() => {}}
                  className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  data-testid="search-button"
                >
                  🔍 Axtar
                </button>
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-600">
                  {getFilteredProducts().length} nəticə tapıldı
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sol tərəf - Kataloq */}
          <aside className="lg:w-48 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
              {/* Mobile: clickable başlıq, Desktop: sadə başlıq */}
              <button
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                className="w-full flex items-center justify-between text-lg font-bold text-gray-900 mb-3 lg:cursor-default lg:pointer-events-none hover:text-orange-600 lg:hover:text-gray-900 transition-colors"
              >
                <span>📦 Kataloq</span>
                {/* Ox yalnız mobile-da görünür */}
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 lg:hidden ${isCatalogOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Mobile: conditional, Desktop: həmişə göstər */}
              <div className={`space-y-1 ${isCatalogOpen ? 'block' : 'hidden'} lg:block`}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Hamısı ({products.length})
                </button>
                
                {categories
                  .sort((a, b) => {
                    // Sort categories by order field
                    const orderA = a.order ?? 999;
                    const orderB = b.order ?? 999;
                    return orderA - orderB;
                  })
                  .map(category => {
                    // Handle both string and object {id, name} formats
                    const categoryName = typeof category === 'string' ? category : (category?.name || '');
                    const categoryId = typeof category === 'object' && category?.id ? String(category.id) : null;
                    
                    // Count products by both name and ID (normalized)
                    const count = products.filter(p => {
                      const productCategory = p.category || '';
                      const productCategoryId = p.categoryId ? String(p.categoryId) : null;
                      
                      // Match by name OR by ID
                      return productCategory === categoryName || 
                             (categoryId && productCategoryId && productCategoryId === categoryId);
                    }).length;
                    
                    return { name: categoryName, id: categoryId, count, order: category.order };
                  })
                  .filter(item => item.count > 0) // Only show categories with products
                  .map(item => (
                    <button
                      key={item.id || item.name}
                      onClick={() => setSelectedCategory(item.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === item.name
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item.name} ({item.count})
                    </button>
                  ))}
              </div>
            </div>
          </aside>

          {/* Sağ tərəf - Məhsullar */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'all' ? 'Bütün Məhsullar' : selectedCategory}
              </h2>
              <p className="text-gray-600">{getFilteredProducts().length} məhsul tapıldı</p>
            </div>

            {/* Məhsul Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {getFilteredProducts().map(product => (
                <div 
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Şəkil */}
                  <div 
                    onClick={() => openProductModal(product)}
                    className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="text-gray-400 text-center p-4">Şəkil Yoxdur</div>';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4">Şəkil Yoxdur</div>
                    )}
                  </div>

                  {/* Məzmun */}
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="inline-block bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-medium">
                        {product.category}
                      </span>
                    </div>
                    <h3 
                      onClick={() => openProductModal(product)}
                      className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-orange-600"
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-orange-600">{product.price.toFixed(2)} ₼</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                    >
                      🛒 Səbətə at
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredProducts().length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg">Bu kateqoriyada məhsul tapılmadı</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Əlaqə Hissəsi - Aşağıda */}
      <section id="contact" className="bg-gray-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">📞 Bizimlə Əlaqə</h2>
            <p className="text-gray-400">Suallarınız üçün bizimlə əlaqə saxlayın</p>
          </div>
          
          {contacts.length > 0 && (
            <div className="max-w-6xl mx-auto">
              {/* Desktop: 3 sütunlu grid, Mobile: alt-alta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* WhatsApp */}
                {contacts.filter(c => c.category === 'whatsapp').length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-green-400 font-bold text-lg mb-4 flex items-center gap-2">
                      📱 WhatsApp
                    </h3>
                    <div className="space-y-3">
                      {contacts
                        .filter(c => c.category === 'whatsapp')
                        .map(contact => (
                          <div key={contact.id} className="text-gray-300">
                            <span className="font-semibold">{contact.name}</span>
                            <span className="mx-2 text-gray-500">—</span>
                            <a 
                              href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-green-400 transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Ustalar */}
                {contacts.filter(c => c.category === 'masters').length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                      🔧 Ustalar
                    </h3>
                    <div className="space-y-3">
                      {contacts
                        .filter(c => c.category === 'masters')
                        .map(contact => (
                          <div key={contact.id} className="text-gray-300">
                            <span className="font-semibold">{contact.name}</span>
                            <span className="mx-2 text-gray-500">—</span>
                            <a 
                              href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                              className="hover:text-blue-400 transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Satış */}
                {contacts.filter(c => c.category === 'sales').length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-orange-400 font-bold text-lg mb-4 flex items-center gap-2">
                      💼 Satış
                    </h3>
                    <div className="space-y-3">
                      {contacts
                        .filter(c => c.category === 'sales')
                        .map(contact => (
                          <div key={contact.id} className="text-gray-300">
                            <span className="font-semibold">{contact.name}</span>
                            <span className="mx-2 text-gray-500">—</span>
                            <a 
                              href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                              className="hover:text-orange-400 transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <img 
              src={logo} 
              alt="Araz Elektron Logo"
              className="h-10 w-10 object-contain"
            />
            <h3 className="text-xl font-bold text-orange-500">Araz Elektron</h3>
          </div>
          <p className="text-gray-400 mb-2">Keyfiyyətli elektron avadanlıqlar və peşəkar xidmət</p>
          <p className="text-gray-500 text-sm">© 2024 Araz Elektron. Bütün hüquqlar qorunur.</p>
        </div>
      </footer>

      {/* Məhsul Detailləri Modal */}
      {showModal && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Məhsul Detailləri</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sol tərəf - Şəkillər */}
                <div>
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {selectedProduct.image_urls && selectedProduct.image_urls.length > 0 ? (
                      <img
                        src={selectedProduct.image_urls[0]}
                        alt={selectedProduct.name}
                        className="w-full h-96 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x400?text=Şəkil+Yoxdur';
                        }}
                      />
                    ) : (
                      <div className="w-full h-96 flex items-center justify-center text-gray-400">
                        Şəkil Yoxdur
                      </div>
                    )}
                  </div>
                  
                  {/* Əlavə şəkillər */}
                  {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedProduct.image_urls.slice(1, 4).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${selectedProduct.name} ${index + 2}`}
                          className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x150?text=?';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sağ tərəf - Məlumatlar */}
                <div>
                  <div className="mb-4">
                    <span className="inline-block bg-orange-100 text-orange-600 text-sm px-4 py-1 rounded-full font-medium">
                      {selectedProduct.category}
                    </span>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h1>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-orange-600">{selectedProduct.price.toFixed(2)} ₼</span>
                  </div>

                  {selectedProduct.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Təsvir</h3>
                      <p className="text-gray-700">{selectedProduct.description}</p>
                    </div>
                  )}

                  {selectedProduct.specifications && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Texniki Xüsusiyyətlər</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                          {selectedProduct.specifications}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Features/Specifications - without stock */}
                  {/* Səbətə at və Bağla düyməsi */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        addToCart(selectedProduct);
                        // Toast notification
                        const toast = document.createElement('div');
                        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fade-in';
                        toast.textContent = '✅ Məhsul səbətə əlavə olundu';
                        document.body.appendChild(toast);
                        setTimeout(() => {
                          toast.style.opacity = '0';
                          toast.style.transition = 'opacity 0.3s';
                          setTimeout(() => document.body.removeChild(toast), 300);
                        }, 2000);
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Səbətə at
                    </button>
                    
                    <button 
                      onClick={closeModal}
                      className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-lg"
                    >
                      Bağla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default HomePage;