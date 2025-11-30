from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from telegram_helper import send_telegram_message


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Support Message Model
class SupportMessage(BaseModel):
    phone: str
    message: str


# Support Message Endpoint
@api_router.post("/support-message")
async def send_support_message(data: SupportMessage):
    """Send support message to Telegram"""
    try:
        # Validate inputs
        if not data.message.strip():
            raise HTTPException(status_code=400, detail="Mesaj boş ola bilməz")
        
        if not data.phone.strip():
            raise HTTPException(status_code=400, detail="Telefon nömrəsi daxil edin")
        
        # Format message for Telegram
        telegram_text = f"""🟠 ArazElectron saytından yeni mesaj:
📱 Telefon: {data.phone}
💬 Mesaj:
{data.message}"""
        
        # Send to Telegram
        result = await send_telegram_message(telegram_text)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Telegram göndərmə xətası")
        
        return {"success": True, "message": "Mesaj göndərildi"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Support message error: {e}")
        raise HTTPException(status_code=500, detail="Xəta baş verdi")


# Admin OTP Endpoint
@api_router.post("/admin-otp/request")
async def request_admin_otp():
    """Generate and send admin OTP to Telegram"""
    try:
        import random
        
        # 6 rəqəmli random kod yarat
        code = str(random.randint(100000, 999999))
        logger.info(f"Admin OTP yaradıldı: {code}")
        
        # Telegram mesajı
        telegram_text = f"""🔐 Araz Elektron Admin Təhlükəsizlik Kodu

Kod: {code}

⏰ Bu kod 5 dəqiqə ərzində etibarlıdır.
🔒 Admin Panel Girişi"""
        
        # Telegram-a göndər
        result = await send_telegram_message(telegram_text)
        
        if result is None:
            logger.error("Telegram mesajı göndərilə bilmədi")
            raise HTTPException(status_code=500, detail="Telegram xətası")
        
        logger.info("✅ Admin OTP Telegram-a göndərildi")
        
        # MongoDB-də saxla (5 dəqiqə ərzində)
        from datetime import timedelta
        otp_doc = {
            "code": code,
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
            "used": False
        }
        await db.admin_otp.delete_many({})  # Köhnələri sil
        await db.admin_otp.insert_one(otp_doc)
        
        return {
            "success": True,
            "message": "OTP Telegram-a göndərildi",
            "codeSent": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin OTP xətası: {e}")
        raise HTTPException(status_code=500, detail=f"Xəta: {str(e)}")


# Admin OTP Verify Endpoint
class VerifyOTPRequest(BaseModel):
    code: str

@api_router.post("/admin-otp/verify")
async def verify_admin_otp(data: VerifyOTPRequest):
    """Verify admin OTP code"""
    try:
        logger.info(f"OTP verify request: code={data.code}")
        
        # MongoDB-dən OTP oxu
        otp_doc = await db.admin_otp.find_one({}, sort=[("created_at", -1)])
        
        if not otp_doc:
            logger.warning("OTP tapılmadı")
            return {
                "success": True,
                "valid": False,
                "message": "OTP tapılmadı"
            }
        
        logger.info(f"OTP tapıldı: {otp_doc.get('code')}")
        
        # Yoxlamalar
        if otp_doc.get("used", False):
            logger.warning("OTP artıq istifadə olunub")
            return {
                "success": True,
                "valid": False,
                "message": "Bu kod artıq istifadə olunub"
            }
        
        # Vaxt yoxla - timezone-aware datetime ilə
        now = datetime.now(timezone.utc)
        expires_at = otp_doc.get("expires_at")
        
        # Əgər expires_at timezone-naive olarsa, UTC-yə çevir
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            logger.info(f"Vaxt yoxlanılır: now={now}, expires_at={expires_at}")
            
            if now > expires_at:
                logger.warning("OTP vaxtı bitib")
                return {
                    "success": True,
                    "valid": False,
                    "message": "Kodun vaxtı bitib (5 dəqiqə)"
                }
        
        # Kod yoxla
        if data.code != otp_doc.get("code"):
            logger.warning(f"Kod yanlış: gələn={data.code}, gözlənilən={otp_doc.get('code')}")
            return {
                "success": True,
                "valid": False,
                "message": "Kod yanlışdır"
            }
        
        # Kodu istifadə olundu olaraq işarələ
        await db.admin_otp.update_one(
            {"_id": otp_doc["_id"]},
            {"$set": {"used": True, "used_at": now}}
        )
        
        logger.info("✅ Admin OTP təsdiqləndi")
        
        return {
            "success": True,
            "valid": True,
            "message": "OTP təsdiqləndi"
        }
        
    except Exception as e:
        logger.error(f"❌ OTP verify xətası: {e}", exc_info=True)
        return {
            "success": False,
            "valid": False,
            "error": "internal",
            "message": f"Server xətası: {str(e)}"
        }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()