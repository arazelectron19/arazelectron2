// Global app version for cache busting
export const APP_VERSION = "6";

// Hard refresh if version mismatch
export const hardRefreshIfNeeded = async () => {
  try {
    const stored = localStorage.getItem('APP_VERSION');
    if (stored !== APP_VERSION) {
      console.log(`🔄 Version mismatch: ${stored} → ${APP_VERSION}. Hard refresh...`);
      
      // Clear storages
      localStorage.clear();
      
      // Best-effort wipe of IndexedDB
      if (window.indexedDB) {
        const dbs = await indexedDB.databases?.() || [];
        await Promise.all(dbs.map(d => d.name && new Promise(res => {
          const req = indexedDB.deleteDatabase(d.name);
          req.onsuccess = req.onerror = req.onblocked = () => res();
        })));
        console.log('🗑️ IndexedDB cleared');
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
        console.log('🗑️ Service workers unregistered');
      }
      
      localStorage.setItem('APP_VERSION', APP_VERSION);
      
      // Hard reload once to pick fresh assets
      console.log('♻️ Hard reloading...');
      window.location.replace(window.location.pathname + '?v=' + APP_VERSION);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Version check failed:', e);
    return false;
  }
};

// Backward compatibility
export const checkAndClearCache = hardRefreshIfNeeded;
