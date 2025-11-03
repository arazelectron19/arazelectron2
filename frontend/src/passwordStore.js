// Password Store - Client-side password management
// Uses SHA-256 hash stored in localStorage

const STORAGE_KEYS = {
  PASSWORD_HASH: 'ae_admin_pwd_hash',
  SESSION_UNLOCKED: 'ae_admin_unlocked',
  FAILED_ATTEMPTS: 'ae_admin_attempts',
  LOCK_UNTIL: 'ae_admin_lock_until',
  FIRST_LOGIN: 'ae_admin_first_login'
};

const DEFAULT_PASSWORD = 'admin000';

// SHA-256 hash function using Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Password validation
export function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Parol daxil edilməlidir');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Minimum 8 simvol tələb olunur');
  }
  
  if (password.length > 32) {
    errors.push('Maksimum 32 simvol');
  }
  
  // Must have at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Ən azı 1 hərf tələb olunur');
  }
  
  // Must have at least one digit
  if (!/[0-9]/.test(password)) {
    errors.push('Ən azı 1 rəqəm tələb olunur');
  }
  
  // Only allow specific characters
  if (!/^[a-zA-Z0-9_\-\.@!#$]+$/.test(password)) {
    errors.push('Yalnız hərflər, rəqəmlər və _ - . @ ! # $ simvolları istifadə edilə bilər');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Initialize password hash (first time setup)
export async function initializePassword() {
  const storedHash = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
  
  if (!storedHash) {
    // Set default password hash
    const defaultHash = await hashPassword(DEFAULT_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, defaultHash);
    localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN, 'true');
    console.log('✅ Default password initialized');
  }
}

// Verify password
export async function verifyPassword(password) {
  const storedHash = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
  
  if (!storedHash) {
    await initializePassword();
    return verifyPassword(password);
  }
  
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

// Change password
export async function changePassword(currentPassword, newPassword) {
  // Verify current password
  const isCurrentValid = await verifyPassword(currentPassword);
  
  if (!isCurrentValid) {
    return { success: false, error: 'Cari parol yanlışdır' };
  }
  
  // Validate new password
  const validation = validatePassword(newPassword);
  
  if (!validation.valid) {
    return { success: false, error: validation.errors[0] };
  }
  
  // Set new password hash
  const newHash = await hashPassword(newPassword);
  localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, newHash);
  localStorage.removeItem(STORAGE_KEYS.FIRST_LOGIN);
  
  return { success: true };
}

// Session management
export function isSessionUnlocked() {
  return sessionStorage.getItem(STORAGE_KEYS.SESSION_UNLOCKED) === 'true';
}

export function unlockSession() {
  sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true');
}

export function lockSession() {
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED);
}

export function isFirstLogin() {
  return localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN) === 'true';
}

// Failed attempts tracking
export function getFailedAttempts() {
  const attempts = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
  return attempts ? parseInt(attempts, 10) : 0;
}

export function incrementFailedAttempts() {
  const current = getFailedAttempts();
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, newCount.toString());
  
  // Lock after 5 attempts
  if (newCount >= 5) {
    const lockUntil = Date.now() + (60 * 1000); // 60 seconds
    localStorage.setItem(STORAGE_KEYS.LOCK_UNTIL, lockUntil.toString());
  }
  
  return newCount;
}

export function resetFailedAttempts() {
  localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
  localStorage.removeItem(STORAGE_KEYS.LOCK_UNTIL);
}

export function isLocked() {
  const lockUntil = localStorage.getItem(STORAGE_KEYS.LOCK_UNTIL);
  
  if (!lockUntil) {
    return { locked: false, remainingSeconds: 0 };
  }
  
  const lockTime = parseInt(lockUntil, 10);
  const now = Date.now();
  
  if (now >= lockTime) {
    // Lock expired
    resetFailedAttempts();
    return { locked: false, remainingSeconds: 0 };
  }
  
  const remainingMs = lockTime - now;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  
  return { locked: true, remainingSeconds };
}

// Reset all (for development/testing)
export function resetAll() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  console.log('🔄 Password system reset');
}
