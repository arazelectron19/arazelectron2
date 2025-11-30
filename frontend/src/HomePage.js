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
  const [generalInfo, setGeneralInfo] = useState({
    address: 'Bakı şəhəri, 28 May küç.',
    addressLink: '',
    workingHours: '09:00 – 20:00',
    email: 'info@arazelectron.az'
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  // Scroll behavior for mobile - hide header on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeaderVisibility = () => {
      const header = document.getElementById('main-header');
      const searchPanel = document.getElementById('search-panel');
      if (!header) return;
      
      const currentScrollY = window.scrollY;
      
      // Only apply on mobile devices (screen width < 768px)
      if (window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & scrolled more than 100px
          header.style.transform = 'translateY(-100%)';
          if (searchPanel) {
            searchPanel.style.transform = 'translateY(-100%)';
          }
        } else {
          // Scrolling up or at top
          header.style.transform = 'translateY(0)';
          if (searchPanel) {
            searchPanel.style.transform = 'translateY(0)';
          }
        }
      } else {
        // Desktop - always show
        header.style.transform = 'translateY(0)';
        if (searchPanel) {
          searchPanel.style.transform = 'translateY(0)';
        }
      }
      
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderVisibility);
        ticking = true;
      }
    };

    const onResize = () => {
      const header = document.getElementById('main-header');
      const searchPanel = document.getElementById('search-panel');
      if (!header) return;
      
      if (window.innerWidth >= 768) {
        // Desktop - always show
        header.style.transform = 'translateY(0)';
        if (searchPanel) {
          searchPanel.style.transform = 'translateY(0)';
        }
      }
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
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
      const [productsData, categoriesData, contactsData, generalInfoData] = await Promise.all([
        firestoreService.getProducts(),
        firestoreService.getCategories(),
        firestoreService.getContacts(),
        firestoreService.getGeneralInfo()
      ]);
      
      console.log('✅ Loaded from Firestore:', {
        products: productsData.length,
        categories: categoriesData.length,
        contacts: contactsData.length,
        generalInfo: generalInfoData
      });
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setContacts(contactsData || []);
      setGeneralInfo(generalInfoData);
      
    } catch (error) {
      console.error('❌ Firestore load error:', error);
      alert('⚠️ Firestore bağlantı xətası! Firebase console-da security rules yoxlayın.');
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentId);
  };

  const getSubCategories = (parentId) => {
    return categories.filter(cat => cat.parentId === parentId);
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    // QLOBAL AXTARIŞ: Əgər axtarış varsa, kateqoriya filtri tətbiq edilmir
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.model && p.model.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    } else {
      // Axtarış yoxdursa, kateqoriya filteri tətbiq et
      if (selectedCategory !== 'all') {
        // Kateqoriya seçilibsə, həmin kateqoriyanın bütün məhsullarını göstər
        filtered = filtered.filter(p => {
          // Parent kateqoriya olaraq uyğunluq
          if (p.category === selectedCategory) return true;
          // Alt kateqoriya olaraq uyğunluq
          if (p.subCategory === selectedCategory) return true;
          return false;
        });
      } else {
        // "Hamısı" seçilibsə, yalnız includeInAllProducts=true olan kateqoriyaların məhsullarını göstər
        filtered = filtered.filter(p => {
          // Məhsulun kateqoriyasını tap
          const productCategory = categories.find(cat => cat.name === p.category);
          // Kateqoriya tapılmazsa və ya includeInAllProducts !== false isə göstər
          return !productCategory || productCategory.includeInAllProducts !== false;
        });
      }
    }
    
    // Sort məhsulları: əvvəl kateqoriya, sonra kateqoriya daxilində order field
    const sorted = filtered.sort((a, b) => {
      // 1. Kateqoriya adına görə sort (alfabetik)
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category, 'az');
      }
      
      // 2. Eyni kateqoriyada order field-ə görə sort
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // 3. Order eyni olarsa, ada görə sort (fallback)
      return a.name.localeCompare(b.name, 'az');
    });
    
    return sorted;
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0); // Reset image index
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setCurrentImageIndex(0); // Reset image index
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
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
      <header className="bg-orange-600 shadow-md sticky top-0 z-50 transition-transform duration-300" id="main-header">
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
      <div className="bg-white border-b border-gray-200 py-6 sticky top-0 z-40 transition-transform duration-300" id="search-panel">
        <div className="w-full px-2 md:px-4">
          <div className="flex justify-center items-center">
            <div className="w-full max-w-[95%] md:max-w-3xl md:w-[60%]">
              <div className="flex flex-row gap-2 justify-center items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Məhsul axtar..."
                  className="flex-1 px-3 md:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                  data-testid="search-input"
                />
                <button
                  onClick={() => {}}
                  className="px-4 md:px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  data-testid="search-button"
                >
                  🔍 Axtar
                </button>
              </div>
              {searchQuery && (
                <div className="mt-2 text-sm text-gray-600 text-center md:text-left">
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
                  Hamısı
                </button>
                
                {getParentCategories()
                  .sort((a, b) => {
                    const orderA = a.order ?? 999;
                    const orderB = b.order ?? 999;
                    return orderA - orderB;
                  })
                  .map(parentCat => {
                    const subCategories = getSubCategories(parentCat.id);
                    const hasSubCategories = subCategories.length > 0;
                    const isExpanded = expandedCategories[parentCat.id];
                    
                    return (
                      <div key={parentCat.id}>
                        {/* Əsas Kateqoriya */}
                        <div className="flex items-center gap-1">
                          {hasSubCategories && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(parentCat.id);
                              }}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-orange-600 transition-colors"
                            >
                              <svg 
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (hasSubCategories) {
                                // Əgər alt kateqoriyalar varsa, yalnız toggle et
                                toggleCategory(parentCat.id);
                              } else {
                                // Əgər alt kateqoriya yoxdursa, məhsulları göstər
                                setSelectedCategory(parentCat.name);
                              }
                            }}
                            className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              !hasSubCategories ? 'ml-0' : ''
                            } ${
                              selectedCategory === parentCat.name && !hasSubCategories
                                ? 'bg-orange-500 text-white'
                                : hasSubCategories && isExpanded
                                ? 'bg-gray-200 text-gray-900 font-semibold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {parentCat.name}
                          </button>
                        </div>
                        
                        {/* Alt Kateqoriyalar */}
                        {hasSubCategories && isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {subCategories
                              .sort((a, b) => {
                                const orderA = a.order ?? 999;
                                const orderB = b.order ?? 999;
                                return orderA - orderB;
                              })
                              .map(subCat => (
                                <button
                                  key={subCat.id}
                                  onClick={() => setSelectedCategory(subCat.name)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedCategory === subCat.name
                                      ? 'bg-orange-500 text-white font-medium'
                                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {subCat.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </aside>

          {/* Sağ tərəf - Məhsullar */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory === 'all' ? 'Bütün Məhsullar' : selectedCategory}
              </h2>
            </div>

            {/* Məhsul Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {getFilteredProducts().map(product => (
                <div 
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  {/* Şəkil */}
                  <div 
                    className="w-full h-40 md:h-64 bg-white md:bg-gray-100 flex items-center justify-center overflow-hidden p-3 md:p-0"
                  >
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-contain md:object-cover"
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
                  <div className="p-2 md:p-3">
                    <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 hover:text-orange-600 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg md:text-2xl font-bold text-orange-600">{product.price.toFixed(2)} ₼</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredProducts().length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg">
                  {searchQuery.trim() 
                    ? `"${searchQuery}" üçün heç bir məhsul tapılmadı` 
                    : 'Bu kateqoriyada məhsul tapılmadı'}
                </p>
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
              {/* Desktop: 4 sütunlu grid, Tablet: 2x2, Mobile: alt-alta */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
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

                {/* Ümumi Məlumat */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-purple-400 font-bold text-lg mb-4 flex items-center gap-2">
                    ℹ️ Ümumi Məlumat
                  </h3>
                  <div className="space-y-3">
                    <div className="text-gray-300">
                      <span className="font-semibold">Ünvan:</span>
                      <div className="text-sm mt-1">
                        {generalInfo.addressLink ? (
                          <a 
                            href={generalInfo.addressLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-purple-400 transition-colors underline"
                          >
                            {generalInfo.address}
                          </a>
                        ) : (
                          <span>{generalInfo.address}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-300">
                      <span className="font-semibold">İş saatları:</span>
                      <div className="text-sm mt-1">{generalInfo.workingHours}</div>
                    </div>
                    <div className="text-gray-300">
                      <span className="font-semibold">E-poçt:</span>
                      <div className="text-sm mt-1">
                        <a 
                          href={`mailto:${generalInfo.email}`}
                          className="hover:text-purple-400 transition-colors"
                        >
                          {generalInfo.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

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
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] md:max-h-[90vh] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Məhsul Haqqında</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Sol tərəf - Şəkillər */}
                <div>
                  <div className="bg-white rounded-lg overflow-hidden mb-3 md:mb-4 p-4">
                    {selectedProduct.image_urls && selectedProduct.image_urls.length > 0 ? (
                      <img
                        src={selectedProduct.image_urls[currentImageIndex]}
                        alt={selectedProduct.name}
                        className="w-full h-80 md:h-[500px] object-contain"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x400?text=Şəkil+Yoxdur';
                        }}
                      />
                    ) : (
                      <div className="w-full h-80 md:h-[500px] flex items-center justify-center text-gray-400">
                        Şəkil Yoxdur
                      </div>
                    )}
                  </div>
                  
                  {/* Əlavə şəkillər - Thumbnails */}
                  {selectedProduct.image_urls && selectedProduct.image_urls.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.image_urls.slice(0, 4).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${selectedProduct.name} ${index + 1}`}
                          className={`w-full h-16 md:h-20 object-cover rounded-lg cursor-pointer transition-all ${
                            currentImageIndex === index 
                              ? 'ring-2 ring-orange-500 opacity-100' 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          onClick={() => handleThumbnailClick(index)}
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
                  <div className="mb-3 md:mb-4">
                    <span className="inline-block bg-orange-100 text-orange-600 text-xs md:text-sm px-3 md:px-4 py-1 rounded-full font-medium">
                      {selectedProduct.category}
                    </span>
                  </div>
                  
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{selectedProduct.name}</h1>
                  
                  <div className="mb-4 md:mb-6">
                    <span className="text-2xl md:text-4xl font-bold text-orange-600">{selectedProduct.price.toFixed(2)} ₼</span>
                  </div>

                  {selectedProduct.description && (
                    <div className="mb-4 md:mb-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Təsvir</h3>
                      <p className="text-sm md:text-base text-gray-700">{selectedProduct.description}</p>
                    </div>
                  )}

                  {selectedProduct.specifications && (
                    <div className="mb-4 md:mb-6">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3">Texniki Xüsusiyyətlər</h3>
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                        <pre className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap font-sans">
                          {selectedProduct.specifications}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Features/Specifications - without stock */}
                  {/* Səbətə at və Bağla düyməsi */}
                  <div className="space-y-2 md:space-y-3">
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
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 md:h-5 md:w-5"
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
                      className="w-full bg-gray-200 text-gray-800 px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-sm md:text-lg"
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