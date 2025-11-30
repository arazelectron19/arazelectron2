#!/bin/bash

echo "════════════════════════════════════════════════════"
echo "   🔥 FIREBASE FUNCTIONS DEPLOY"
echo "════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI tapılmadı!${NC}"
    echo ""
    echo "Quraşdırmaq üçün:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI tapıldı${NC}"
echo ""

# Navigate to functions directory
cd "$(dirname "$0")"

echo "📂 Directory: $(pwd)"
echo ""

# Login check
echo "🔐 Firebase login yoxlanılır..."
firebase login:list &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Login lazımdır${NC}"
    firebase login
else
    echo -e "${GREEN}✅ Login təsdiqləndi${NC}"
fi
echo ""

# Set project
echo "📦 Proyekt seçilir: araz-electron"
firebase use araz-electron
echo ""

# Deploy functions
echo "🚀 Functions deploy edilir..."
echo ""
firebase deploy --only functions

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════"
    echo -e "${GREEN}   ✅ DEPLOY UĞURLU!${NC}"
    echo "════════════════════════════════════════════════════"
    echo ""
    echo "Test etmək üçün:"
    echo "  https://repo-duplicator-7.preview.emergentagent.com/#/araz79"
    echo ""
    echo "Logs yoxlamaq üçün:"
    echo "  firebase functions:log --only requestAdminOtp"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════"
    echo -e "${RED}   ❌ DEPLOY XƏTASI!${NC}"
    echo "════════════════════════════════════════════════════"
    echo ""
    echo "Problemlər:"
    echo "  1. Billing aktivləşdirilib?"
    echo "  2. API-lər enable olunub?"
    echo "  3. İnternet bağlantısı var?"
    echo ""
    exit 1
fi
