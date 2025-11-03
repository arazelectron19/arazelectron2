import React, { useState, useEffect } from 'react';
import { isSessionUnlocked, initializePassword } from './passwordStore';
import PasswordModal from './PasswordModal';

/**
 * AdminRoute - Hard Route Guard for Admin Panel
 * Blocks rendering until user is authenticated
 */
const AdminRoute = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Initialize password system
    await initializePassword();
    
    // Check if session is unlocked
    const unlocked = isSessionUnlocked();
    setIsUnlocked(unlocked);
    setIsChecking(false);
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  // Show nothing while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yoxlanılır...</p>
        </div>
      </div>
    );
  }

  // If not unlocked, show password modal and BLOCK admin
  if (!isUnlocked) {
    return <PasswordModal onUnlock={handleUnlock} />;
  }

  // Unlocked - render admin panel
  return <>{children}</>;
};

export default AdminRoute;
