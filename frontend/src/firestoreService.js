import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where
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
  }
};
