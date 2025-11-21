import React, { useState, useEffect } from "react";
import { mockAPI } from "./mockAPI";
import { firestoreService } from "./firestoreService";
import { APP_VERSION, hardRefreshIfNeeded } from "./version";
import logo from "./assets/logo.png";
import PasswordLogin from "./components/PasswordLogin";

// Admin Panel - Simple Password Protected
const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [generalInfo, setGeneralInfo] = useState({
    address: '',
    workingHours: '',
    email: ''
  });
  const [activeTab, setActiveTab] = useState('products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryDeleteError, setCategoryDeleteError] = useState(null);
  const [categoryDeleteSuccess, setCategoryDeleteSuccess] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState(null);
  const [addCategorySuccess, setAddCategorySuccess] = useState(false);
  // Removed backend warning - using Firestore directly

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_urls: [''],
    stock: '',
    is_featured: false,
    order: 999,
    specifications: ''
  });

  // Check localStorage authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check version and hard reload if needed
      await hardRefreshIfNeeded();
      
      // Load from Firestore
      const categoriesData = await firestoreService.getCategories();
      setCategories(categoriesData || []);

      if (activeTab === 'products') {
        const productsData = await firestoreService.getProducts();
        setProducts(productsData || []);
      } else if (activeTab === 'orders') {
        const ordersData = await firestoreService.getOrders();
        setOrders(ordersData || []);
      } else if (activeTab === 'contact') {
        const contactData = await firestoreService.getContactInfo();
        setContactInfo(contactData ||{});
        const generalInfoData = await firestoreService.getGeneralInfo();
        setGeneralInfo(generalInfoData);
      } else if (activeTab === 'categories') {
        setCategoriesList(categoriesData || []);
      }
    } catch (error) {
      console.error('Məlumat yükləmə xətası:', error);
      alert('⚠️ Firestore bağlantı xətası! Firebase console-da security rules yoxlayın.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_urls: [''],
      stock: '',
      is_featured: false,
      order: 999,
      specifications: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find selected category object to get both id and name
      const selectedCategoryObj = categories.find(cat => {
        const catName = typeof cat === 'string' ? cat : cat?.name;
        return catName === formData.category;
      });
      
      const categoryId = selectedCategoryObj && typeof selectedCategoryObj === 'object' 
        ? selectedCategoryObj.id 
        : null;
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 100,
        categoryId: categoryId,
        category: formData.category,
        image_urls: formData.image_urls.filter(url => url.trim()),
        is_featured: formData.is_featured || false,
        specifications: formData.specifications || ''
      };

      // Use Firestore directly
      if (editingProduct) {
        await firestoreService.updateProduct(editingProduct.id, productData);
        alert('✅ Məhsul güncəlləndi!');
      } else {
        await firestoreService.addProduct(productData);
        alert('✅ Məhsul əlavə edildi!');
      }
      
      resetForm();
      loadData();
      
      // Ana səhifəyə məlumat ver ki, məhsulları yeniləsin
      window.dispatchEvent(new CustomEvent('products-updated'));
      
    } catch (error) {
      console.error('Məhsul əməliyyat xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_urls: product.image_urls && product.image_urls.length > 0 ? product.image_urls : [product.image_url || ''],
      stock: '100',  // Default value
      is_featured: product.is_featured,
      specifications: product.specifications || ''
    });
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const addImageUrl = () => {
    setFormData({...formData, image_urls: [...formData.image_urls, '']});
  };

  const removeImageUrl = (index) => {
    const newImageUrls = formData.image_urls.filter((_, i) => i !== index);
    setFormData({...formData, image_urls: newImageUrls.length > 0 ? newImageUrls : ['']});
  };

  const updateImageUrl = (index, value) => {
    const newImageUrls = [...formData.image_urls];
    newImageUrls[index] = value;
    setFormData({...formData, image_urls: newImageUrls});
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    
    try {
      const result = await mockAPI.uploadImage(file);
      
      if (result.url) {
        updateImageUrl(index, result.url);
        alert('✅ Şəkil uğurla yükləndi! (data URL olaraq)');
      }
    } catch (error) {
      console.error('Şəkil yükləmə xətası:', error);
      alert('❌ Şəkil yükləmə zamanı xəta baş verdi!');
    }
  };

  const handleDeleteClick = (productId) => {
    console.log('Delete düyməsinə kliklənd:', productId);
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    console.log('Silmə təsdiqləndi:', productToDelete);
    setLoading(true);
    setShowDeleteConfirm(false);
    
    try {
      // Use Firestore
      await firestoreService.deleteProduct(productToDelete);
      
      alert('✅ Məhsul uğurla silindi!');
      
      // Məlumatları yenilə
      await loadData();
      
      // Ana səhifəyə məlumat ver
      window.dispatchEvent(new CustomEvent('products-updated'));
      
      console.log('Məhsul silindi və məlumatlar yeniləndi');
      
    } catch (error) {
      console.error('❌ Silmə xətası:', error);
      alert('❌ Xəta: ' + error.message);
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    console.log('Silmə ləğv edildi');
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await mockAPI.updateOrderStatus(orderId, newStatus);
      alert('✅ Status güncəlləndi!');
      loadData();
    } catch (error) {
      console.error('Status güncəlləmə xətası:', error);
      alert('❌ Status güncəlləmə xətası!');
    }
  };

  const handleContactUpdate = async (contactData) => {
    try {
      await firestoreService.saveContactInfo(contactData);
      setContactInfo(contactData);
      alert('✅ Əlaqə məlumatları güncəlləndi!');
      
      // Ana səhifəyə məlumat ver ki, əlaqə məlumatlarını yeniləsin
      window.dispatchEvent(new CustomEvent('contact-updated'));
      
    } catch (error) {
      console.error('Əlaqə güncəlləmə xətası:', error);
      alert('❌ Güncəlləmə zamanı xəta baş verdi: ' + error.message);
    }
  };

  const addCategory = async (categoryName) => {
    if (!categoryName.trim()) {
      setAddCategoryError('Kateqoriya adını daxil edin!');
      setShowAddCategoryModal(true);
      return;
    }

    setAddCategoryError(null);
    setAddCategorySuccess(false);

    try {
      // Use Firestore
      await firestoreService.addCategory(categoryName.trim());
      
      setAddCategorySuccess(true);
      setShowAddCategoryModal(true);
      setTimeout(() => {
        setShowAddCategoryModal(false);
        setAddCategorySuccess(false);
        loadData(); // Reload categories
      }, 1500);
    } catch (error) {
      console.error('Kateqoriya əlavə etmə xətası:', error);
      setAddCategoryError('Kateqoriya əlavə etmə zamanı xəta baş verdi: ' + error.message);
      setShowAddCategoryModal(true);
    }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    // Show confirmation modal instead of window.confirm
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setShowDeleteCategoryConfirm(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return;

    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);

    try {
      // Use Firestore
      await firestoreService.deleteCategory(categoryToDelete.id);
      
      setCategoryDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteCategoryConfirm(false);
        setCategoryToDelete(null);
        setCategoryDeleteSuccess(false);
        loadData(); // Reload categories
      }, 1500);
    } catch (error) {
      console.error('Kateqoriya silmə xətası:', error);
      
      if (error.message.includes('products')) {
        setCategoryDeleteError('Bu kateqoriyada məhsul var! Əvvəlcə məhsulları silin.');
      } else {
        setCategoryDeleteError('Kateqoriya silmə zamanı xəta baş verdi: ' + error.message);
      }
    }
  };

  const handleDeleteCategoryCancel = () => {
    setShowDeleteCategoryConfirm(false);
    setCategoryToDelete(null);
    setCategoryDeleteError(null);
    setCategoryDeleteSuccess(false);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <PasswordLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Məhsulu sil?
            </h3>
            <p className="text-gray-600 mb-6">
              Bu məhsulu silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq olmaz.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                data-testid="delete-cancel-button"
              >
                Ləğv et
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                data-testid="delete-confirm-button"
              >
                Bəli, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Kateqoriyanı sil?
            </h3>
            
            {/* Success Message */}
            {categoryDeleteSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Kateqoriya uğurla silindi!</p>
              </div>
            )}
            
            {/* Error Message */}
            {categoryDeleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">❌ {categoryDeleteError}</p>
              </div>
            )}
            
            {/* Confirmation Text */}
            {!categoryDeleteSuccess && !categoryDeleteError && (
              <p className="text-gray-600 mb-6">
                "<span className="font-semibold">{categoryToDelete?.name}</span>" kateqoriyasını silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq olmaz.
              </p>
            )}
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleDeleteCategoryCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                data-testid="delete-category-cancel-button"
              >
                {categoryDeleteError ? 'Bağla' : 'Ləğv et'}
              </button>
              {!categoryDeleteSuccess && !categoryDeleteError && (
                <button
                  onClick={handleDeleteCategoryConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                  data-testid="delete-category-confirm-button"
                >
                  Bəli, Sil
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Kateqoriya əlavə et
            </h3>
            
            {/* Success Message */}
            {addCategorySuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Kateqoriya uğurla əlavə edildi!</p>
              </div>
            )}
            
            {/* Error Message */}
            {addCategoryError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">❌ {addCategoryError}</p>
              </div>
            )}
            
            {/* Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setAddCategoryError(null);
                  setAddCategorySuccess(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Araz Elektron Logo"
                className="h-10 w-10 mr-3 object-contain"
              />
              <h1 className="text-2xl font-bold text-orange-600">
                Araz Elektron - Admin Panel
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="/" className="text-orange-600 hover:text-orange-700">
                ← Ana səhifəyə qayıt
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('adminAuthenticated');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                🚪 Çıxış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'products' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="products-tab"
          >
            Məhsullar
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'orders' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="orders-tab"
          >
            Sifarişlər
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'contact' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="contact-tab"
          >
            Əlaqə Məlumatları
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="categories-tab"
          >
            Kateqoriyalar
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yüklənir...</p>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && !loading && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Məhsul İdarəetməsi</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                data-testid="add-product-button"
              >
                + Yeni Məhsul
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6" data-testid="product-form">
                <h3 className="text-lg font-semibold mb-4">
                  {editingProduct ? 'Məhsul Redaktə Et' : 'Yeni Məhsul Əlavə Et'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Məhsul Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        data-testid="product-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qiymət (₼) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        data-testid="product-price-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kateqoriya *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        data-testid="product-category-select"
                      >
                        <option value="">Seçin...</option>
                        {categories.map(category => {
                          const categoryName = typeof category === 'string' ? category : (category?.name || '');
                          const categoryValue = typeof category === 'string' ? category : (category?.name || '');
                          return (
                            <option key={categoryValue} value={categoryValue}>
                              {categoryName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Təsvir
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      data-testid="product-description-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şəkil URL-ləri
                    </label>
                    {formData.image_urls.map((url, index) => (
                      <div key={index} className="flex gap-2 mb-3">
                        <div className="flex-1">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateImageUrl(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            placeholder={`Şəkil URL ${index + 1}`}
                            data-testid={`product-image-input-${index}`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleImageUpload(index, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            id={`file-input-${index}`}
                          />
                          <label
                            htmlFor={`file-input-${index}`}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer text-sm flex items-center"
                            data-testid={`upload-image-${index}`}
                            title="Kompüterdən şəkil seç"
                          >
                            📁 Seç
                          </label>
                          {formData.image_urls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeImageUrl(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              data-testid={`remove-image-${index}`}
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                      data-testid="add-image-url"
                    >
                      + Şəkil Əlavə Et
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Hər şəkil üçün URL daxil edə və ya 📁 "Seç" düyməsi ilə kompüterdən yükləyə bilərsiniz
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xüsusiyyətlər
                    </label>
                    <textarea
                      value={formData.specifications}
                      onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Məhsulun texniki xüsusiyyətlərini yazın (hər xüsusiyyəti yeni sətirdə)"
                      data-testid="product-specifications-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hər xüsusiyyəti "• " ilə başlayın və yeni sətirdə yazın
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      data-testid="product-featured-checkbox"
                    />
                    <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                      Xüsusi məhsul
                    </label>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      data-testid="save-product-button"
                    >
                      {editingProduct ? 'Güncəllə' : 'Əlavə Et'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      data-testid="cancel-product-button"
                    >
                      İmtina
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200" data-testid="products-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şəkil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kateqoriya</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qiymət</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : product.image_url || 'https://via.placeholder.com/100x100?text=?'}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x100?text=?';
                          }}
                        />
                        {product.image_urls && product.image_urls.length > 1 && (
                          <span className="text-xs text-gray-500 block mt-1">
                            +{product.image_urls.length - 1} şəkil
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-2">{product.description}</div>
                          {product.is_featured && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Xüsusi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        {product.price.toFixed(2)} ₼
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          disabled={loading}
                          className={`${
                            loading 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-orange-600 hover:text-orange-900 hover:underline'
                          } font-medium transition-colors mr-4`}
                          data-testid={`edit-product-${product.id}`}
                        >
                          {loading ? '⏳' : '✏️'} Redaktə
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product.id)}
                          disabled={loading}
                          className={`${
                            loading 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-900 hover:underline'
                          } font-medium transition-colors`}
                          data-testid={`delete-product-${product.id}`}
                          title={loading ? 'Gözləyin...' : 'Məhsulu sil'}
                        >
                          {loading ? '⏳ Gözləyin...' : '🗑️ Sil'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && !loading && (
          <OrdersTab 
            orders={orders} 
            setOrders={setOrders}
            onUpdateStatus={async (id, status) => {
              await firestoreService.updateOrderStatus(id, status);
              loadData();
            }} 
          />
        )}

        {activeTab === 'orders_old' && !loading && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Sifarişlər (köhnə)</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Hələlik sifariş yoxdur</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-lg shadow p-6" data-testid={`order-${order.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Sifariş #{order.id.slice(-8)}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('az-AZ')} - 
                          {new Date(order.created_at).toLocaleTimeString('az-AZ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                          data-testid={`order-status-${order.id}`}
                        >
                          <option value="pending">Gözləyir</option>
                          <option value="confirmed">Təsdiqləndi</option>
                          <option value="delivered">Çatdırıldı</option>
                          <option value="cancelled">İmtina</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Müştəri Məlumatları</h4>
                        <p className="text-sm text-gray-600">Ad: {order.customer_name}</p>
                        <p className="text-sm text-gray-600">Telefon: {order.customer_phone}</p>
                        <p className="text-sm text-gray-600">Email: {order.customer_email}</p>
                        <p className="text-sm text-gray-600">Ünvan: {order.customer_address}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Sifariş Məlumatları</h4>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600 flex justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} ₼</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between font-medium text-gray-900">
                            <span>Toplam:</span>
                            <span>{order.total_amount.toFixed(2)} ₼</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Info Tab */}
        {activeTab === 'contact' && !loading && (
          <ContactInfoTab 
            contactInfo={contactInfo}
            onContactUpdate={handleContactUpdate}
            generalInfo={generalInfo}
            onGeneralInfoUpdate={async (data) => {
              try {
                await firestoreService.updateGeneralInfo(data);
                setGeneralInfo(data);
                alert('✅ Ümumi məlumat yeniləndi!');
              } catch (error) {
                console.error('Update error:', error);
                alert('❌ Xəta baş verdi!');
              }
            }}
          />
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && !loading && (
          <CategoriesTab 
            categoriesList={categoriesList}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
        )}
      </div>
    </div>
  );
};

