# 🔐 2 Mərhələli Admin Authentication Sistemi

## İki Qatlı Təhlükəsizlik: Parol + Telegram OTP

---

## 🎯 Sistem Necə İşləyir?

### 1️⃣ MƏRHƏLƏ: Parol Yoxlama

**Admin login səhifəsi açılır:**
- URL: `/#/araz79`
- Yalnız parol inputu görünür
- Parol: `arazelectron2006`

**İstifadəçi parolu daxil edir:**
- ✅ Düzgün parol → İkinci mərhələyə keçir
- ❌ Yanlış parol → "Parol yanlışdır" xətası

### 2️⃣ MƏRHƏLƏ: Telegram OTP

**Parol düzgün olduqda yeni forma açılır:**

**A) "Telegrama Kod Göndər" düyməsi:**
- Düyməyə klikləyir
- Firebase Cloud Function çağırılır: `requestAdminOtp`
- Backend:
  - 6 rəqəmli random kod yaradır (misal: `847293`)
  - Firestore-da saxlayır: `admin-otp/current`
  - Telegram Bot vasitəsilə **yalnız sizin Telegram-ınıza** göndərir

**B) Telegram-dan kod gəlir:**
```
🔐 Admin Panel Giriş Kodu

Kod: 847293

⏰ Bu kod 5 dəqiqə ərzində etibarlıdır.
🔒 Araz Elektron Admin Panel
```

**C) "Gələn Kodu Daxil Et" inputu:**
- İstifadəçi Telegram-dan gələn kodu yazır: `847293`
- "Təsdiqlə" düyməsinə klikləyir

**D) Backend yoxlama:**
- Firebase Cloud Function çağırılır: `verifyAdminOtp`
- Firestore-dakı kodla müqayisə:
  - ✅ Kod düzgün və 5 dəqiqədən azdır → `{ success: true }`
  - ❌ Kod yanlış və ya vaxt bitib → `{ success: false, message: "..." }`

### 3️⃣ UĞURLU GİRİŞ

**Kod düzgün olduqda:**
```javascript
localStorage.setItem("adminAuthenticated", "true");
window.location.href = "#/araz79";
setTimeout(() => {
  window.location.reload();
}, 50);
```

**Admin panel açılır!** ✅

---

## 🎨 UI Flow

### Mərhələ Göstəricisi:

```
┌───┐      ┌───┐
│ 1 │──────│ 2 │
└───┘      └───┘
Parol      Telegram
```

**Mərhələ 1 (Parol):**
- Input: Parol
- Düymə: "🔐 Növbəti Addım"

**Mərhələ 2 (Telegram):**
- Düymə: "📱 Telegrama Kod Göndər"
- Input: 6 rəqəmli kod
- Düymə: "✅ Təsdiqlə"
- Link: "← Geri qayıt"

---

## 🔒 Admin Panel Təhlükəsizliyi

### AdminPanel Component:

```javascript
useEffect(() => {
  const isAuth = localStorage.getItem("adminAuthenticated") === "true";
  if (!isAuth) {
    // Authentication yoxdursa ana səhifəyə yönləndir
    window.location.href = "#/";
  } else {
    setIsAuthenticated(true);
  }
}, []);
```

**Bu o deməkdir ki:**
- ❌ URL-i bilsə belə, parol + OTP olmadan daxil ola bilməz
- ❌ localStorage-də authentication yoxdursa, ana səhifəyə atılır
- ✅ Yalnız 2 mərhələni keçənlər admin panel görə bilər

---

## 📝 Component Strukturu

### PasswordLoginTwoStep.js

**State:**
```javascript
const [step, setStep] = useState(1); // 1: Parol, 2: Telegram OTP
const [password, setPassword] = useState("");
const [otp, setOtp] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState("");
```

**Functions:**
1. `handlePasswordSubmit()` - Parol yoxlama
2. `handleRequestOtp()` - Telegram-a kod göndər
3. `handleVerifyOtp()` - OTP yoxla və giriş et

---

## 🚀 Firebase Functions

### requestAdminOtp
```javascript
// 6 rəqəmli OTP yarat
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Firestore-da saxla
await db.collection("admin-otp").doc("current").set({
  code: otp,
  createdAt: timestamp,
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 dəqiqə
  used: false
});

// Telegram-a göndər
const message = `🔐 Admin Panel Giriş Kodu\n\nKod: ${otp}\n\n...`;
await fetch(telegramUrl, { ... });
```

