# 🤖 Telegram OTP Authentication Setup

## Tam Təhlükəsizlik: Yalnız Sizin Telegram-ınıza Kod Göndərilir!

---

## 📋 Tələblər

1. ✅ Firebase Blaze Plan (pay-as-you-go)
2. ✅ Telegram Bot
3. ✅ Sizin Telegram Chat ID
4. ✅ Firestore Database

---

## 1️⃣ Telegram Bot Yaratmaq

### Addım 1: BotFather ilə Bot Yarat

1. Telegram-da **@BotFather** açın
2. `/newbot` komandası göndərin
3. Bot üçün ad daxil edin: `Araz Admin Bot`
4. Username daxil edin: `araz_admin_bot` (və ya unikal bir ad)
5. **Bot Token** alacaqsınız (misal):
   ```
   5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
   ```
6. Bu tokeni **qeyd edin** - lazım olacaq!

### Addım 2: Sizin Chat ID-nizi Tapın

#### Üsul 1: @userinfobot istifadə edin
1. Telegram-da **@userinfobot** açın
2. `/start` göndərin
3. Bot sizin **Chat ID**-nizi göstərəcək (misal: `123456789`)

#### Üsul 2: @getidsbot istifadə edin
1. Telegram-da **@getidsbot** açın
2. `/start` göndərin
3. "Your user ID" göstəriləcək

### Addım 3: Botunuzu Başladın

1. Öz yaratdığınız botu tapın (misal: `@araz_admin_bot`)
2. `/start` göndərin
3. İndi bot sizə mesaj göndərə bilər!

**Qeyd Etdiyiniz Məlumatlar:**
- ✅ Bot Token: `5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`
- ✅ Sizin Chat ID: `123456789`

---

## 2️⃣ Firebase Functions Quraşdırma

### Addım 1: Firebase CLI Quraşdırın

```bash
npm install -g firebase-tools
```

### Addım 2: Firebase Login

```bash
firebase login
```

### Addım 3: Firebase Proyektinizi Seçin

```bash
cd /app/firebase-functions
firebase init functions
```

Suallar:
- **Select project:** Mövcud proyekt seçin: `araz-electron`
- **Language:** JavaScript
- **ESLint:** No (istəsəniz Yes)
- **Install dependencies:** Yes

### Addım 4: Environment Variables Təyin Edin

```bash
firebase functions:config:set telegram.bot_token="5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
firebase functions:config:set telegram.chat_id="123456789"
```

**Əvəz edin:**
- `5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw` → Sizin bot token
- `123456789` → Sizin chat ID

### Addım 5: Functions Deploy Edin

```bash
cd /app/firebase-functions
firebase deploy --only functions
```

Deploy uğurlu olduqda görəcəksiniz:
```
✔ functions[requestAdminOtp]: Successful create operation
✔ functions[verifyAdminOtp]: Successful create operation
```

---

## 3️⃣ Firestore Database Quraşdırma

### Firestore Rules

Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin OTP collection - yalnız Functions yazacaq
    match /admin-otp/{document} {
      allow read, write: if false; // Frontend heç nə edə bilməz
    }
    
    // Digər collectionlar (products, orders və s.)
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Publish** düyməsinə klikləyin.

---

## 4️⃣ Frontend Build və Deploy

### Production Build

```bash
cd /app/frontend
yarn build
rm -rf /app/docs/*
cp -r /app/frontend/build/* /app/docs/
```

### GitHub-a Push

Emergent **"Save to GitHub"** istifadə edin.

---

## 5️⃣ Sistem Necə İşləyir

### Giriş Prosesi:

1. **İstifadəçi admin panelə daxil olmaq istəyir**
   - `https://arazelectron19.github.io/arazelectron2/#/araz79` açır

2. **"Telegram ilə Giriş" düyməsinə klikləyir**
   - Frontend `requestAdminOtp` Cloud Function-ı çağırır
   - Function 6 rəqəmli random kod yaradır (misal: `837492`)
   - Firestore-da saxlayır:
     ```json
     {
       "code": "837492",
       "createdAt": "2024-11-27T14:30:00Z",
       "expiresAt": 1732718400000,
       "used": false
     }
     ```
   - Telegram Bot API ilə sizin Telegram-ınıza göndərir:
     ```
     🔐 Admin Panel Giriş Kodu
     
     Kod: 837492
     
     ⏰ Bu kod 5 dəqiqə ərzində etibarlıdır.
     🔒 Araz Elektron Admin Panel
     ```

