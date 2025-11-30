import React, { useState, useEffect } from 'react';

const NotesTab = ({ notes, onAdd, onUpdate, onDelete, products }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormData, setProductFormData] = useState({ productId: '', quantity: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Hamısı');
  const [draftNote, setDraftNote] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      await onAdd({ ...formData, products: [] });
    }
    
    setFormData({ name: '', phone: '' });
    setShowForm(false);
  };

  const handleEdit = (note) => {
    setFormData({
      name: note.name,
      phone: note.phone || ''
    });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', phone: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === productFormData.productId);
    if (!product) return;

    // Check if product already exists
    const existingProduct = (draftNote.products || []).find(p => p.productId === product.id);
    if (existingProduct) {
      alert('⚠️ Bu məhsul artıq əlavə edilib! Sayı dəyişdirmək üçün mövcud məhsulu redaktə edin.');
      return;
    }

    const updatedProducts = [
      ...(draftNote.products || []),
      {
        productId: product.id,
        productName: product.name,
        quantity: parseInt(productFormData.quantity),
        customPrice: product.price // Default qiymət
      }
    ];

    const updatedNote = {
      ...draftNote,
      products: updatedProducts
    };
    
    setDraftNote(updatedNote);
    saveDraftToLocalStorage(updatedNote);

    setProductFormData({ productId: '', quantity: 1 });
    setShowProductForm(false);
  };

  const handleUpdatePrice = (productIndex, newPrice) => {
    const updatedProducts = draftNote.products.map((p, index) => 
      index === productIndex ? { ...p, customPrice: parseFloat(newPrice) } : p
    );
    
    const updatedNote = {
      ...draftNote,
      products: updatedProducts
    };
    
    setDraftNote(updatedNote);
    saveDraftToLocalStorage(updatedNote);
  };

  const handleSaveToFirestore = async () => {
    if (!draftNote) return;
    
    setIsSaving(true);
    try {
      await onUpdate(draftNote.id, { products: draftNote.products });
      
      // Clear localStorage draft
      const draftKey = `notesDraft_${draftNote.id}`;
      localStorage.removeItem(draftKey);
      
      // Update selected note
      setSelectedNote(draftNote);
      setHasUnsavedChanges(false);
      
      // Show success message
      alert('✅ Dəyişikliklər yadda saxlanıldı');
    } catch (error) {
      console.error('Saxlama xətası:', error);
      alert('❌ Saxlama zamanı xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProduct = (productIndex) => {
    const updatedProducts = draftNote.products.filter((_, index) => index !== productIndex);
    
    const updatedNote = {
      ...draftNote,
      products: updatedProducts
    };
    
    setDraftNote(updatedNote);
    saveDraftToLocalStorage(updatedNote);
  };

  // Load draft from localStorage when note is selected
  useEffect(() => {
    if (selectedNote) {
      const draftKey = `notesDraft_${selectedNote.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setDraftNote(draft);
          setHasUnsavedChanges(true);
        } catch (e) {
          setDraftNote(selectedNote);
          setHasUnsavedChanges(false);
        }
      } else {
        setDraftNote(selectedNote);
        setHasUnsavedChanges(false);
      }
    } else {
      setDraftNote(null);
      setHasUnsavedChanges(false);
    }
  }, [selectedNote]);

  // Save draft to localStorage
  const saveDraftToLocalStorage = (updatedNote) => {
    const draftKey = `notesDraft_${updatedNote.id}`;
    localStorage.setItem(draftKey, JSON.stringify(updatedNote));
    setHasUnsavedChanges(true);
  };

  const handleUpdateQuantity = (productIndex, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedProducts = draftNote.products.map((p, index) => 
      index === productIndex ? { ...p, quantity: parseInt(newQuantity) } : p
    );
    
    const updatedNote = {
      ...draftNote,
      products: updatedProducts
    };
    
    setDraftNote(updatedNote);
    saveDraftToLocalStorage(updatedNote);
  };

  const getTotalProductCount = (note) => {
    if (!note.products || note.products.length === 0) return 0;
    return note.products.reduce((sum, p) => sum + p.quantity, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {!selectedNote ? (
        <>
          {/* Contacts List */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Müştəri Qeydləri</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {showForm ? 'Bağla' : '+ Yeni Müştəri'}
            </button>
          </div>

          {/* Add Contact Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad / Müştəri
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Məsələn: Əli Məmmədov"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Nömrəsi
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Məsələn: +994 50 123 45 67"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingId ? 'Yenilə' : 'Əlavə Et'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Ləğv et
                </button>
              </div>
            </form>
          )}

          {/* Contacts List */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Hələ müştəri qeydi yoxdur</p>
                <p className="text-sm mt-2">Yuxarıdakı düymədən yeni müştəri əlavə edin</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{note.name}</h3>
                      {getTotalProductCount(note) > 0 && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                          {getTotalProductCount(note)} məhsul
                        </span>
                      )}
                    </div>
                    {note.phone && (
                      <p className="text-sm text-gray-600 mt-1">📱 {note.phone}</p>
                    )}
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(note)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Bu müştəri qeydini silmək istədiyinizə əminsiniz?')) {
                          onDelete(note.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Product Details View */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedNote(null)}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Geri
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{selectedNote.name}</h2>
            {selectedNote.phone && (
              <p className="text-gray-600 mt-1">📱 {selectedNote.phone}</p>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Məhsullar</h3>
            <div className="flex gap-3">
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveToFirestore}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saxlanır...
                    </>
                  ) : (
                    <>💾 Saxla</>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {showProductForm ? 'Bağla' : '+ Məhsul Əlavə Et'}
              </button>
            </div>
          </div>

          {/* Add Product Modal */}
          {showProductForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductForm(false);
                setProductFormData({ productId: '', quantity: 1 });
                setSearchTerm('');
                setSelectedCategory('Hamısı');
              }
            }}>
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Məhsul Seçin</h3>
                    <button
                      onClick={() => {
                        setShowProductForm(false);
                        setProductFormData({ productId: '', quantity: 1 });
                        setSearchTerm('');
                        setSelectedCategory('Hamısı');
                      }}
                      className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="🔍 Məhsul axtar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Categories */}
                <div className="px-6 py-3 border-b border-gray-200 overflow-x-auto">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCategory('Hamısı')}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === 'Hamısı'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Hamısı
                    </button>
                    {products && [...new Set(products.map(p => p.category))].map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products List */}
                <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: productFormData.productId ? '40vh' : '60vh' }}>
                  <div className="space-y-2">
                    {products && products
                      .filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedCategory === 'Hamısı' || p.category === selectedCategory;
                        return matchesSearch && matchesCategory;
                      })
                      .map(product => (
                        <div
                          key={product.id}
                          onClick={() => setProductFormData({ ...productFormData, productId: product.id })}
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            productFormData.productId === product.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Image */}
                          <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {product.image_urls && product.image_urls[0] ? (
                              <img
                                src={product.image_urls[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                N/A
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.category}</p>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-orange-600">{product.price.toFixed(2)} ₼</p>
                          </div>

                          {/* Selection Indicator */}
                          {productFormData.productId === product.id && (
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Modal Footer - Always Visible when product selected */}
                <div className={`p-6 border-t-2 border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 transition-all ${
                  productFormData.productId ? 'block' : 'hidden'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        📦 Say
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={productFormData.quantity}
                        onChange={(e) => setProductFormData({ ...productFormData, quantity: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-semibold"
                      />
                    </div>
                    <div className="flex-shrink-0 pt-7">
                      <button
                        onClick={handleAddProduct}
                        className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 font-bold text-lg shadow-lg"
                      >
                        ✓ Əlavə Et
                      </button>
                    </div>
                  </div>
                  {productFormData.productId && products && (
                    <div className="mt-3 text-sm text-gray-700">
                      <span className="font-semibold">Seçilən:</span> {products.find(p => p.id === productFormData.productId)?.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="space-y-3">
            {(!draftNote?.products || draftNote.products.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Hələ məhsul yoxdur</p>
                <p className="text-sm mt-2">Yuxarıdakı düymədən məhsul əlavə edin</p>
              </div>
            ) : (
              <>
                {draftNote?.products?.map((product, index) => {
                  // Find product details for image and price
                  const productDetails = products?.find(p => p.id === product.productId);
                  const totalPrice = productDetails ? productDetails.price * product.quantity : 0;
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {productDetails?.image_urls?.[0] ? (
                          <img
                            src={productDetails.image_urls[0]}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            N/A
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">{product.productName}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Say kontrolu */}
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Say</label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(index, product.quantity - 1)}
                                disabled={product.quantity <= 1}
                                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-bold transition-colors"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => handleUpdateQuantity(index, e.target.value)}
                                className="w-16 text-center px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-semibold"
                              />
                              <button
                                onClick={() => handleUpdateQuantity(index, product.quantity + 1)}
                                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Qiymət */}
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Qiymət</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={product.customPrice || (productDetails?.price || 0)}
                                onChange={(e) => handleUpdatePrice(index, e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-semibold text-sm"
                              />
                              <span className="text-sm text-gray-600">₼</span>
                            </div>
                          </div>

                          {/* Cəmi */}
                          <div>
                            <label className="text-xs text-gray-600 block mb-1">Cəmi</label>
                            <div className="text-xl font-bold text-orange-600">
                              {((product.customPrice || productDetails?.price || 0) * product.quantity).toFixed(2)} ₼
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
                            handleRemoveProduct(index);
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex-shrink-0"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  );
                })}

                {/* Total Amount */}
                <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-500 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Ümumi Məbləğ:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {(draftNote?.products || []).reduce((total, product) => {
                        const productDetails = products?.find(p => p.id === product.productId);
                        return total + (productDetails ? productDetails.price * product.quantity : 0);
                      }, 0).toFixed(2)} ₼
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotesTab;
