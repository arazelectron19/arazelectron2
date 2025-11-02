import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockAPI, initializeStorage } from "./mockAPI";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Initialize storage with mock data
      initializeStorage();
      
      // Load from localStorage via mockAPI
      const productsData = await mockAPI.getProducts();
      setProducts(productsData || []);
      
      const categoriesData = await mockAPI.getCategories();
      setCategories(categoriesData.categories || []);
      
      const contactData = await mockAPI.getContactInfo();
      setContactInfo(contactData);
      
    } catch (error) {
      console.error('Məlumat yükləmə xətası:', error);
      // Initialize with empty data if error
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
    
    return filtered;
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
          <p className="mt-4 text-gray-600 text-lg">
            {serverWaking ? '☕ Server oyaq olur...' : 'Yüklənir...'}
          </p>
          {serverWaking && (
            <p className="mt-2 text-gray-500 text-sm">
              Bu bir neçə saniyə çəkə bilər
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_azdili-danis/artifacts/rs4w4vbq_AE.png" 
                alt="Araz Elektron Logo"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-orange-600">Araz Elektron</h1>
                <p className="text-sm text-gray-600">Keyfiyyətli elektron avadanlıqlar</p>
              </div>
            </div>
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
              <h3 className="text-lg font-bold text-gray-900 mb-3">📦 Kataloq</h3>
              
              <div className="space-y-1">
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
                
                {categories.map(category => {
                  const count = products.filter(p => p.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category} ({count})
                    </button>
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
              <p className="text-gray-600">{getFilteredProducts().length} məhsul tapıldı</p>
            </div>

            {/* Məhsul Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredProducts().map(product => (
                <div 
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                >
                  {/* Şəkil */}
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
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
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">{product.price.toFixed(2)} ₼</span>
                      <span className="text-sm text-orange-500 font-medium">Detallar üçün klikləyin</span>
                    </div>
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
          
          {contactInfo && (
            <div className="max-w-4xl mx-auto">
              {/* Əlaqə qrupları - yan-yana */}
              <div className="bg-gray-800 rounded-xl p-8 mb-6">
                <div className="space-y-4 text-gray-300">
                  {/* WhatsApp */}
                  <div>
                    <span className="text-green-400 font-semibold">📱 WhatsApp: </span>
                    {contactInfo.contact_groups?.whatsapp?.map((contact, index) => (
                      <span key={index}>
                        <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                          {contact.name} ({contact.phone})
                        </a>
                        {index < contactInfo.contact_groups.whatsapp.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                  
                  {/* Ustalar */}
                  <div>
                    <span className="text-blue-400 font-semibold">🔧 Ustalar: </span>
                    {contactInfo.contact_groups?.ustalar?.map((contact, index) => (
                      <span key={index}>
                        <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className="hover:text-blue-400 transition-colors">
                          {contact.name} ({contact.phone})
                        </a>
                        {index < contactInfo.contact_groups.ustalar.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                  
                  {/* Satış */}
                  <div>
                    <span className="text-orange-400 font-semibold">💼 Satış: </span>
                    {contactInfo.contact_groups?.satis?.map((contact, index) => (
                      <span key={index}>
                        <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className="hover:text-orange-400 transition-colors">
                          {contact.name} ({contact.phone})
                        </a>
                        {index < contactInfo.contact_groups.satis.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ünvan və Digər Məlumatlar */}
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold mb-4">📍 Ünvan və İş Saatları</h3>
                <p className="text-gray-300 mb-1">{contactInfo.address_line1}</p>
                <p className="text-gray-300 mb-1">{contactInfo.address_line2}</p>
                <p className="text-gray-300 mb-3">{contactInfo.address_line3}</p>
                <p className="text-gray-400 mb-2">🕒 {contactInfo.work_hours}</p>
                <p className="text-gray-400 italic text-sm">{contactInfo.company_description}</p>
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
              src="https://customer-assets.emergentagent.com/job_azdili-danis/artifacts/rs4w4vbq_AE.png" 
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

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Təsvir</h3>
                    <p className="text-gray-700">{selectedProduct.description}</p>
                  </div>

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

                  {selectedProduct.stock !== undefined && (
                    <div className="mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Stok:</span>
                        <span className={`font-semibold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} ədəd mövcuddur` : 'Stokda yoxdur'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bağla düyməsi */}
                  <div>
                    <button 
                      onClick={closeModal}
                      className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
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
    </div>
  );
};

export default HomePage;