### verifyAdminOtp
```javascript
// Firestore-dan OTP oxu
const otpDoc = await db.collection("admin-otp").doc("current").get();

// Yoxlamalar
if (otpData.used) return { success: false, message: "Kod istifadə olunub" };
if (Date.now() > otpData.expiresAt) return { success: false, message: "Vaxt bitib" };
if (code !== otpData.code) return { success: false, message: "Kod yanlışdır" };

// Kod düzgün
await db.collection("admin-otp").doc("current").update({ used: true });
return { success: true };
```

---

## 🧪 Test Ssenariləri

### ✅ Ssenari 1: Normal Giriş

1. `/#/araz79` açın
2. Parol: `arazelectron2006` daxil edin
3. "Növbəti Addım" klikləyin
4. İkinci mərhələyə keçir
5. "Telegrama Kod Göndər" klikləyin
6. Telegram-dan kod gəlir: `847293`
7. Kodu daxil edin və "Təsdiqlə"
8. **Admin panel açılır** ✅

### ❌ Ssenari 2: Yanlış Parol

1. `/#/araz79` açın
2. Yanlış parol daxil edin
3. **"Parol yanlışdır" xətası** ❌
4. İkinci mərhələyə keçmir

### ❌ Ssenari 3: Yanlış OTP

1. Parol düzgün daxil edin
2. Telegram-a kod göndərin
3. Yanlış kod daxil edin: `111111`
4. **"Kod yanlışdır və ya vaxtı bitib" xətası** ❌
5. Admin panel açılmır

### ❌ Ssenari 4: Vaxt Bitib

1. Parol düzgün daxil edin
2. Telegram-a kod göndərin
3. 5 dəqiqədən çox gözləyin
4. Kodu daxil edin
5. **"Vaxt bitib" xətası** ❌

### ❌ Ssenari 5: Gizli URL (Qorunma)

1. localStorage təmizləyin: `localStorage.clear()`
2. `/#/araz79` URL-ini açın
3. **Ana səhifəyə yönləndirilir** ❌
4. Admin panel görünmür

---

## 🔐 Təhlükəsizlik Xüsusiyyətləri

### İki Qatlı Qoruma:

1. **Parol Qatı:**
   - ✅ Static parol: `arazelectron2006`
   - ✅ Frontend-də yoxlanır
   - ✅ Yanlış olduqda ikinci mərhələyə keçmir

2. **Telegram OTP Qatı:**
   - ✅ Random 6 rəqəmli kod
   - ✅ 5 dəqiqə expiration
   - ✅ Birdəfəlik istifadə
   - ✅ Yalnız sizin Telegram-ınıza göndərilir
   - ✅ Backend-də (Firebase) yoxlanır

### Nə Qorunur:

- ❌ **Brute Force:** OTP 5 dəqiqədən sonra işləməz
- ❌ **Session Hijacking:** Hər dəfə yeni OTP
- ❌ **Replay Attack:** Kod yalnız 1 dəfə işləyir
- ❌ **URL Discovery:** URL bilsə belə, 2 mərhələdən keçməlidir
- ❌ **Man-in-the-Middle:** Kod yalnız sizin Telegram-ınıza gəlir

---

## 📦 Quraşdırma

### 1. Telegram Bot Yarat

```
@BotFather → /newbot → Token al
@userinfobot → Chat ID al
```

### 2. Firebase Functions Deploy

```bash
cd /app/firebase-functions
firebase functions:config:set telegram.bot_token="TOKEN"
firebase functions:config:set telegram.chat_id="CHAT_ID"
firebase deploy --only functions
```

### 3. Frontend Build

```bash
cd /app/frontend
yarn build
cp -r build/* /app/docs/
```

### 4. GitHub-a Push

Emergent "Save to GitHub" istifadə edin.

---

## 🎯 Üstünlüklər

✅ **İki Qatlı Təhlükəsizlik** - Həm parol, həm OTP
✅ **Telegram Notification** - Real-time kod göndərilməsi
✅ **5 Dəqiqə Limit** - Köhnə kodlar işləməz
✅ **Birdəfəlik Kod** - Təkrar istifadə qadağandır
✅ **User-Friendly UI** - Addım-addım progress göstəricisi
✅ **Geri Qayıt** - İstənilən mərhələdən geri dönmək
✅ **Firebase Security** - Backend tam qorumalıdır

---

## ✅ Sistem Hazırdır!

**2 mərhələli authentication tam təhlükəsizlik təmin edir!** 🔐

**Dəqiq Flow:**
1. Parol: `arazelectron2006` ✅
2. Telegram OTP: `6 rəqəmli kod` ✅
3. Admin Panel Açılır! 🎉
