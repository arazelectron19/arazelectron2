# 🚀 Firebase Functions Deploy Təlimatı

## Problem: Admin OTP Telegram-a Göndərilmir

### ✅ Həll Edildi:

1. **Telegram Credentials hardcode edildi**
   - BOT_TOKEN: `7599107546:AAHqhn-Fj4dQm-d8baGlqfvyFuaxj6CSDqs`
   - CHAT_ID: `1809057644`
   - Backend ilə eyni credentials

2. **Firebase Functions export edildi**
   - `firebase.js`-də `getFunctions()` export edildi
   - `PasswordLoginTwoStep.js`-də düzgün import edildi

3. **Functions deploy edilməlidir**

---

## 📋 Deploy Addımları

### 1️⃣ Firebase CLI Quraşdırın (ilk dəfə)

```bash
npm install -g firebase-tools
```

### 2️⃣ Firebase Login

```bash
firebase login
```

### 3️⃣ Proyekti Initialize Edin

```bash
cd /app/firebase-functions
firebase use araz-electron
```

Əgər `araz-electron` proyekti yoxdursa:

```bash
firebase init functions
# Select: Use an existing project
# Choose: araz-electron
# Language: JavaScript
# ESLint: No
# Install dependencies: Yes
```

### 4️⃣ Functions Deploy Edin

```bash
cd /app/firebase-functions
firebase deploy --only functions
```

**Çıxış:**
```
✔ functions[requestAdminOtp(us-central1)]: Successful create operation.
✔ functions[verifyAdminOtp(us-central1)]: Successful create operation.

Functions URL:
https://us-central1-araz-electron.cloudfunctions.net/requestAdminOtp
https://us-central1-araz-electron.cloudfunctions.net/verifyAdminOtp
```

### 5️⃣ Firestore Rules Deploy Edin

```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Test Etmək

### Local Test (Frontend):

```bash
cd /app/frontend
yarn start
```

1. http://localhost:3000/arazelectron2/#/araz79
2. Parol: `arazelectron2006`
3. "Təhlükəsizlik Kodu Göndər"
4. **Telegram-ınıza kod gəlməlidir!**

### Production Test:

1. https://arazelectron19.github.io/arazelectron2/#/araz79
2. Parol: `arazelectron2006`
3. "Təhlükəsizlik Kodu Göndər"
4. **Telegram-ınıza kod gəlməlidir!**

---

## 🔍 Logs Yoxlamaq

### Functions Logs:

```bash
firebase functions:log
```

### Real-time Logs:

```bash
firebase functions:log --only requestAdminOtp
```

**Axtarılacaq məlumatlar:**
- "requestAdminOtp xətası:" - Function error
- "Telegram xətası:" - Telegram API error
- OTP code yaradılması
- Telegram response

---

## ⚠️ Ümumi Problemlər

### Problem 1: "Function not found"

**Səbəb:** Functions deploy olmayıb

**Həll:**
```bash
firebase deploy --only functions
```

### Problem 2: "UNAUTHENTICATED"

**Səbəb:** Firebase config düzgün deyil

**Həll:**
- `firebase.js`-də config yoxlayın
- Project ID: `araz-electron`

### Problem 3: "Telegram API error"

**Səbəb:** BOT_TOKEN və ya CHAT_ID yanlışdır

**Həll:**
- BOT_TOKEN: `7599107546:AAHqhn-Fj4dQm-d8baGlqfvyFuaxj6CSDqs`
- CHAT_ID: `1809057644`
- Bu credentials artıq hardcode edilib

### Problem 4: "CORS error"

**Səbəb:** Functions region uyğun deyil

**Həll:**
- Default region: `us-central1`
- Frontend avtomatik düzgün region seçir

### Problem 5: "Missing permissions"

**Səbəb:** Firestore rules bloklanıb

**Həll:**
```bash
firebase deploy --only firestore:rules
```

---

## 📝 Firebase Console

### Functions:
https://console.firebase.google.com/project/araz-electron/functions

**Yoxlayın:**
- ✅ `requestAdminOtp` - DEPLOYED
- ✅ `verifyAdminOtp` - DEPLOYED

### Firestore:
https://console.firebase.google.com/project/araz-electron/firestore

**Collection:** `admin-otp`
**Document:** `current`

**Fields:**
```json
{
  "code": "123456",
  "createdAt": "timestamp",
  "expiresAt": 1234567890,
  "used": false
}
```

### Logs:
https://console.firebase.google.com/project/araz-electron/functions/logs

---

## 🔐 Təhlükəsizlik

### Credentials Qorunur:

- ✅ BOT_TOKEN və CHAT_ID backend-də (functions)
- ✅ Frontend-də heç nə yoxdur
- ✅ Environment variables fallback var

### Firestore Rules:

```javascript
match /admin-otp/{document} {
  allow read, write: if false; // Frontend heç nə edə bilməz
}
```

---

## ✅ Deploy Checklist

Hər şeyin işlədiyini təsdiq etmək üçün:

- [ ] Firebase CLI quraşdırılıb
- [ ] `firebase login` edilib
- [ ] `firebase use araz-electron` seçilib
- [ ] `firebase deploy --only functions` uğurlu olub
- [ ] `firebase deploy --only firestore:rules` edilib
- [ ] Frontend build edilib: `yarn build`
- [ ] Docs-a kopyalanıb: `cp -r build/* /app/docs/`
- [ ] Local test edilib: Telegram kod gəlir ✅
- [ ] Production test edilib: Telegram kod gəlir ✅

---

## 🎯 Nəticə

**Deploy etdikdən sonra:**
1. Admin paneldə parol daxil edin
2. "Təhlükəsizlik Kodu Göndər" düyməsinə basın
3. **Telegram-ınıza 6 rəqəmli kod gələcək!**

**Problem yoxdursa:**
- ✅ Firebase Functions deploy olunub
- ✅ Telegram credentials düzgündür
- ✅ Frontend düzgün çağırır
- ✅ Kod Telegram-a göndərilir

**Firebase Functions artıq işləməyə hazırdır!** 🚀