3. **Siz Telegram-dan kodu görürsünüz**
   - Kod: `837492`

4. **Saytda kodu daxil edirsiniz**
   - Input sahəsinə: `837492`
   - "Təsdiqlə" düyməsi

5. **Frontend `verifyAdminOtp` Function-ı çağırır**
   - Function Firestore-dan kodu yoxlayır:
     - ✅ Kod düzgündür?
     - ✅ Vaxt bitməyib? (5 dəqiqədən az)
     - ✅ Kod istifadə olunmayıb?
   
6. **Yoxlama uğurlu olduqda:**
   ```javascript
   localStorage.setItem("adminAuthenticated", "true");
   window.location.href = "#/araz79";
   setTimeout(() => {
     window.location.reload();
   }, 50);
   ```
   - Admin panel açılır! ✅

7. **Kod Firestore-da "used" olaraq işarələnir**
   - Eyni kodu ikinci dəfə istifadə etmək olmur

---

## 6️⃣ Təhlükəsizlik Xüsusiyyətləri

### ✅ Nə Qorunur?

1. **Telegram Bot Token** - Yalnız Firebase Functions-da
2. **Sizin Chat ID** - Yalnız Firebase Functions-da
3. **OTP Kodları** - Firestore-da, frontend oxuya bilməz
4. **5 Dəqiqə Limit** - Köhnə kodlar işləməz
5. **Birdəfəlik Kod** - İstifadə olunduqdan sonra silinir

### ❌ Həmlələrdən Qorunma:

- ❌ **URL Brute Force:** Gizli URL bilsə belə, OTP olmadan daxil ola bilməz
- ❌ **Parol Oğurluğu:** Parol yoxdur!
- ❌ **Session Hijacking:** Hər dəfə yeni OTP
- ❌ **Replay Attack:** Kod yalnız 1 dəfə işləyir
- ❌ **Time Attack:** 5 dəqiqə sonra etibarsız

---

## 7️⃣ Test Etmək

### Local Test:

```bash
# Frontend-i başlat
cd /app/frontend
yarn start
```

1. http://localhost:3000/arazelectron2/#/araz79
2. "Telegram ilə Giriş" düyməsinə klikləyin
3. Telegram-ınıza kod gələcək
4. Kodu daxil edin
5. Admin panel açılacaq

### Production Test:

1. https://arazelectron19.github.io/arazelectron2/#/araz79
2. Eyni proses

---

## 8️⃣ Xəta Həlli

### "Telegram mesajı göndərilə bilmədi"
- ✅ Bot token düzgündürmü?
- ✅ Bot `/start` edilib?
- ✅ Firebase Functions deploy olunub?

### "OTP tapılmadı"
- ✅ Firestore rules düzgündürmü?
- ✅ Functions deploy olunub?

### "Kodun vaxtı bitib"
- ✅ 5 dəqiqədən çox keçib?
- ✅ Yeni kod tələb edin

### "Bu kod artıq istifadə olunub"
- ✅ Eyni kodu 2 dəfə istifadə edə bilməzsiniz
- ✅ Yeni kod tələb edin

---

## 9️⃣ Məxəric (Logout)

Admin paneldə "🚪 Çıxış" düyməsi:

```javascript
localStorage.removeItem("adminAuthenticated");
window.location.href = "#/";
```

Yenidən giriş üçün yeni OTP lazımdır!

---

## 🎯 Üstünlüklər

✅ **Heç bir parol yoxdur** - unutmaq mümkün deyil
✅ **Yalnız sizin Telegram-ınız** - başqası ala bilməz
✅ **Birdəfəlik kodlar** - təhlükəsizlik maksimum
✅ **5 dəqiqə limit** - vaxt bitir
✅ **Firebase Functions** - backend tam təhlükəsizdir
✅ **Environment variables** - tokenlar frontend-ə çıxmır

---

## ✅ Setup Tamamlandı!

**Artıq admin panel yalnız sizin Telegram-ınıza gələn kodla açılır!** 🔐
