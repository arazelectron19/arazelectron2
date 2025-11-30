import React, { useState, useEffect } from "react";
import { mockAPI } from "./mockAPI";
import { firestoreService } from "./firestoreService";
import { APP_VERSION, hardRefreshIfNeeded } from "./version";
import logo from "./assets/logo.png";
import SystemVerify from "./components/SystemVerify";
import NotesTab from "./components/NotesTab";

// Data Management System
const DataManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
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
  const [cleanupData, setCleanupData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
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
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedProducts, setHighlightedProducts] = useState(new Set());
  const [searchMessage, setSearchMessage] = useState('');
  const productRefs = React.useRef({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [newCategoryNameForRename, setNewCategoryNameForRename] = useState('');
  const [renameError, setRenameError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkChangeCategoryModal, setShowBulkChangeCategoryModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSubCategory, setBulkSubCategory] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState({ name: '', productCount: '', note: '' });
  const [editingNote, setEditingNote] = useState(null);
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

  // Check localStorage on mount
  useEffect(() => {
    // First check version (only once on mount)
    hardRefreshIfNeeded().then(reloaded => {
      if (!reloaded) {
        // Check system access
        const isAuth = localStorage.getItem("sys_acc_grntd") === "true";
        if (isAuth) {
          setIsAuthenticated(true);
        }
      }
    });
  }, []);

  // Authentication success callback - Parol düzgün olduqda çağırılır
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [activeTab, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load from Firestore
      const categoriesData = await firestoreService.getCategories();
      setCategories(categoriesData || []);

      if (activeTab === 'products') {
        const productsData = await firestoreService.getProducts();
        setProducts(productsData || []);
        setDisplayedProducts(productsData || []);
        setHasUnsavedOrder(false);
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
      } else if (activeTab === 'notes') {
        const notesData = await firestoreService.getNotes();
        setNotes(notesData || []);
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

  // Notes functions
  const handleAddNote = async (noteData) => {
    try {
      const newNote = await firestoreService.addNote(noteData);
      setNotes([...notes, newNote]);
    } catch (error) {
      console.error('Qeyd əlavə edilərkən xəta:', error);
      alert('Qeyd əlavə edilərkən xəta baş verdi');
    }
  };

  const handleUpdateNote = async (noteId, noteData) => {
    try {
      await firestoreService.updateNote(noteId, noteData);
      setNotes(notes.map(note => 
        note.id === noteId ? { ...note, ...noteData } : note
      ));
    } catch (error) {
      console.error('Qeyd yenilənərkən xəta:', error);
      alert('Qeyd yenilənərkən xəta baş verdi');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await firestoreService.deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Qeyd silinərkən xəta:', error);
      alert('Qeyd silinərkən xəta baş verdi');
    }
  };

  const handleMoveProductUp = (productIndex, sortedProducts) => {
    if (productIndex === 0) return;
    
    const currentProduct = sortedProducts[productIndex];
    const previousProduct = sortedProducts[productIndex - 1];
    
    // Yalnız eyni kateqoriyada yer dəyişsin
    if (currentProduct.category !== previousProduct.category) {
      return;
    }
    
    // Create new array with swapped order values
    const updatedProducts = displayedProducts.map(p => {
      if (p.id === currentProduct.id) {
        // Current product gets previous product's order
        return { ...p, order: (previousProduct.order !== undefined ? previousProduct.order : 999) };
      } else if (p.id === previousProduct.id) {
        // Previous product gets current product's order
        return { ...p, order: (currentProduct.order !== undefined ? currentProduct.order : 999) };
      }
      return p;
    });
    
    setDisplayedProducts(updatedProducts);
    setHasUnsavedOrder(true);
  };

  const handleMoveProductDown = (productIndex, sortedProducts) => {
    if (productIndex === sortedProducts.length - 1) return;
    
    const currentProduct = sortedProducts[productIndex];
    const nextProduct = sortedProducts[productIndex + 1];
    
    // Yalnız eyni kateqoriyada yer dəyişsin
    if (currentProduct.category !== nextProduct.category) {
      return;
    }
    
    // Create new array with swapped order values
    const updatedProducts = displayedProducts.map(p => {
      if (p.id === currentProduct.id) {
        // Current product gets next product's order
        return { ...p, order: (nextProduct.order !== undefined ? nextProduct.order : 999) };
      } else if (p.id === nextProduct.id) {
        // Next product gets current product's order
        return { ...p, order: (currentProduct.order !== undefined ? currentProduct.order : 999) };
      }
      return p;
    });
    
    setDisplayedProducts(updatedProducts);
    setHasUnsavedOrder(true);
  };

  const handleSaveProductOrder = async () => {
    try {
      setLoading(true);
      
      // First, sort the displayed products to get the correct order
      const sortedProducts = [...displayedProducts].sort((a, b) => {
        // Compare categories first
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        // Then compare by order within same category
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        return orderA - orderB;
      });
      
      // Assign sequential order numbers to each product within its category
      let categoryGroups = {};
      sortedProducts.forEach(product => {
        if (!categoryGroups[product.category]) {
          categoryGroups[product.category] = [];
        }
        categoryGroups[product.category].push(product);
      });
      
      // Batch update all products with new sequential order values
      const updatePromises = [];
      Object.keys(categoryGroups).forEach(category => {
        categoryGroups[category].forEach((product, index) => {
          updatePromises.push(
            firestoreService.updateProduct(product.id, { order: index })
          );
        });
      });
      
      await Promise.all(updatePromises);
      
      alert('✅ Sıralama yadda saxlanıldı!');
      setHasUnsavedOrder(false);
      loadData();
    } catch (error) {
      console.error('Save order error:', error);
      alert('❌ Saxlama zamanı xəta baş verdi!');
    } finally {
      setLoading(false);
    }
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
        order: formData.order || 999,
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
      order: product.order || 999,
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

  const addCategory = async (categoryName, parentId = null) => {
    if (!categoryName.trim()) {
      setAddCategoryError('Kateqoriya adını daxil edin!');
      setShowAddCategoryModal(true);
      return;
    }

    setAddCategoryError(null);
    setAddCategorySuccess(false);

    try {
      // Use Firestore
      await firestoreService.addCategory(categoryName.trim(), parentId);
      
      setAddCategorySuccess(true);
      setShowAddCategoryModal(true);
      setTimeout(() => {
        setShowAddCategoryModal(false);
        setShowAddSubCategoryModal(false);
        setAddCategorySuccess(false);
        setSelectedParentCategory(null);
        loadData(); // Reload categories
      }, 1500);
    } catch (error) {
      console.error('Kateqoriya əlavə etmə xətası:', error);
      setAddCategoryError('Kateqoriya əlavə etmə zamanı xəta baş verdi: ' + error.message);
      setShowAddCategoryModal(true);
    }
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getParentCategories = () => {
    return categoriesList.filter(cat => !cat.parentId);
  };

  const getSubCategories = (parentId) => {
    return categoriesList.filter(cat => cat.parentId === parentId);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setHighlightedProducts(new Set());
      setSearchMessage('');
      return;
    }

    const searchTerm = query.toLowerCase();
    const matchedIds = new Set();
    let firstMatchId = null;

    displayedProducts.forEach((product) => {
      const nameMatch = product.name?.toLowerCase().includes(searchTerm);
      const skuMatch = product.sku?.toLowerCase().includes(searchTerm);
      const codeMatch = product.code?.toLowerCase().includes(searchTerm);
      const categoryMatch = product.category?.toLowerCase().includes(searchTerm);
      
      if (nameMatch || skuMatch || codeMatch || categoryMatch) {
        matchedIds.add(product.id);
        if (!firstMatchId) {
          firstMatchId = product.id;
        }
      }
    });

    setHighlightedProducts(matchedIds);

    if (matchedIds.size === 0) {
      setSearchMessage('Heç bir uyğun məhsul tapılmadı');
    } else {
      setSearchMessage('');
      
      // Scroll to first match
      if (firstMatchId && productRefs.current[firstMatchId]) {
        productRefs.current[firstMatchId].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedProducts(new Set());
      }, 2000);
    }
  };

  const handleRenameCategory = (category) => {
    setRenamingCategory(category);
    setNewCategoryNameForRename(category.name);
    setRenameError('');
  };

  const handleSaveRename = async () => {
    if (!renamingCategory) return;

    const trimmedName = newCategoryNameForRename.trim();
    
    // Validation: empty name
    if (!trimmedName) {
      setRenameError('Kateqoriya adı boş ola bilməz');
      return;
    }

    // Validation: same name (no change)
    if (trimmedName === renamingCategory.name) {
      setRenamingCategory(null);
      setNewCategoryNameForRename('');
      setRenameError('');
      return;
    }

    // Validation: duplicate name under same parent
    const siblings = categories.filter(cat => cat.parentId === renamingCategory.parentId && cat.id !== renamingCategory.id);
    const duplicateExists = siblings.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    
    if (duplicateExists) {
      setRenameError('Bu adda kateqoriya artıq mövcuddur');
      return;
    }

    setIsRenaming(true);
    try {
      await firestoreService.updateCategoryName(renamingCategory.id, trimmedName);
      
      // Update local state
      const updatedCategories = categories.map(cat => 
        cat.id === renamingCategory.id ? { ...cat, name: trimmedName } : cat
      );
      setCategories(updatedCategories);
      setCategoriesList(updatedCategories);

      // Trigger updates in other components
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      // Close modal
      setRenamingCategory(null);
      setNewCategoryNameForRename('');
      setRenameError('');
      
      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Kateqoriya adını dəyişmə xətası:', error);
      setRenameError('Dəyişiklik zamanı xəta baş verdi: ' + error.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCancelRename = () => {
    setRenamingCategory(null);
    setNewCategoryNameForRename('');
    setRenameError('');
  };

  const scanDatabase = async () => {
    setIsScanning(true);
    try {
      // Get all categories and products
      const allCategories = await firestoreService.getCategories();
      const allProducts = await firestoreService.getProducts();
      
      // Create category ID map
      const categoryIdMap = new Map();
      allCategories.forEach(cat => {
        categoryIdMap.set(cat.id, cat);
      });

      // Find orphaned products (products with non-existent category)
      const orphanedProducts = allProducts.filter(product => {
        if (!product.category) return false;
        // Check if category exists by name
        const categoryExists = allCategories.some(cat => cat.name === product.category);
        return !categoryExists;
      });

      // Find unused categories (categories with no products)
      const categoryUsage = {};
      allCategories.forEach(cat => {
        categoryUsage[cat.name] = 0;
      });

      allProducts.forEach(product => {
        if (product.category && categoryUsage[product.category] !== undefined) {
          categoryUsage[product.category]++;
        }
      });

      // Find categories with invalid parent references
      const invalidParentCategories = allCategories.filter(cat => {
        if (!cat.parentId) return false;
        return !categoryIdMap.has(cat.parentId);
      });

      setCleanupData({
        totalCategories: allCategories.length,
        totalProducts: allProducts.length,
        orphanedProducts,
        categoryUsage,
        invalidParentCategories,
        allCategories
      });

    } catch (error) {
      console.error('Scan error:', error);
      alert('❌ Scan zamanı xəta baş verdi: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const cleanupDatabase = async () => {
    if (!cleanupData) return;

    const confirmMessage = `
Təmizlik əməliyyatı:
- ${cleanupData.orphanedProducts.length} orphaned məhsul düzəldiləcək
- ${cleanupData.invalidParentCategories.length} etibarsız parent reference düzəldiləcək

Davam etmək istəyirsiniz?`;

    if (!window.confirm(confirmMessage)) return;

    setIsCleaning(true);
    try {
      let fixedProducts = 0;
      let fixedCategories = 0;

      // Fix orphaned products - set category to null
      for (const product of cleanupData.orphanedProducts) {
        await firestoreService.updateProduct(product.id, { category: null });
        fixedProducts++;
      }

      // Fix invalid parent references - set parentId to null
      for (const category of cleanupData.invalidParentCategories) {
        await firestoreService.updateCategory(category.id, { parentId: null });
        fixedCategories++;
      }

      alert(`✅ Təmizlik tamamlandı!

Düzəldilən məhsullar: ${fixedProducts}
Düzəldilən kateqoriyalar: ${fixedCategories}`);

      // Reload data
      await loadData();
      setCleanupData(null);

    } catch (error) {
      console.error('Cleanup error:', error);
      alert('❌ Təmizlik zamanı xəta baş verdi: ' + error.message);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allIds = new Set(displayedProducts.map(p => p.id));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const deletePromises = Array.from(selectedProducts).map(id => 
        firestoreService.deleteProduct(id)
      );
      
      await Promise.all(deletePromises);
      
      alert(`✅ ${selectedProducts.size} məhsul uğurla silindi!`);
      setShowBulkDeleteModal(false);
      setSelectedProducts(new Set());
      await loadData();
    } catch (error) {
      console.error('Bulk delete xətası:', error);
      alert('❌ Bəzi məhsulları silmək mümkün olmadı. Yenidən cəhd edin.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkChangeCategory = async () => {
    if (selectedProducts.size === 0 || !bulkCategory) return;

    setIsBulkProcessing(true);
    try {
      const updatePromises = Array.from(selectedProducts).map(id => 
        firestoreService.updateProduct(id, { 
          category: bulkCategory,
          subCategory: bulkSubCategory || null
        })
      );
      
      await Promise.all(updatePromises);
      
      alert(`✅ ${selectedProducts.size} məhsulun kateqoriyası dəyişdirildi!`);
      setShowBulkChangeCategoryModal(false);
      setSelectedProducts(new Set());
      setBulkCategory('');
      setBulkSubCategory('');
      await loadData();
    } catch (error) {
      console.error('Bulk change category xətası:', error);
      alert('❌ Bəzi məhsulların kateqoriyasını dəyişmək mümkün olmadı.');
    } finally {
      setIsBulkProcessing(false);
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
    return <SystemVerify onSuccess={handleAuthSuccess} />;
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
                Araz Elektron
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Clear access token
                  localStorage.removeItem("sys_acc_grntd");
                  // Reset state
                  setIsAuthenticated(false);
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
          <button
            onClick={() => setActiveTab('cleanup')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'cleanup' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            🔧 Təmizlik
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'notes' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📝 Qeydlər
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
              <div className="flex gap-3">
                {hasUnsavedOrder && (
                  <button
                    onClick={handleSaveProductOrder}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 disabled:bg-gray-400"
                  >
                    💾 Sıralamanı Saxla
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  data-testid="add-product-button"
                >
                  + Yeni Məhsul
                </button>
              </div>
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
                      {/* Əsas Kateqoriya */}
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Əsas Kateqoriya *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({
                            ...formData, 
                            category: e.target.value,
                            subCategory: '' // Reset subcategory when parent changes
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 mb-4"
                        data-testid="product-category-select"
                      >
                        <option value="">Əsas kateqoriya seçin...</option>
                        {getParentCategories().map(category => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                      {/* Alt Kateqoriya */}
                      {formData.category && (() => {
                        const selectedParent = categories.find(c => c.name === formData.category);
                        const subCats = selectedParent ? getSubCategories(selectedParent.id) : [];
                        
                        if (subCats.length === 0) return null;
                        
                        return (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Alt Kateqoriya (istəyə bağlı)
                            </label>
                            <select
                              value={formData.subCategory || ''}
                              onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Alt kateqoriya seçin...</option>
                              {subCats.map(subCat => (
                                <option key={subCat.id} value={subCat.name}>
                                  {subCat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
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

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Məhsulu axtarın..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    data-testid="product-search-input"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    title="Axtarışı təmizlə"
                  >
                    ✕ Təmizlə
                  </button>
                )}
              </div>
              {searchMessage && (
                <p className="mt-2 text-sm text-orange-600">
                  {searchMessage}
                </p>
              )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      Seçilmiş: {selectedProducts.size} məhsul
                    </span>
                    <button
                      onClick={() => setSelectedProducts(new Set())}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Seçimi ləğv et
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowBulkChangeCategoryModal(true)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      📁 Kateqoriyanı Dəyiş
                    </button>
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      🗑️ Toplu Sil
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200" data-testid="products-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={displayedProducts.length > 0 && selectedProducts.size === displayedProducts.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        title="Hamısını seç"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şəkil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Məhsul</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kateqoriya</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qiymət</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sıra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Sort displayedProducts: first by category, then by order
                    const sortedProducts = [...displayedProducts].sort((a, b) => {
                      // Compare categories first
                      if (a.category !== b.category) {
                        return a.category.localeCompare(b.category);
                      }
                      // Then compare by order within same category
                      const orderA = a.order !== undefined ? a.order : 999;
                      const orderB = b.order !== undefined ? b.order : 999;
                      return orderA - orderB;
                    });
                    
                    return sortedProducts.map((product, index) => {
                      const isHighlighted = highlightedProducts.has(product.id);
                      const isSelected = selectedProducts.has(product.id);
                      return (
                    <tr 
                      key={product.id} 
                      data-testid={`product-row-${product.id}`}
                      ref={(el) => productRefs.current[product.id] = el}
                      className={`transition-colors duration-300 ${isHighlighted ? 'bg-yellow-100' : isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>
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
                        {product.subCategory && (
                          <span className="text-gray-500">
                            {' / '}
                            <span className="text-orange-600">{product.subCategory}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                        {product.price.toFixed(2)} ₼
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMoveProductUp(index, sortedProducts)}
                            disabled={index === 0 || (index > 0 && sortedProducts[index - 1].category !== product.category)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs"
                            title="Yuxarı"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveProductDown(index, sortedProducts)}
                            disabled={index === sortedProducts.length - 1 || (index < sortedProducts.length - 1 && sortedProducts[index + 1].category !== product.category)}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs"
                            title="Aşağı"
                          >
                            ↓
                          </button>
                        </div>
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
                    );
                  });
                  })()}
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
            onRenameCategory={handleRenameCategory}
          />
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && !loading && (
          <NotesTab
            notes={notes}
            products={products}
            onAdd={handleAddNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
          />
        )}

        {/* Cleanup Tab */}
        {activeTab === 'cleanup' && !loading && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">🔧 Verilənlər Bazası Təmizliyi</h2>
            
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Verilənlər Bazasını Skan Et</h3>
              <p className="text-gray-600 mb-4">
                Bu alət verilənlər bazasında problemli məlumatları aşkar edir və düzəldir:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                <li>Mövcud olmayan kateqoriyalara aid məhsullar</li>
                <li>Etibarsız parent referansları olan kateqoriyalar</li>
                <li>İstifadə olunmayan kateqoriyalar</li>
              </ul>
              
              <button
                onClick={scanDatabase}
                disabled={isScanning}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Skan edilir...
                  </>
                ) : (
                  <>🔍 Skan Et</>
                )}
              </button>
            </div>

            {/* Scan Results */}
            {cleanupData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Skan Nəticələri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Ümumi Statistika</h4>
                    <p className="text-blue-800">Toplam Kateqoriya: {cleanupData.totalCategories}</p>
                    <p className="text-blue-800">Toplam Məhsul: {cleanupData.totalProducts}</p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Problemlər</h4>
                    <p className="text-red-800">Orphaned Məhsullar: {cleanupData.orphanedProducts.length}</p>
                    <p className="text-red-800">Etibarsız Parent Ref: {cleanupData.invalidParentCategories.length}</p>
                  </div>
                </div>

                {/* Orphaned Products */}
                {cleanupData.orphanedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">🔴 Orphaned Məhsullar</h4>
                    <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {cleanupData.orphanedProducts.map((product, index) => (
                        <div key={index} className="text-sm text-red-800 mb-1">
                          • {product.name} (Kateqoriya: "{product.category}")
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invalid Parent Categories */}
                {cleanupData.invalidParentCategories.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">🔴 Etibarsız Parent Referansları</h4>
                    <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {cleanupData.invalidParentCategories.map((category, index) => (
                        <div key={index} className="text-sm text-red-800 mb-1">
                          • {category.name} (Parent ID: {category.parentId})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Usage */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">📊 Kateqoriya İstifadəsi</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {Object.entries(cleanupData.categoryUsage).map(([categoryName, count], index) => (
                      <div key={index} className={`text-sm mb-1 ${count === 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                        • {categoryName}: {count} məhsul {count === 0 && '(İstifadə olunmur)'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cleanup Button */}
                {(cleanupData.orphanedProducts.length > 0 || cleanupData.invalidParentCategories.length > 0) && (
                  <button
                    onClick={cleanupDatabase}
                    disabled={isCleaning}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                  >
                    {isCleaning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Təmizlənir...
                      </>
                    ) : (
                      <>🧹 Problemləri Düzəlt</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename Category Modal */}
      {renamingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Kateqoriya Adını Dəyiş
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              <strong>{renamingCategory.name}</strong> kateqoriyasının adını dəyişin
            </p>
            
            <input
              type="text"
              value={newCategoryNameForRename}
              onChange={(e) => {
                setNewCategoryNameForRename(e.target.value);
                setRenameError('');
              }}
              placeholder="Yeni kateqoriya adı"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 mb-2"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isRenaming) {
                  handleSaveRename();
                }
              }}
            />

            {renameError && (
              <p className="text-red-600 text-sm mb-3">
                ⚠️ {renameError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelRename}
                disabled={isRenaming}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                disabled={isRenaming || !newCategoryNameForRename.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRenaming ? 'Saxlanılır...' : 'Saxla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Toplu Silmə
            </h3>
            <p className="text-gray-700 mb-6">
              <strong>{selectedProducts.size}</strong> məhsul silinəcək. Bu əməliyyat geri qaytarıla bilməz. Əminsiniz?
            </p>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
              >
                {isBulkProcessing ? 'Silinir...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Change Category Modal */}
      {showBulkChangeCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              📁 Kateqoriyanı Dəyiş
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              <strong>{selectedProducts.size}</strong> məhsulun kateqoriyası dəyişdiriləcək.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Əsas Kateqoriya
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => {
                    setBulkCategory(e.target.value);
                    setBulkSubCategory('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seçin...</option>
                  {getParentCategories().map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {bulkCategory && getSubCategories(categories.find(c => c.name === bulkCategory)?.id).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Kateqoriya (istəyə bağlı)
                  </label>
                  <select
                    value={bulkSubCategory}
                    onChange={(e) => setBulkSubCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Yoxdur</option>
                    {getSubCategories(categories.find(c => c.name === bulkCategory)?.id).map(subCat => (
                      <option key={subCat.id} value={subCat.name}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBulkChangeCategoryModal(false);
                  setBulkCategory('');
                  setBulkSubCategory('');
                }}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={handleBulkChangeCategory}
                disabled={isBulkProcessing || !bulkCategory}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
              >
                {isBulkProcessing ? 'Tətbiq edilir...' : 'Tətbiq et'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    addressLink: '',
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
                placeholder="050 XXX XX XX"
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
              Ünvan Linki (Google Maps və ya digər)
            </label>
            <input
              type="url"
              value={generalInfoForm.addressLink || ''}
              onChange={(e) => setGeneralInfoForm({...generalInfoForm, addressLink: e.target.value})}
              placeholder="https://maps.app.goo.gl/xxxx"
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


const CategoriesTab = ({ categoriesList, onAddCategory, onDeleteCategory, onRenameCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [selectedParentCategoryLocal, setSelectedParentCategoryLocal] = useState(null);
  const [showAddSubCategoryModalLocal, setShowAddSubCategoryModalLocal] = useState(false);
  const [expandedCategoriesLocal, setExpandedCategoriesLocal] = useState({});

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategoriesLocal(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getParentCategories = () => {
    return categoriesList.filter(cat => !cat.parentId);
  };

  const getSubCategories = (parentId) => {
    return categoriesList.filter(cat => cat.parentId === parentId);
  };

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

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!newSubCategoryName.trim() || !selectedParentCategoryLocal) return;
    
    setIsAdding(true);
    try {
      await onAddCategory(newSubCategoryName, selectedParentCategoryLocal.id);
      setNewSubCategoryName('');
      setShowAddSubCategoryModalLocal(false);
      setSelectedParentCategoryLocal(null);
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

  const handleMoveSubCategoryUp = async (parentId, subIndex, subCategories) => {
    if (subIndex === 0 || isReordering) return;
    
    setIsReordering(true);
    try {
      // Sort subcategories by order
      const sortedSubs = [...subCategories].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        return orderA - orderB;
      });
      
      // Swap with previous
      [sortedSubs[subIndex], sortedSubs[subIndex - 1]] = 
      [sortedSubs[subIndex - 1], sortedSubs[subIndex]];
      
      // Reassign order values
      const updatedSubs = sortedSubs.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        order: idx + 1
      }));
      
      // Update Firestore
      await firestoreService.updateCategoryOrders(updatedSubs);
      
      alert('✅ Alt kateqoriya sırası yeniləndi!');
      window.location.reload();
    } catch (error) {
      console.error('Alt kateqoriya sıra dəyişmə xətası:', error);
      alert('❌ Xəta baş verdi: ' + error.message);
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveSubCategoryDown = async (parentId, subIndex, subCategories) => {
    const sortedSubs = [...subCategories].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
    
    if (subIndex === sortedSubs.length - 1 || isReordering) return;
    
    setIsReordering(true);
    try {
      // Swap with next
      [sortedSubs[subIndex], sortedSubs[subIndex + 1]] = 
      [sortedSubs[subIndex + 1], sortedSubs[subIndex]];
      
      // Reassign order values
      const updatedSubs = sortedSubs.map((cat, idx) => ({
        id: cat.id,
        name: cat.name,
        order: idx + 1
      }));
      
      // Update Firestore
      await firestoreService.updateCategoryOrders(updatedSubs);
      
      alert('✅ Alt kateqoriya sırası yeniləndi!');
      window.location.reload();
    } catch (error) {
      console.error('Alt kateqoriya sıra dəyişmə xətası:', error);
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
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('products')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
          >
            📦 Bütün məhsullar
          </button>
          <button
            onClick={handleMigrateOrder}
            disabled={isMigrating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {isMigrating ? '⏳ Yenilənir...' : '🔧 Order Sahəsi Əlavə Et'}
          </button>
        </div>
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
            {getParentCategories()
              .sort((a, b) => {
                const orderA = a.order ?? 999;
                const orderB = b.order ?? 999;
                return orderA - orderB;
              })
              .map((category, index) => {
              const categoryName = typeof category === 'string' ? category : (category?.name || 'Unnamed');
              const categoryId = typeof category === 'object' && category?.id ? category.id : null;
              const categoryIcon = index === 0 ? '📱' : index === 1 ? '🔊' : index === 2 ? '📷' : index === 3 ? '❄️' : index === 4 ? '💻' : index === 5 ? '🖥️' : '🔌';
              const subCategories = getSubCategories(categoryId);
              const hasSubCategories = subCategories.length > 0;
              const isExpanded = expandedCategoriesLocal[categoryId];
              
              return (
                <div key={categoryId || `cat-${index}-${categoryName}`}>
                  {/* Əsas Kateqoriya */}
                  <div 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    data-testid={`category-item-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      {hasSubCategories && (
                        <button
                          onClick={() => toggleCategoryExpand(categoryId)}
                          className="text-gray-600 hover:text-orange-600"
                        >
                          <svg 
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                      <span className="text-2xl">{categoryIcon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{categoryName}</h4>
                          <button
                            onClick={() => onRenameCategory(category)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Adını dəyiş"
                          >
                            ✏️
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          Sıra: {category.order || '—'} | Alt kateqoriya: {subCategories.length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Alt kateqoriya əlavə et */}
                      <button
                        onClick={() => {
                          setSelectedParentCategoryLocal({ id: categoryId, name: categoryName });
                          setShowAddSubCategoryModalLocal(true);
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                        title="Alt kateqoriya əlavə et"
                      >
                        + Alt
                      </button>

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
                        disabled={index === getParentCategories().length - 1 || isReordering}
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

                  {/* Alt Kateqoriyalar */}
                  {hasSubCategories && isExpanded && (
                    <div className="ml-12 mt-2 space-y-2">
                      {(() => {
                        const sortedSubCategories = [...subCategories].sort((a, b) => {
                          const orderA = a.order ?? 999;
                          const orderB = b.order ?? 999;
                          return orderA - orderB;
                        });
                        
                        return sortedSubCategories.map((subCat, subIndex) => {
                          const subCategoryName = subCat?.name || 'Unnamed';
                          const subCategoryId = subCat?.id || null;
                          
                          return (
                            <div 
                              key={subCategoryId || `subcat-${subIndex}`}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-xl">↳</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium text-gray-800">{subCategoryName}</h5>
                                    <button
                                      onClick={() => onRenameCategory(subCat)}
                                      className="text-blue-600 hover:text-blue-800 text-xs"
                                      title="Adını dəyiş"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500">Sıra: {subCat.order || '—'}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {/* Alt kateqoriya əlavə et */}
                                <button
                                  onClick={() => {
                                    setSelectedParentCategoryLocal({ id: subCategoryId, name: subCategoryName });
                                    setShowAddSubCategoryModalLocal(true);
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                  title="Alt kateqoriya əlavə et"
                                >
                                  + Alt
                                </button>

                                {/* Toggle: Bütün məhsullarda göstər */}
                                <div className="flex items-center gap-2 mr-2">
                                  <span className="text-xs text-gray-600">Bütün məhsullarda:</span>
                                  <button
                                    onClick={() => handleToggleIncludeInAll(subCat)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                                      subCat.includeInAllProducts !== false ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                                    title={subCat.includeInAllProducts !== false ? 'Görünür' : 'Gizlidir'}
                                  >
                                    <span
                                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                        subCat.includeInAllProducts !== false ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Yuxarı ox */}
                                <button
                                  onClick={() => handleMoveSubCategoryUp(categoryId, subIndex, sortedSubCategories)}
                                  disabled={subIndex === 0 || isReordering}
                                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs"
                                  title="Yuxarı"
                                >
                                  ↑
                                </button>
                                
                                {/* Aşağı ox */}
                                <button
                                  onClick={() => handleMoveSubCategoryDown(categoryId, subIndex, sortedSubCategories)}
                                  disabled={subIndex === sortedSubCategories.length - 1 || isReordering}
                                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs"
                                  title="Aşağı"
                                >
                                  ↓
                                </button>

                                {/* Sil düyməsi */}
                                <button
                                  onClick={() => onDeleteCategory(subCategoryId, subCategoryName)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors text-sm"
                                  title="Alt kateqoriyanı sil"
                                >
                                  🗑️ Sil
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
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

      {/* Alt Kateqoriya Əlavə Et Modalı */}
      {showAddSubCategoryModalLocal && selectedParentCategoryLocal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Alt Kateqoriya Əlavə Et
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>{selectedParentCategoryLocal.name}</strong> kateqoriyası üçün alt kateqoriya
            </p>
            <form onSubmit={handleAddSubCategory}>
              <input
                type="text"
                value={newSubCategoryName}
                onChange={(e) => setNewSubCategoryName(e.target.value)}
                placeholder="Alt kateqoriya adını daxil edin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubCategoryModalLocal(false);
                    setSelectedParentCategoryLocal(null);
                    setNewSubCategoryName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !newSubCategoryName.trim()}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
                >
                  {isAdding ? 'Əlavə edilir...' : 'Əlavə et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManager;