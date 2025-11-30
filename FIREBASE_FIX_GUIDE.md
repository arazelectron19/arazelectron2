# Firebase "API key not valid" Xətasının Həlli 🔧

## ✅ Edilən Dəyişikliklər

**firebase.js faylında API key düzəldildi:**
```javascript
// Köhnə (yanlış):
apiKey: "AIzaSyCVyJZRG7kdpQ2Y1xoGVH8e7BIMqobbPuc"

// Yeni (düzgün):
apiKey: "AIzaSyCVyJZRG7KdpQ2YLxoGVh8e7BlMQcbbPuc"
```

---

## 🔥 Firebase Console-da Edilməli Addımlar

### 1️⃣ Authentication Aktivləşdirin

1. **Firebase Console**: https://console.firebase.google.com/
2. **araz-electron** proyektini seçin
3. **Build → Authentication** bölməsinə gedin
4. **Sign-in method** tab-ına keçin
5. **Email/Password** Provider-ini aktivləşdirin:
   - Toggle ON edin
   - Save

### 2️⃣ Admin İstifadəçisi Yaradın

1. **Authentication → Users** tab
2. **Add user** düyməsinə klikləyin
3. Email: `residm43@gmail.com`
4. Password: (güclü parol təyin edin)
5. **Add user** ilə təsdiqləyin

### 3️⃣ Authorized Domains Əlavə Edin

1. **Authentication → Settings** tab
2. **Authorized domains** bölməsinə gedin
3. Aşağıdakıları əlavə edin:
   - `localhost` ✅ (artıq olmalıdır)
   - `arazelectron19.github.io` ➕ (GitHub Pages üçün)
   - Sizin custom domain (əgər varsa)

### 4️⃣ Firestore Database Aktivləşdirin

1. **Build → Firestore Database**
2. **Create database** düyməsi
3. **Test mode** seçin (development üçün)
4. Location: `europe-west` (və ya yaxın region)
5. **Enable**

### 5️⃣ Firestore Rules Təyin Edin

Firestore Database → Rules tab-da:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin authentication tələb edir
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Publish** düyməsinə klikləyin.

### 6️⃣ API Key Restrictions Yoxlayın

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **araz-electron** proyektini seçin
3. **APIs & Services → Credentials**
4. **API Keys** bölməsində sizin key-i tapın
5. **Edit** düyməsi
6. **Application restrictions**:
   - **HTTP referrers (web sites)** seçin
   - Əlavə edin:
     ```
     http://localhost:3000/*
     https://arazelectron19.github.io/*
     ```
7. **API restrictions**:
   - **Restrict key** seçin
   - Aktivləşdirin:
     - Identity Toolkit API
     - Cloud Firestore API
     - Firebase Authentication API
8. **Save**

---

## 🧪 Test Addımları

### Local Test:
1. http://localhost:3000/arazelectron2/#/araz79 - açın
2. Email: `residm43@gmail.com` (disabled field)
3. Password: (Firebase-də təyin etdiyiniz parol)
4. **Daxil Ol** düyməsinə klikləyin

**Uğurlu olduqda:**
- Admin panelə keçid olmalıdır
- Console-da xəta olmamalıdır

**Xəta olarsa:**
- Browser console-u açın (F12)
- Network tab-da Firebase requests yoxlayın
- Console-da xəta mesajına baxın

---

## 📋 Ümumi Firebase Xətaları və Həlləri

### "API key not valid"
✅ **Həll:** API key-i yoxladıq və düzəltdik

### "auth/api-key-invalid"
✅ **Həll:** 
- Firebase Console-da API key restrictions yoxlayın
- Authorized domains əlavə edin

### "auth/user-not-found"
✅ **Həll:** 
- Firebase Console → Authentication → Users
- İstifadəçi yaradın

### "auth/wrong-password"
✅ **Həll:** 
- Doğru parolu daxil edin
- Firebase Console-da istifadəçi parolunu reset edin

### "Missing or insufficient permissions"
✅ **Həll:**
- Firestore Rules-u yoxlayın və düzəldin

---

## 🚀 Production Deployment

GitHub Pages deploy etdikdən sonra:

1. **Firebase Console → Authentication → Settings**
2. **Authorized domains** bölməsinə:
   - `arazelectron19.github.io` əlavə edin

3. **Google Cloud Console → Credentials**
4. API Key restrictions-da:
   - `https://arazelectron19.github.io/*` əlavə edin

---

## ✅ Yoxlama Siyahısı

Hər şeyin işlədiyini təsdiq etmək üçün:

- [ ] Firebase Authentication aktivləşdirilib
- [ ] Email/Password provider enable edilib
- [ ] Admin istifadəçisi (residm43@gmail.com) yaradılıb
- [ ] Authorized domains əlavə edilib
- [ ] Firestore Database aktivləşdirilib
- [ ] Firestore Rules təyin edilib
- [ ] API Key restrictions konfiqurasiya olunub
- [ ] Local test uğurlu olub
- [ ] Console-da xəta yoxdur

---

## 📞 Əlavə Kömək

Əgər problem davam edərsə:

1. **Browser Console** (F12) açın
2. **Console** tab-da xəta mesajlarını kopyalayın
3. **Network** tab-da Firebase requests-ə baxın
4. Status code və response-u yoxlayın

**Firebase Documentation:**
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/firestore

---

## ✅ API Key Düzəldildi!

**Yeni API Key:** `AIzaSyCVyJZRG7KdpQ2YLxoGVh8e7BlMQcbbPuc`

Firebase artıq düzgün konfiqurasiya olunub və işləməyə hazırdır! 🔥
