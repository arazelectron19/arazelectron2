#!/bin/bash

echo "🚀 Firebase Functions Deploy Başlayır..."
echo ""

# Firebase-ə login olub-olmadığını yoxla
echo "1️⃣ Firebase login yoxlanılır..."
firebase login --no-localhost

echo ""
echo "2️⃣ Proyekt seçilir: araz-electron"
firebase use araz-electron

echo ""
echo "3️⃣ Functions deploy edilir..."
firebase deploy --only functions

echo ""
echo "✅ Deploy tamamlandı!"
echo ""
echo "Test etmək üçün:"
echo "https://arazelectron19.github.io/arazelectron2/#/araz79"
echo ""
echo "Logs yoxlamaq üçün:"
echo "firebase functions:log --only requestAdminOtp"
