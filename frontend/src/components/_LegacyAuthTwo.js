import React, { useState } from "react";
import logo from "../assets/logo.png";

const ADMIN_PASSWORD = "arazelectron2006";
const EMERGENCY_CODE = "ArazSOS2025";
const FUNCTIONS_BASE_URL = "https://us-central1-araz-electron.cloudfunctions.net";

const PasswordLoginTwoStep = (props) => {
  const [step, setStep] = useState(1); // 1: Parol, 2: Telegram OTP
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  // OTP göndərmə state-ləri
  const [sendError, setSendError] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  // 1️⃣ MƏRHƏLƏ: Parol Yoxla
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password === ADMIN_PASSWORD) {
      // Parol düzgün - ikinci mərhələyə keç
      setStep(2);
      setSuccess("Parol düzgün! İndi təhlükəsizlik kodunu əldə edin.");
    } else {
      // Parol yanlış
      setError("Parol yanlışdır");
      setPassword("");
    }
  };

  // 2️⃣ MƏRHƏLƏ: Pipedream webhook - OTP göndər
  const handleRequestOtp = async () => {
    // State-ləri sıfırla və göndərməyə başla
    setSendError(false);
    setSendSuccess(false);
    setSending(true);

    try {
      // 6 rəqəmli random OTP yarat
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("OTP yaradıldı:", generatedOtp);
      
      // OTP-ni state-də saxla (verify üçün lazımdır)
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 dəqiqə
      setOtp(""); // Input-u təmizlə
      
      // SessionStorage-də saxla (verify function oxuyacaq)
      sessionStorage.setItem("admin_otp_code", generatedOtp);
      sessionStorage.setItem("admin_otp_expires", expiresAt.toString());
      
      console.log("Pipedream-ə göndərilir...");
      
      // Pipedream webhook-a göndər
      const response = await fetch("https://eogvcyblyf0ipj0.m.pipedream.net/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otp: generatedOtp })
      });

      if (!response.ok) {
        throw new Error("Pipedream server error");
      }

      const data = await response.json();
      console.log("Pipedream cavabı:", data);

      // Uğurlu göndərmə
      console.log("✅ Kod Pipedream vasitəsilə Telegram-a göndərildi!");
      setSendSuccess(true);
      setSendError(false);
      
    } catch (err) {
      // Network və ya server xətası
      console.error("❌ Kodu göndərmək mümkün olmadı:", err);
      setSendError(true);
      setSendSuccess(false);
    } finally {
      setSending(false);
    }
  };

  // 3️⃣ MƏRHƏLƏ: OTP yoxla (sessionStorage-dən)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      console.log("OTP yoxlanılır:", { code: otp });
      
      // SessionStorage-dən OTP məlumatlarını oxu
      const savedOtp = sessionStorage.getItem("admin_otp_code");
      const expiresAt = sessionStorage.getItem("admin_otp_expires");
      
      if (!savedOtp || !expiresAt) {
        setError("OTP tapılmadı. Yenidən kod göndərin.");
        setOtp("");
        setLoading(false);
        return;
      }
      
      // Vaxt yoxla
      const now = Date.now();
      if (now > parseInt(expiresAt)) {
        setError("Kodun vaxtı bitib (5 dəqiqə)");
        setOtp("");
        setLoading(false);
        return;
      }
      
      // Kod yoxla
      if (otp !== savedOtp) {
        // Emergency kod yoxla
        if (otp === EMERGENCY_CODE) {
          console.log("🆘 Emergency kod istifadə edildi");
          setSuccess("✅ Emergency kod təsdiqləndi! Admin panelə keçid...");
          
          localStorage.setItem("adminAuthenticated", "true");
          
          setTimeout(() => {
            window.location.href = "#/araz79";
          }, 500);
          return;
        }
        
        setError("Kod yanlışdır");
        setOtp("");
        setLoading(false);
        return;
      }
      
      // ✅ Kod düzgün - Admin panel açılır
      console.log("✅ Kod təsdiqləndi!");
      setSuccess("✅ Kod təsdiqləndi! Admin panelə yönləndirilirsiniz...");

      // OTP-ni istifadə olundu işarələ
      sessionStorage.removeItem("admin_otp_code");
      sessionStorage.removeItem("admin_otp_expires");
      
      // localStorage-də saxla və yönləndir
      localStorage.setItem("adminAuthenticated", "true");
      
      setTimeout(() => {
        window.location.href = "#/araz79";
      }, 500);
      
    } catch (err) {
      console.error("❌ Kod yoxlanarkən xəta:", err);
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
            ? "Mərhələ 1: Admin parolunu daxil edin"
            : "Mərhələ 2: Təhlükəsizlik kodunu təsdiqləyin"}
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6 gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 1
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            1
          </div>
          <div
            className={`w-16 h-1 ${
              step >= 2 ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step >= 2
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
        </div>

        {/* 1️⃣ MƏRHƏLƏ: Parol Input */}
        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Parolu
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Parolu daxil edin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "⏳ Yoxlanılır..." : "🔐 Növbəti Addım"}
            </button>
          </form>
        )}

        {/* 2️⃣ MƏRHƏLƏ: Telegram OTP */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Təhlükəsizlik kodu göndər düyməsi */}
            <button
              onClick={handleRequestOtp}
              disabled={sending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {sending ? (
                <>⏳ Göndərilir...</>
              ) : (
                <>
                  <span className="text-xl">🔐</span>
                  Təhlükəsizlik Kodu Göndər
                </>
              )}
            </button>
            
            {/* Uğurlu göndərmə mesajı */}
            {sendSuccess && (
              <div className="text-sm text-green-600 text-center bg-green-50 py-2 rounded-lg font-medium">
                ✅ Kod uğurla göndərildi!
              </div>
            )}
            
            {/* Xəta mesajı */}
            {sendError && (
              <div className="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg font-medium">
                ❌ Kodu göndərmək mümkün olmadı
              </div>
            )}

            {/* OTP input və təsdiqlə */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gələn Kodu Daxil Et
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                  pattern="[0-9]{6}"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? "⏳ Yoxlanılır..." : "✅ Təsdiqlə"}
              </button>
            </form>

            {/* Geri qayıt düyməsi */}
            <button
              onClick={() => {
                setStep(1);
                setPassword("");
                setOtp("");
                setError("");
                setSuccess("");
                setSendError(false);
                setSendSuccess(false);
                setSending(false);
              }}
              className="w-full text-gray-600 hover:text-gray-800 text-sm py-2"
            >
              ← Geri qayıt
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>🔒 Kod şəxsi kanalınıza göndərilir</p>
              <p>⏰ Kod 5 dəqiqə ərzində etibarlıdır</p>
            </div>
          </div>
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

export default PasswordLoginTwoStep;
