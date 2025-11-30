import React, { useState } from "react";
import logo from "../assets/logo.png";
import { getFunctions, httpsCallable } from "firebase/functions";

const PasswordLoginOTP = () => {
  const [step, setStep] = useState(1); // 1: Telegram düyməsi, 2: OTP input
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const functions = getFunctions();

  // Telegram-a OTP göndər
  const handleRequestOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const requestOtp = httpsCallable(functions, "requestAdminOtp");
      const result = await requestOtp();

      if (result.data.success) {
        setSuccess("Kod Telegram-a göndərildi! ✅");
        setStep(2); // OTP input addımına keç
      } else {
        setError("Kod göndərilə bilmədi");
      }
    } catch (err) {
      console.error("OTP request xətası:", err);
      setError("Telegram-a göndərmə xətası");
    } finally {
      setLoading(false);
    }
  };

  // OTP-ni yoxla
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const verifyOtp = httpsCallable(functions, "verifyAdminOtp");
      const result = await verifyOtp({ code: otp });

      if (result.data.success) {
        setSuccess("Kod təsdiqləndi! Yönləndirilir... ✅");
        
        // Admin authentication
        localStorage.setItem("adminAuthenticated", "true");
        window.location.href = "#/araz79";
        
        // 50ms sonra reload
        setTimeout(() => {
          window.location.reload();
        }, 50);
      } else {
        setError(result.data.message || "Kod yanlışdır");
        setOtp("");
      }
    } catch (err) {
      console.error("OTP verify xətası:", err);
      setError("Kod yoxlanarkən xəta baş verdi");
      setOtp("");
    } finally {
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
          Admin Panel
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          {step === 1
            ? "Telegram ilə təhlükəsiz giriş"
            : "Telegram-dan gələn kodu daxil edin"}
        </p>

        {/* Addım 1: Telegram düyməsi */}
        {step === 1 && (
          <div className="space-y-4">
            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <>⏳ Göndərilir...</>
              ) : (
                <>
                  <span className="text-2xl">📱</span>
                  Telegram ilə Giriş
                </>
              )}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>🔒 Birdəfəlik kod sizin Telegram-ınıza göndəriləcək</p>
              <p>⏰ Kod 5 dəqiqə ərzində etibarlıdır</p>
            </div>
          </div>
        )}

        {/* Addım 2: OTP input */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram-dan gələn 6 rəqəmli kod
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                autoFocus
                pattern="[0-9]{6}"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {loading ? "⏳ Yoxlanılır..." : "🔒 Təsdiqlə"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-gray-600 hover:text-gray-800 text-sm py-2"
            >
              ← Geri qayıt
            </button>
          </form>
        )}

        {/* Success mesajı */}
        {success && (
          <div className="mt-4 text-sm text-green-600 text-center bg-green-50 py-3 rounded-lg font-medium">
            {success}
          </div>
        )}

        {/* Error mesajı */}
        {error && (
          <div className="mt-4 text-sm text-red-600 text-center bg-red-50 py-3 rounded-lg font-medium">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 text-center">
          © 2024 Araz Elektron. Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  );
};

export default PasswordLoginOTP;
