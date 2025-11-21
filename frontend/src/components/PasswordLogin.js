import React, { useState } from 'react';
import logo from '../assets/logo.png';

const ADMIN_PASSWORD = 'arazelectron2006';

const PasswordLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password === ADMIN_PASSWORD) {
      // Düzgün parol
      localStorage.setItem('adminAuthenticated', 'true');
      window.location.reload();
    } else {
      // Yanlış parol
      setError('Parol yanlışdır');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo və başlıq */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="Araz Elektron" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600">
            Daxil olmaq üçün parolu daxil edin
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Parol
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolu daxil edin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              autoFocus
              required
            />
          </div>

          {/* Error mesaj */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">
                ❌ {error}
              </p>
            </div>
          )}

          {/* Submit düyməsi */}
          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🔐 Daxil Ol
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            © 2024 Araz Elektron. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordLogin;
