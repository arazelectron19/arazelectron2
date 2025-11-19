import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Firestore Service - No LocalStorage
export const firestoreService = {
  // Categories
  async getCategories() {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  },

  async addCategory(name) {
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, name };
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  },

  async updateCategory(id, categoryData) {
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, categoryData);
      return { id, ...categoryData };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  /**
   * Batch update category orders
   * Updates all categories with their new order values
   */
  async updateCategoryOrders(categories) {
    try {
      const updatePromises = categories.map(category => {
        const categoryRef = doc(db, 'categories', category.id);
        return updateDoc(categoryRef, { order: category.order });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated ${categories.length} category orders`);
      return true;
    } catch (error) {
      console.error('Error updating category orders:', error);
      throw error;
    }
  },

  async deleteCategory(id) {
    try {
      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Products
  async getProducts() {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  },

  async addProduct(product) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...product };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  async updateProduct(id, updates) {
    try {
      await updateDoc(doc(db, 'products', id), updates);
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // ============= CONTACT INFO OPERATIONS =============
  
  /**
   * Get contact information from Firestore
   */
  async getContactInfo() {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Return default values if not found
      return {
        whatsapp: '',
        masters: '',
        sales: ''
      };
    } catch (error) {
      console.error('Error getting contact info:', error);
      return {
        whatsapp: '',
        masters: '',
        sales: ''
      };
    }
  },

  /**
   * Save contact information to Firestore
   */
  async saveContactInfo(contactData) {
    try {
      const docRef = doc(db, 'settings', 'contact');
      await setDoc(docRef, {
        whatsapp: contactData.whatsapp || '',
        masters: contactData.masters || '',
        sales: contactData.sales || '',
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error saving contact info:', error);
      throw error;
    }
  },

  // ============= CONTACTS OPERATIONS (New System) =============
  
  /**
   * Get all contacts from Firestore
   */
  async getContacts() {
    try {
      const contactsRef = collection(db, 'contacts');
      const snapshot = await getDocs(contactsRef);
      
      const contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return contacts;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },

  /**
   * Add a new contact
   */
  async addContact(contactData) {
    try {
      const contactsRef = collection(db, 'contacts');
      const docRef = await addDoc(contactsRef, {
        category: contactData.category,
        name: contactData.name,
        phone: contactData.phone,
        createdAt: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        ...contactData
      };
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  },

  /**
   * Update a contact
   */
  async updateContact(contactId, contactData) {
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await updateDoc(contactRef, {
        category: contactData.category,
        name: contactData.name,
        phone: contactData.phone,
        updatedAt: new Date().toISOString()
      });
      
      return {
        id: contactId,
        ...contactData
      };
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  },

  /**
   * Delete a contact
   */
  async deleteContact(contactId) {
    try {
      const contactRef = doc(db, 'contacts', contactId);
      await deleteDoc(contactRef);
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  },

  // ============= ORDERS OPERATIONS =============
  
  /**
   * Get all orders
   */
  async getOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const snapshot = await getDocs(ordersRef);
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by createdAt descending (newest first)
      orders.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      const ordersRef = collection(db, 'orders');
      
      // Generate 6-digit order code
      const orderCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const docRef = await addDoc(ordersRef, {
        code: orderCode,
        items: orderData.items,
        total: orderData.total,
        phone: orderData.phone,
        status: 'yeni',
        createdAt: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        code: orderCode,
        ...orderData,
        status: 'yeni'
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Delete an order
   */
  async deleteOrder(orderId) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await deleteDoc(orderRef);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
};
