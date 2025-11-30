const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Firebase Admin SDK initialize
admin.initializeApp();
const db = admin.firestore();

// Telegram konfiqurasiyası - backend ilə eyni
const TELEGRAM_BOT_TOKEN = functions.config().telegram?.bot_token || 
                           process.env.TELEGRAM_BOT_TOKEN || 
                           "7599107546:AAHqhn-Fj4dQm-d8baGlqfvyFuaxj6CSDqs";
const TELEGRAM_CHAT_ID = functions.config().telegram?.chat_id || 
                         process.env.TELEGRAM_CHAT_ID || 
                         "1809057644";

/**
 * OTP Tələb Et - Random 6 rəqəmli kod yaradır və Telegram-a göndərir
 * CORS ilə HTTP request
 */
exports.requestAdminOtp = functions.https.onRequest(async (req, res) => {
  // CORS headers əlavə et
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log("=== requestAdminOtp başladı ===");
    console.log("Request method:", req.method);
    console.log("Request body:", req.body);
    
    // 6 rəqəmli random OTP yarat
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("OTP yaradıldı:", code);
    
    // Firestore-da saxla
    await db.collection("admin-otp").doc("current").set({
      code: code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 dəqiqə
      used: false
    });
    console.log("OTP Firestore-da saxlanıldı");
    
    // Telegram API URL - işləyən format
    const telegramUrl = "https://api.telegram.org/bot7599107546:AAHqhn-Fj4dQm-d8baGlqfvyFuaxj6CSDqs/sendMessage";
    
    // Mesaj
    const messageText = `🔐 Araz Elektron admin təhlükəsizlik kodu: ${code}\n\n⏰ 5 dəqiqə ərzində etibarlıdır`;
    
    console.log("Telegram-a göndərilir...");
    
    // POST request
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: "1809057644",
        text: messageText
      })
    });
    
    const result = await response.json();
    console.log("Telegram cavabı:", JSON.stringify(result));
    
    // Telegram cavabını yoxla
    if (result.ok === true) {
      console.log("✅ Telegram mesajı uğurla göndərildi!");
      return res.status(200).json({
        success: true,
        codeSent: true,
        message: "Kod Telegram-a göndərildi"
      });
    } else {
      // Telegram "ok: false" qaytardı
      console.error("❌ Telegram xətası:", result);
      return res.status(500).json({
        success: false,
        error: "telegram_send_failed",
        details: result
      });
    }
    
  } catch (error) {
    console.error("❌ requestAdminOtp xətası:", error);
    return res.status(500).json({
      success: false,
      error: "internal",
      message: error.message
    });
  }
});

/**
 * OTP Yoxla - İstifadəçinin daxil etdiyi kodu yoxlayır
 */
exports.verifyAdminOtp = functions.https.onCall(async (data, context) => {
  try {
    const { code } = data;
    
    if (!code) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Kod daxil edilməlidir"
      );
    }
    
    // Firestore-dan OTP-ni oxu
    const otpDoc = await db.collection("admin-otp").doc("current").get();
    
    if (!otpDoc.exists) {
      return {
        success: false,
        message: "OTP tapılmadı"
      };
    }
    
    const otpData = otpDoc.data();
    
    // Yoxlamalar
    // 1. Kod istifadə olunubmu?
    if (otpData.used) {
      return {
        success: false,
        message: "Bu kod artıq istifadə olunub"
      };
    }
    
    // 2. Vaxt bitibmi?
    if (Date.now() > otpData.expiresAt) {
      return {
        success: false,
        message: "Kodun vaxtı bitib (5 dəqiqə)"
      };
    }
    
    // 3. Kod düzgündürmü?
    if (code !== otpData.code) {
      return {
        success: false,
        message: "Kod yanlışdır"
      };
    }
    
    // Kod düzgündür - istifadə olundu olaraq işarələ
    await db.collection("admin-otp").doc("current").update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: "OTP təsdiqləndi"
    };
    
  } catch (error) {
    console.error("verifyAdminOtp xətası:", error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      "internal",
      "OTP yoxlanarkən xəta baş verdi"
    );
  }
});