// Contact Info Tab Component - Simplified for Firestore
// Contact Info Tab Component - Simplified for Firestore
// Contact Info Tab Component - Dynamic Contacts Management
const ContactInfoTab = ({ contactInfo, onContactUpdate, generalInfo, onGeneralInfoUpdate }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'whatsapp',
    name: '',
    phone: ''
  });
  const [generalInfoForm, setGeneralInfoForm] = useState({
    address: '',
    workingHours: '',
    email: ''
  });

  useEffect(() => {
    if (generalInfo) {
      setGeneralInfoForm(generalInfo);
    }
  }, [generalInfo]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Kontaktlar yüklənə bilmədi:', error);
      alert('❌ Kontaktlar yüklənə bilmədi!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ category: 'whatsapp', name: '', phone: '' });
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleEditClick = (contact) => {
    setFormData({
      category: contact.category,
      name: contact.name,
      phone: contact.phone
    });
    setEditingId(contact.id);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('❌ Ad və telefon nömrəsi daxil edin!');
      return;
    }

    try {
      if (editingId) {
        await firestoreService.updateContact(editingId, formData);
        alert('✅ Kontakt yeniləndi!');
      } else {
        await firestoreService.addContact(formData);
        alert('✅ Kontakt əlavə edildi!');
      }
      
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ category: 'whatsapp', name: '', phone: '' });
      loadContacts();
    } catch (error) {
      console.error('Saxlama xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kontaktı silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      await firestoreService.deleteContact(id);
      alert('✅ Kontakt silindi!');
      loadContacts();
    } catch (error) {
      console.error('Silmə xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      whatsapp: '📱 WhatsApp',
      masters: '🔧 Ustalar',
      sales: '💼 Satış'
    };
    return labels[category] || category;
  };

  const groupedContacts = {
    whatsapp: contacts.filter(c => c.category === 'whatsapp'),
    masters: contacts.filter(c => c.category === 'masters'),
    sales: contacts.filter(c => c.category === 'sales')
  };

  if (loading) {
    return <div className="text-center py-8">Yüklənir...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Əlaqə Məlumatları</h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
        >
          + Yeni Əlaqə
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-orange-500">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Kontaktı Dəyişdir' : 'Yeni Kontakt'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kateqoriya
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="whatsapp">📱 WhatsApp</option>
                <option value="masters">🔧 Ustalar</option>
                <option value="sales">💼 Satış</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Məsələn: Rəşid"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon Nömrəsi
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+994 XX XXX XX XX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                💾 Saxla
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                ✖ Ləğv et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Table by Category */}
      <div className="space-y-6">
        {['whatsapp', 'masters', 'sales'].map(category => (
          <div key={category} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {getCategoryLabel(category)}
            </h3>
            
            {groupedContacts[category].length === 0 ? (
              <p className="text-gray-500 text-sm italic">Bu kateqoriyada kontakt yoxdur</p>
            ) : (
              <div className="space-y-2">
                {groupedContacts[category].map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{contact.name}</span>
                      <span className="mx-2 text-gray-400">—</span>
                      <span className="text-gray-700">{contact.phone}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(contact)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        ✏️ Dəyişdir
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ümumi Məlumat Section */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">ℹ️ Ümumi Məlumat</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ünvan
            </label>
            <textarea
              value={generalInfoForm.address}
              onChange={(e) => setGeneralInfoForm({...generalInfoForm, address: e.target.value})}
              placeholder="Ünvanı daxil edin"
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İş Saatları
            </label>
            <input
              type="text"
              value={generalInfoForm.workingHours}
              onChange={(e) => setGeneralInfoForm({...generalInfoForm, workingHours: e.target.value})}
              placeholder="Məsələn: 09:00 – 20:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-poçt
            </label>
            <input
              type="email"
              value={generalInfoForm.email}
              onChange={(e) => setGeneralInfoForm({...generalInfoForm, email: e.target.value})}
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={() => {
              if (onGeneralInfoUpdate) {
                onGeneralInfoUpdate(generalInfoForm);
              }
            }}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
          >
            💾 Ümumi Məlumatı Yadda Saxla
          </button>
        </div>
      </div>
    </div>
  );
};


// Orders Tab Component - Firestore Orders
const OrdersTab = ({ orders, setOrders, onUpdateStatus }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      yeni: 'bg-blue-100 text-blue-800',
      hazırlanır: 'bg-yellow-100 text-yellow-800',
      hazır: 'bg-green-100 text-green-800',
      tamamlanıb: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Sifarişlər</h2>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500">Hələlik sifariş yoxdur</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Məbləğ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ətraflı
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-orange-600">
                      #{order.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('az-AZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900">
                      {order.total?.toFixed(2)} ₼
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:underline font-medium mr-4"
                    >
                      👁️ Bax
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm(`Sifariş #${order.code} silinsin?`);
                        if (!confirmed) return;
                        
                        try {
                          await firestoreService.deleteOrder(order.id);
                          setOrders(prev => prev.filter(o => o.id !== order.id));
                          alert('✅ Sifariş silindi!');
                        } catch (error) {
                          console.error('Silmə xətası:', error);
                          alert('❌ Sifarişi silmək alınmadı!');
                        }
                      }}
                      className="text-red-600 hover:underline font-medium"
                    >
                      🗑️ Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                Sifariş #{selectedOrder.code}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Müştəri Məlumatları</h4>
                <p className="text-sm text-gray-600">
                  📞 Telefon: <span className="font-medium">{selectedOrder.phone}</span>
                </p>
                <p className="text-sm text-gray-600">
                  📅 Tarix: {new Date(selectedOrder.createdAt).toLocaleString('az-AZ')}
                </p>
              </div>

              {/* Products */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Məhsullar</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      {/* Product Image */}
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Say: {item.qty} × {item.price} ₼</p>
                      </div>
                      
                      {/* Total Price */}
                      <p className="font-bold text-gray-900">
                        {(item.qty * item.price).toFixed(2)} ₼
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Ümumi Məbləğ:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {selectedOrder.total?.toFixed(2)} ₼
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const CategoriesTab = ({ categoriesList, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsAdding(true);
    try {
      await onAddCategory(newCategoryName);
      setNewCategoryName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0 || isReordering) return;
    
    setIsReordering(true);
    try {
      // Sort categories by order
      const sortedCategories = [...categoriesList].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        return orderA - orderB;
      });
      
      // Swap with previous
      [sortedCategories[index], sortedCategories[index - 1]] = 
      [sortedCategories[index - 1], sortedCategories[index]];
      
      // Reassign order values
      const updatedCategories = sortedCategories.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        order: idx + 1
      }));
      
      // Update Firestore
      await firestoreService.updateCategoryOrders(updatedCategories);
      
      alert('✅ Sıra yeniləndi!');
      window.location.reload();
    } catch (error) {
      console.error('Sıra dəyişmə xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveDown = async (index) => {
    const sortedCategories = [...categoriesList].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
    
    if (index === sortedCategories.length - 1 || isReordering) return;
    
    setIsReordering(true);
    try {
      // Swap with next
      [sortedCategories[index], sortedCategories[index + 1]] = 
      [sortedCategories[index + 1], sortedCategories[index]];
      
      // Reassign order values
      const updatedCategories = sortedCategories.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        order: idx + 1
      }));
      
      // Update Firestore
      await firestoreService.updateCategoryOrders(updatedCategories);
      
      alert('✅ Sıra yeniləndi!');
      window.location.reload();
    } catch (error) {
      console.error('Sıra dəyişmə xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    } finally {
      setIsReordering(false);
    }
  };

  const handleToggleIncludeInAll = async (category) => {
    try {
      const newValue = !category.includeInAllProducts;
      await firestoreService.updateCategory(category.id, {
        includeInAllProducts: newValue
      });
      alert(`✅ "${category.name}" kateqoriyası ${newValue ? 'göstəriləcək' : 'gizlədiləcək'} "Bütün Məhsullar"da`);
      window.location.reload();
    } catch (error) {
      console.error('Toggle xətası:', error);
      alert('❌ Xəta baş verdi!');
    }
  };

  const handleMigrateOrder = async () => {
    if (!window.confirm('Kateqoriyalara "order" sahəsi əlavə etmək istədiyinizə əminsiniz?')) {
      return;
    }

    setIsMigrating(true);
    try {
      console.log('🔧 Starting category order migration...');
      
      // Get all categories from Firestore
      const categories = await firestoreService.getCategories();
      console.log(`📦 Found ${categories.length} categories`);
      
      // Define default order mapping
      const orderMap = {
        'DVR': 1,
        'kamera': 2,
        'Monitorlar': 3,
        'Komputer': 4,
        'Telefon': 5,
        'Kondisioner': 6,
        'Paltaryuyan': 7,
        'Soyuducu': 8,
      };
      
      let updated = 0;
      let skipped = 0;
      
      for (const category of categories) {
        const categoryName = category.name;
        
        // Check if order already exists
        if (typeof category.order === 'number') {
          console.log(`⏭️  Skipping "${categoryName}" - already has order: ${category.order}`);
          skipped++;
          continue;
        }
        
        // Get order from map or assign a high number
        const orderValue = orderMap[categoryName] || 999;
        
        // Update category with order field
        try {
          await firestoreService.updateCategory(category.id, {
            name: category.name,
            order: orderValue
          });
          console.log(`✅ Updated "${categoryName}" with order: ${orderValue}`);
          updated++;
        } catch (error) {
          console.error(`❌ Failed to update "${categoryName}":`, error);
        }
      }
      
      console.log('\n📊 Migration Summary:');
      console.log(`   ✅ Updated: ${updated}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
      console.log(`   📦 Total: ${categories.length}`);
      
      alert(`✅ Uğurla tamamlandı!\n\nYeniləndi: ${updated}\nAtlandı: ${skipped}\nCəmi: ${categories.length}`);
      window.location.reload();
      
    } catch (error) {
      console.error('Migration error:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Kateqoriya İdarəetməsi</h2>
        <button
          onClick={handleMigrateOrder}
          disabled={isMigrating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
        >
          {isMigrating ? '⏳ Yenilənir...' : '🔧 Order Sahəsi Əlavə Et'}
        </button>
      </div>
      
      {/* Yeni kateqoriya əlavə et */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Yeni Kateqoriya Əlavə Et</h3>
        <form onSubmit={handleAddCategory} className="flex gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Kateqoriya adını daxil edin"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            data-testid="new-category-input"
          />
          <button
            type="submit"
            disabled={isAdding || !newCategoryName.trim()}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            data-testid="add-category-button"
          >
            {isAdding ? 'Əlavə edilir...' : 'Əlavə Et'}
          </button>
        </form>
      </div>

      {/* Mövcud kateqoriyalar */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Mövcud Kateqoriyalar
        </h3>
        
        {!Array.isArray(categoriesList) || categoriesList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Hələlik kateqoriya yoxdur</p>
        ) : (
          <div className="space-y-3">
            {categoriesList
              .sort((a, b) => {
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
                return orderA - orderB;
              })
              .map((category, index) => {
              // categoriesList can be array of strings or objects {id, name}
              const categoryName = typeof category === 'string' ? category : (category?.name || 'Unnamed');
              const categoryId = typeof category === 'object' && category?.id ? category.id : null;
              const categoryIcon = index === 0 ? '📱' : index === 1 ? '🔊' : index === 2 ? '📷' : index === 3 ? '❄️' : index === 4 ? '💻' : index === 5 ? '🖥️' : '🔌';
              
              return (
                <div 
                  key={categoryId || `cat-${index}-${categoryName}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  data-testid={`category-item-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{categoryIcon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{categoryName}</h4>
                      <p className="text-sm text-gray-500">
                        Sıra: {category.order || '—'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Toggle: Bütün məhsullarda göstər */}
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-xs text-gray-600">Bütün məhsullarda:</span>
                      <button
                        onClick={() => handleToggleIncludeInAll(category)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          category.includeInAllProducts !== false ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                        title={category.includeInAllProducts !== false ? 'Görünür' : 'Gizlidir'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            category.includeInAllProducts !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Yuxarı ox */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || isReordering}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      title="Yuxarı"
                    >
                      ↑
                    </button>
                    
                    {/* Aşağı ox */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === categoriesList.length - 1 || isReordering}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      title="Aşağı"
                    >
                      ↓
                    </button>
                    
                    {/* Sil düyməsi */}
                    <button
                      onClick={() => onDeleteCategory(categoryId, categoryName)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                      data-testid={`delete-category-${index}`}
                      title="Kateqoriyanı sil"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Məlumat qeydi */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-blue-800 text-sm">
          💡 <strong>Qeyd:</strong> Kateqoriyanı silmək üçün əvvəlcə həmin kateqoriyada olan bütün məhsulları silin və ya başqa kateqoriyaya köçürün.
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;