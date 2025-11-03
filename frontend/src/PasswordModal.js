import React, { useState, useEffect } from 'react';
import {
  initializePassword,
  verifyPassword,
  validatePassword,
  unlockSession,
  isFirstLogin,
  getFailedAttempts,
  incrementFailedAttempts,
  resetFailedAttempts,
  isLocked,
  changePassword
} from './passwordStore';

const PasswordModal = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockInfo, setLockInfo] = useState({ locked: false, remainingSeconds: 0 });
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  useEffect(() => {
    // Initialize password on mount
    initializePassword();
    
    // Check lock status
    checkLockStatus();
    
    // Update countdown every second if locked
    const interval = setInterval(() => {
      checkLockStatus();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkLockStatus = () => {
    const status = isLocked();
    setLockInfo(status);
    
    if (status.locked) {
      setError(`5 səhv cəhddən sonra kilidləndiniz. ${status.remainingSeconds} saniyə gözləyin.`);
    } else if (error.includes('kilidləndiniz')) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (lockInfo.locked) {
      setError(`Kilidli. ${lockInfo.remainingSeconds} saniyə gözləyin.`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const isValid = await verifyPassword(password);
      
      if (isValid) {
        // Success!
        resetFailedAttempts();
        unlockSession();
        
        // Check if first login (default password)
        if (isFirstLogin()) {
          setShowChangePassword(true);
          setCurrentPassword(password);
        } else {
          onUnlock();
        }
      } else {
        // Failed
        const attempts = incrementFailedAttempts();
        const remaining = 5 - attempts;
        
        if (remaining > 0) {
          setError(`Parol yanlışdır. ${remaining} cəhd qalıb.`);
        } else {
          checkLockStatus();
        }
        
        setPassword('');
      }
    } catch (err) {
      setError('Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setChangePasswordError(validation.errors[0]);
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Parollar uyğun gəlmir');
      return;
    }
    
    // Check if same as current
    if (newPassword === currentPassword) {
      setChangePasswordError('Yeni parol köhnəsindən fərqli olmalıdır');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        // Password changed successfully!
        alert('✅ Parol uğurla dəyişdirildi!');
        setShowChangePassword(false);
        onUnlock();
      } else {
        setChangePasswordError(result.error);
      }
    } catch (err) {
      setChangePasswordError('Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  if (showChangePassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parolu dəyiş</h2>
          <p className="text-sm text-yellow-600 mb-6">
            ⚠️ İlk dəfə daxil olursunuz. Təhlükəsizlik üçün parolu dəyişin.
          </p>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni parol
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Minimum 8 simvol, hərf və rəqəm"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yeni parolu təkrar
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Parolu təkrar daxil edin"
                required
              />
            </div>
            
            {changePasswordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {changePasswordError}
              </div>
            )}
            
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Parol qaydaları:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 8-32 simvol</li>
                <li>• Ən azı 1 hərf (A-Z və ya a-z)</li>
                <li>• Ən azı 1 rəqəm (0-9)</li>
                <li>• İcazə verilən simvollar: _ - . @ ! # $</li>
              </ul>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Yüklənir...' : 'Parolu dəyiş'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin parolu</h2>
          <p className="text-sm text-gray-600">
            Admin panelinə daxil olmaq üçün parol daxil edin
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                placeholder="Parolu daxil edin"
                disabled={lockInfo.locked || loading}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {lockInfo.locked && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm text-center">
              ⏱️ Kilidli: <strong>{lockInfo.remainingSeconds}</strong> saniyə
            </div>
          )}
          
          <button
            type="submit"
            disabled={lockInfo.locked || loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Yoxlanır...' : 'Daxil ol'}
          </button>
          
          <div className="text-xs text-gray-500 text-center mt-4">
            İlk daxil olma üçün standart parol: <code className="bg-gray-100 px-2 py-1 rounded">admin000</code>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
