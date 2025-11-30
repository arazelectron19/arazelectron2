import React, { useState } from "react";
import logo from "../assets/logo.png";

// System verification key
const SYS_VRF_K = "arazelectron2006";

const SystemVerify = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password === SYS_VRF_K) {
      // Access granted
      localStorage.setItem("sys_acc_grntd", "true");
      
      // Trigger success callback
      if (onSuccess) {
        onSuccess();
      }
      
      setLoading(false);
    } else {
      // Invalid
      setError("Parol yanlışdır");
      setPassword("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Araz Elektron"
            className="mx-auto h-20 w-20 object-contain"
          />
        </div>

        {/* Başlıq */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Araz Elektron
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Giriş məlumatlarını daxil edin
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            🔒 {loading ? "Yüklənir..." : "Daxil Ol"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400 text-center">
          © 2024 Araz Elektron. Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  );
};

export default SystemVerify;
