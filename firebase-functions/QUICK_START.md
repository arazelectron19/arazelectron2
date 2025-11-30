# 🚀 Telegram OTP Quick Start

## Sürətli Quraşdırma (5 Dəqiqə)

### 1️⃣ Telegram Bot Yarat (2 dəq)

```
1. @BotFather açın
2. /newbot göndərin
3. Bot adı: Araz Admin Bot
4. Username: araz_admin_bot
5. TOKEN qeyd edin: 5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

### 2️⃣ Chat ID Tapın (1 dəq)

```
1. @userinfobot açın
2. /start göndərin
3. Chat ID qeyd edin: 123456789
```

### 3️⃣ Firebase Functions Deploy (2 dəq)

```bash
# Firebase CLI quraşdırın (ilk dəfə)
npm install -g firebase-tools

# Login
firebase login

# Proyekti initialize edin
cd /app/firebase-functions
firebase init functions
# Select: araz-electron
# Language: JavaScript
# Install: Yes

# Environment variables
firebase functions:config:set telegram.bot_token="SİZİN_BOT_TOKEN"
firebase functions:config:set telegram.chat_id="SİZİN_CHAT_ID"

# Deploy
firebase deploy --only functions
```

### 4️⃣ Test Edin

```bash
cd /app/frontend
yarn start
```

1. http://localhost:3000/arazelectron2/#/araz79
2. "Telegram ilə Giriş"
3. Telegram-dan kod gələcək
4. Kodu daxil edin
5. ✅ Admin panel açılır!

---

## ⚡ Komandalar

### Deploy Functions
```bash
cd /app/firebase-functions
firebase deploy --only functions
```

### View Logs
```bash
firebase functions:log
```

### Test Locally
```bash
firebase emulators:start --only functions
```

### Config Görün
```bash
firebase functions:config:get
```

---

## 🔥 Firebase Console

- **Functions:** https://console.firebase.google.com/project/araz-electron/functions
- **Firestore:** https://console.firebase.google.com/project/araz-electron/firestore
- **Logs:** https://console.firebase.google.com/project/araz-electron/logs

---

## ✅ Hazır!

Artıq admin panel Telegram OTP ilə qorunur! 🔐
