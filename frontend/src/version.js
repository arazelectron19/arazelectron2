// Global app version for cache busting
export const APP_VERSION = "5";

// Clear all caches and storage if version mismatch
export const checkAndClearCache = () => {
  const storedVersion = localStorage.getItem('APP_VERSION');
  
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 Version mismatch: ${storedVersion} → ${APP_VERSION}. Clearing cache...`);
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear IndexedDB
    if (window.indexedDB) {
      window.indexedDB.databases().then(databases => {
        databases.forEach(db => {
          window.indexedDB.deleteDatabase(db.name);
          console.log(`🗑️ Deleted IndexedDB: ${db.name}`);
        });
      }).catch(err => console.warn('IndexedDB clear failed:', err));
    }
    
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('🗑️ Unregistered service worker');
        });
      });
    }
    
    // Set new version
    localStorage.setItem('APP_VERSION', APP_VERSION);
    
    console.log('✅ Cache cleared, new version set:', APP_VERSION);
    return true; // Cache was cleared
  }
  
  return false; // No clear needed
};
