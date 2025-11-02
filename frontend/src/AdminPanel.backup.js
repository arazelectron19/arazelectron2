import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const AdminPanel = () => {
  // Backend yoxdursa warning göstər
  const [showBackendWarning] = useState(!BACKEND_URL);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [categoriesList, setCategoriesList] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_urls: [''],
    stock: '',
    is_featured: false,
    specifications: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kateqoriyaları yüklə
      const categoriesResponse = await axios.get(`${API}/categories`);
      setCategories(categoriesResponse.data.categories);

      if (activeTab === 'products') {
        const productsResponse = await axios.get(`${API}/products`);
        setProducts(productsResponse.data);
      } else if (activeTab === 'orders') {
        const ordersResponse = await axios.get(`${API}/orders`);
        setOrders(ordersResponse.data);
      } else if (activeTab === 'contact') {
        const contactResponse = await axios.get(`${API}/contact-info`);
        setContactInfo(contactResponse.data);
      } else if (activeTab === 'categories') {
        const categoriesResponse = await axios.get(`${API}/categories/all`);
        setCategoriesList(categoriesResponse.data);
      }
    } catch (error) {
      console.error('Məlumat yükləmə xətası:', error);
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
      specifications: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: 100  // Default stok
      };

      if (editingProduct) {
        // Redaktə
        await axios.put(`${API}/products/${editingProduct.id}`, productData);
        alert('Məhsul güncəlləndi!');
      } else {
        // Yeni əlavə et
        await axios.post(`${API}/products`, productData);
        alert('Məhsul əlavə edildi!');
      }

      resetForm();
      loadData();
      
      // Ana səhifəyə məlumat ver ki, məhsulları yeniləsin
      localStorage.setItem('products-updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('products-updated'));
      
    } catch (error) {
      console.error('Məhsul əməliyyat xətası:', error);
      alert('Xəta baş verdi!');
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
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const response = await axios.post(`${API}/upload-image`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.full_url) {
        updateImageUrl(index, response.data.full_url);
        alert('Şəkil uğurla yükləndi!');
      }
    } catch (error) {
      console.error('Şəkil yükləmə xətası:', error);
      alert('Şəkil yükləmə zamanı xəta baş verdi!');
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
      console.log('API çağırışı:', `${API}/products/${productToDelete}`);
      const response = await axios.delete(`${API}/products/${productToDelete}`);
      console.log('Silmə cavabı:', response.data);
      
      // Uğurlu mesaj göstər
      alert('✅ Məhsul uğurla silindi!');
      
      // Məlumatları yenilə
      await loadData();
      
      // Ana səhifəyə məlumat ver
      localStorage.setItem('products-updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('products-updated'));
      
      console.log('Məhsul silindi və məlumatlar yeniləndi');
      
    } catch (error) {
      console.error('❌ Silmə xətası:', error);
      console.error('Xəta detalları:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Silmə zamanı xəta baş verdi!';
      alert('❌ Xəta: ' + errorMessage);
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
      await axios.put(`${API}/orders/${orderId}/status?status=${newStatus}`);
      alert('Status güncəlləndi!');
      loadData();
    } catch (error) {
      console.error('Status güncəlləmə xətası:', error);
    }
  };

  const handleContactUpdate = async (contactData) => {
    try {
      const response = await axios.put(`${API}/contact-info`, contactData);
      setContactInfo(response.data);
      alert('Əlaqə məlumatları güncəlləndi!');
      
      // Ana səhifəyə məlumat ver ki, əlaqə məlumatlarını yeniləsin
      localStorage.setItem('contact-updated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('contact-updated'));
      
    } catch (error) {
      console.error('Əlaqə güncəlləmə xətası:', error);
      alert('Güncəlləmə zamanı xəta baş verdi!');
    }
  };

  const addCategory = async (categoryName) => {
    if (!categoryName.trim()) {
      alert('Kateqoriya adını daxil edin!');
      return;
    }

    try {
      await axios.post(`${API}/categories`, { name: categoryName.trim() });
      alert('Kateqoriya əlavə edildi!');
      loadData(); // Kateqoriyaları yenilə
    } catch (error) {
      console.error('Kateqoriya əlavə etmə xətası:', error);
      alert(error.response?.data?.detail || 'Kateqoriya əlavə etmə zamanı xəta baş verdi!');
    }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`"${categoryName}" kateqoriyasını silmək istədiyinizə əminsiniz?`)) return;

    try {
      await axios.delete(`${API}/categories/${categoryId}`);
      alert('Kateqoriya silindi!');
      loadData(); // Kateqoriyaları yenilə
    } catch (error) {
      console.error('Kateqoriya silmə xətası:', error);
      alert(error.response?.data?.detail || 'Kateqoriya silmə zamanı xəta baş verdi!');
    }
  };

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

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://customer-assets.emergentagent.com/job_azdili-danis/artifacts/rs4w4vbq_AE.png" 
                alt="Araz Elektron Logo"
                className="h-10 w-10 mr-3 object-contain"
              />
              <h1 className="text-2xl font-bold text-orange-600">Araz Elektron - Admin Panel</h1>
            </div>
            <a href="/" className="text-orange-600 hover:text-orange-700">
              ← Ana səhifəyə qayıt
            </a>
          </div>
        </div>
      </header>

      {/* Backend Warning */}
      {showBackendWarning && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Backend əlaqəsi yoxdur</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Admin panel funksiyaları işləməyəcək (məhsul əlavə/redaktə/sil). Backend server lazımdır.</p>
                  <p className="mt-1">Ana səhifədə demo məhsullar görünəcək.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            Məhsullar ({products.length})
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
            Sifarişlər ({orders.length})
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
            Kateqoriyalar ({categoriesList.length})
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
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
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
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">Sifarişlər</h2>
            
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

// Contact Info Tab Component
const ContactInfoTab = ({ contactInfo, onContactUpdate }) => {
  const [formData, setFormData] = useState({
    contact_groups: {
      whatsapp: [{"name": "", "phone": ""}],
      ustalar: [{"name": "", "phone": ""}],
      satis: [{"name": "", "phone": ""}]
    },
    address_line1: '',
    address_line2: '',
    address_line3: '',
    work_hours: '',
    company_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contactInfo) {
      setFormData({
        contact_groups: contactInfo.contact_groups || {
          whatsapp: [{"name": "", "phone": ""}],
          ustalar: [{"name": "", "phone": ""}],
          satis: [{"name": "", "phone": ""}]
        },
        address_line1: contactInfo.address_line1 || '',
        address_line2: contactInfo.address_line2 || '',
        address_line3: contactInfo.address_line3 || '',
        work_hours: contactInfo.work_hours || '',
        company_description: contactInfo.company_description || ''
      });
    }
  }, [contactInfo]);

  const handleInputChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const updateContactInGroup = (groupName, index, field, value) => {
    const newGroups = { ...formData.contact_groups };
    newGroups[groupName][index][field] = value;
    setFormData({...formData, contact_groups: newGroups});
  };

  const addContactToGroup = (groupName) => {
    const newGroups = { ...formData.contact_groups };
    newGroups[groupName].push({"name": "", "phone": ""});
    setFormData({...formData, contact_groups: newGroups});
  };

  const removeContactFromGroup = (groupName, index) => {
    const newGroups = { ...formData.contact_groups };
    if (newGroups[groupName].length > 1) {
      newGroups[groupName].splice(index, 1);
      setFormData({...formData, contact_groups: newGroups});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onContactUpdate(formData);
    } catch (error) {
      console.error('Forma göndərmə xətası:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Əlaqə Məlumatları</h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* WhatsApp Qrupu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📱 WhatsApp</h3>
            {formData.contact_groups.whatsapp.map((contact, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ad"
                  value={contact.name}
                  onChange={(e) => updateContactInGroup('whatsapp', index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="+994 XX XXX XX XX"
                  value={contact.phone}
                  onChange={(e) => updateContactInGroup('whatsapp', index, 'phone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => addContactToGroup('whatsapp')}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  +
                </button>
                {formData.contact_groups.whatsapp.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactFromGroup('whatsapp', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ustalar Qrupu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">🔧 Ustalar</h3>
            {formData.contact_groups.ustalar.map((contact, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Usta adı (məs: Araz)"
                  value={contact.name}
                  onChange={(e) => updateContactInGroup('ustalar', index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="+994 XX XXX XX XX"
                  value={contact.phone}
                  onChange={(e) => updateContactInGroup('ustalar', index, 'phone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => addContactToGroup('ustalar')}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  +
                </button>
                {formData.contact_groups.ustalar.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactFromGroup('ustalar', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Satış Qrupu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">💼 Satış</h3>
            {formData.contact_groups.satis.map((contact, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Satış adı (məs: Satış şöbəsi)"
                  value={contact.name}
                  onChange={(e) => updateContactInGroup('satis', index, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text"
                  placeholder="+994 XX XXX XX XX"
                  value={contact.phone}
                  onChange={(e) => updateContactInGroup('satis', index, 'phone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => addContactToGroup('satis')}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  +
                </button>
                {formData.contact_groups.satis.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContactFromGroup('satis', index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ünvan və Digər */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">📍 Ünvan</h3>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Şəhər, rayon"
              />
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Küçə, bina"
              />
              <input
                type="text"
                value={formData.address_line3}
                onChange={(e) => handleInputChange('address_line3', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Poçt kodu, ölkə"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">ℹ️ Digər</h3>
              <input
                type="text"
                value={formData.work_hours}
                onChange={(e) => handleInputChange('work_hours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="İş saatları"
              />
              <textarea
                value={formData.company_description}
                onChange={(e) => handleInputChange('company_description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Şirkət təsviri"
              />
            </div>
          </div>

          {/* Saxla düyməsi */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:bg-gray-400"
              data-testid="save-contact-button"
            >
              {isSubmitting ? 'Saxlanılır...' : 'Əlaqə Məlumatlarını Saxla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Categories Tab Component
const CategoriesTab = ({ categoriesList, onAddCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Kateqoriya İdarəetməsi</h2>
      
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Mövcud Kateqoriyalar ({categoriesList.length})</h3>
        
        {categoriesList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Hələlik kateqoriya yoxdur</p>
        ) : (
          <div className="space-y-3">
            {categoriesList.map((category, index) => (
              <div 
                key={category.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                data-testid={`category-item-${category.id}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{index === 0 ? '📱' : index === 1 ? '💻' : index === 2 ? '📷' : index === 3 ? '❄️' : index === 4 ? '💻' : index === 5 ? '🖥️' : '🔌'}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                    <p className="text-sm text-gray-500">ID: {category.id.slice(-8)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteCategory(category.id, category.name)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                  data-testid={`delete-category-${category.id}`}
                  title="Kateqoriyanı sil"
                >
                  🗑️ Sil
                </button>
              </div>
            ))}
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