// Global app version for cache busting
export const APP_VERSION = "17";

// Hard refresh if version mismatch
export const hardRefreshIfNeeded = async () => {
  try {
    // Unregister all service workers first
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      console.log('🗑️ Service workers unregistered');
    }
    
    const stored = localStorage.getItem('APP_VERSION');
    if (stored !== APP_VERSION) {
      console.log(`🔄 Version mismatch: ${stored} → ${APP_VERSION}. Hard refresh...`);
      
      // Preserve system access token
      const sysToken = localStorage.getItem('sys_acc_grntd');
      
      // Clear storages
      localStorage.clear();
      
      // Restore system token
      if (sysToken) {
        localStorage.setItem('sys_acc_grntd', sysToken);
      }
      
      // Best-effort IndexedDB wipe
      if (window.indexedDB) {
        const dbs = await indexedDB.databases?.() || [];
        await Promise.all(dbs.map(d => d.name && new Promise(res => {
          const req = indexedDB.deleteDatabase(d.name);
          req.onsuccess = req.onerror = req.onblocked = () => res();
        })));
        console.log('🗑️ IndexedDB cleared');
      }
      
      localStorage.setItem('APP_VERSION', APP_VERSION);
      
      // Hard reload with version query - preserve hash
      console.log('♻️ Hard reloading...');
      const hash = window.location.hash || '';
      window.location.replace(window.location.pathname + '?v=' + APP_VERSION + hash);
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
