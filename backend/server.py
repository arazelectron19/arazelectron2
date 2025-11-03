from fastapi import FastAPI, APIRouter, HTTPException, Query, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import shutil

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

# Create uploads directory if it doesn't exist
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve static files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Define Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    image_urls: List[str] = []  # Multiple images
    is_featured: bool = False
    specifications: str = ""  # Additional specifications
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_urls: List[str] = []
    is_featured: bool = False
    specifications: str = ""

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_urls: Optional[List[str]] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    specifications: Optional[str] = None

class ContactInfo(BaseModel):
    id: str = Field(default="main")  # Həmişə eyni id
    contact_groups: dict = {
        "whatsapp": [
            {"name": "WhatsApp 1", "phone": "+994 55 123 45 67"},
            {"name": "WhatsApp 2", "phone": "+994 77 888 99 00"}
        ],
        "ustalar": [
            {"name": "Araz", "phone": "+994 50 111 22 33"},
            {"name": "Rauf", "phone": "+994 51 444 55 66"}
        ],
        "satis": [
            {"name": "Satış şöbəsi", "phone": "+994 12 345 67 89"}
        ]
    }
    address_line1: str = "Bakı şəhəri, Yasamal rayonu"
    address_line2: str = "Fizuli küçəsi 25, mərtəbə 3"
    address_line3: str = "AZ1000, Azərbaycan"
    work_hours: str = "B.e - Cümə: 09:00 - 18:00"
    company_description: str = "Keyfiyyətli elektron avadanlıqlar və peşəkar xidmət"

class ContactInfoUpdate(BaseModel):
    contact_groups: Optional[dict] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    address_line3: Optional[str] = None
    work_hours: Optional[str] = None
    company_description: Optional[str] = None
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    customer_email: str
    customer_address: str
    items: List[dict]  # [{"product_id": "...", "name": "...", "price": 0, "quantity": 1}]
    total_amount: float
    status: str = "pending"  # pending, confirmed, delivered, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: str
    customer_address: str
    items: List[dict]
    total_amount: float

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Araz Elektron - API işləyir!"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint for Railway keep-alive"""
    return {
        "status": "healthy",
        "service": "araz-elektron-backend",
        "timestamp": datetime.utcnow().isoformat()
    }

# Kateqoriyalar
@api_router.get("/categories")
async def get_categories():
    categories = await db.categories.find({}).to_list(100)
    if not categories:
        # Default kateqoriyaları əlavə et
        default_categories = [
            {"name": "Səs Sistemləri"},
            {"name": "Kompüterlər"},
            {"name": "Kamera"},
            {"name": "Kondisionerlər"},
            {"name": "Noutbuklar"},
            {"name": "Monitorlar"},
            {"name": "Aksesuarlar"}
        ]
        for cat in default_categories:
            cat["id"] = str(uuid.uuid4())
            await db.categories.insert_one(cat)
        
        categories = await db.categories.find({}).to_list(100)
    
    category_names = [cat["name"] for cat in categories]
    return {"categories": category_names}

@api_router.get("/categories/all")
async def get_all_categories():
    categories = await db.categories.find({}).to_list(100)
    return [{"id": cat["id"], "name": cat["name"]} for cat in categories]

@api_router.post("/categories")
async def add_category(category: dict):
    if not category.get("name") or not category.get("name").strip():
        raise HTTPException(status_code=400, detail="Kateqoriya adı boş ola bilməz")
    
    # Kateqoriyanın mövcud olub-olmadığını yoxla
    existing = await db.categories.find_one({"name": category["name"]})
    if existing:
        raise HTTPException(status_code=400, detail="Bu kateqoriya artıq mövcuddur")
    
    new_category = {
        "id": str(uuid.uuid4()),
        "name": category["name"].strip(),
        "image_url": category.get("image_url", ""),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db.categories.insert_one(new_category)
    # MongoDB-dən _id-ni silək
    new_category.pop("_id", None)
    return {"message": "Kateqoriya əlavə edildi", "category": new_category}

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, category: dict):
    # Kateqoriyanı tap
    existing_category = await db.categories.find_one({"id": category_id})
    if not existing_category:
        raise HTTPException(status_code=404, detail="Kateqoriya tapılmadı")
    
    # Update məlumatlarını hazırla
    update_data = {}
    if category.get("name"):
        update_data["name"] = category["name"].strip()
    if "image_url" in category:
        update_data["image_url"] = category["image_url"]
    
    if update_data:
        await db.categories.update_one({"id": category_id}, {"$set": update_data})
    
    # Güncəllənmiş kateqoriyanı qaytar
    updated_category = await db.categories.find_one({"id": category_id})
    updated_category.pop("_id", None)
    return {"message": "Kateqoriya güncəlləndi", "category": updated_category}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    # Kateqoriyanı tap
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Kateqoriya tapılmadı")
    
    # Bu kateqoriyada məhsul varmı yoxla
    products_in_category = await db.products.count_documents({"category": category["name"]})
    if products_in_category > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Bu kateqoriyada {products_in_category} məhsul var. Əvvəlcə məhsulları silin və ya başqa kateqoriyaya köçürün"
        )
    
    # Kateqoriyanı sil
    await db.categories.delete_one({"id": category_id})
    return {"message": "Kateqoriya silindi"}

# Məhsullar CRUD
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    limit: int = Query(50, le=100)
):
    query = {}
    
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if featured is not None:
        query["is_featured"] = featured
    
    products = await db.products.find(query).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Məhsul tapılmadı")
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate):
    # Mövcud məhsulu tap
    existing_product = await db.products.find_one({"id": product_id})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Məhsul tapılmadı")
    
    # Yalnız dəyişdirilən sahələri güncəllə
    update_data = product_update.dict(exclude_unset=True)
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    # Güncəllənmiş məhsulu qaytar
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Məhsul tapılmadı")
    return {"message": "Məhsul silindi"}

# Sifarişlər
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(limit: int = Query(50, le=100)):
    orders = await db.orders.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sifariş tapılmadı")
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pending", "confirmed", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Səhv status")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sifariş tapılmadı")
    
    return {"message": "Status güncəlləndi"}

# Əlaqə məlumatları API-ləri
@api_router.get("/contact-info", response_model=ContactInfo)
async def get_contact_info():
    contact = await db.contact.find_one({"id": "main"})
    if not contact:
        # Əgər məlumat yoxdursa, default yaradırıq
        default_contact = ContactInfo()
        await db.contact.insert_one(default_contact.dict())
        return default_contact
    return ContactInfo(**contact)

@api_router.put("/contact-info", response_model=ContactInfo)
async def update_contact_info(contact_update: ContactInfoUpdate):
    # Mövcud məlumatı tap
    existing_contact = await db.contact.find_one({"id": "main"})
    if not existing_contact:
        # Əgər yoxdursa default yaradırıq
        existing_contact = ContactInfo().dict()
        await db.contact.insert_one(existing_contact)
    
    # Yalnız dəyişdirilən sahələri güncəllə
    update_data = contact_update.dict(exclude_unset=True)
    if update_data:
        await db.contact.update_one({"id": "main"}, {"$set": update_data})
    
    # Güncəllənmiş məlumatı qaytar
    updated_contact = await db.contact.find_one({"id": "main"})
    return ContactInfo(**updated_contact)

# İlkin məhsulları əlavə et - YALNIZ 1 dəfə
@api_router.post("/initialize-data")
async def initialize_sample_data():
    # Məhsulları yoxla və yalnız boşdursa əlavə et
    existing_products = await db.products.count_documents({})
    if existing_products > 0:
        return {"message": f"{existing_products} məhsul artıq mövcuddur"}
    
    sample_products = [
        {
            "name": "Samsung Galaxy A54 5G",
            "description": "128GB daxili yaddaş, 6GB RAM, 50MP kamera",
            "price": 899.99,
            "category": "Telefon",
            "image_urls": [
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400"
            ],
        
            "is_featured": True,
            "specifications": "• 6.4 düym Super AMOLED ekran\n• Exynos 1380 prosessor\n• 50MP əsas kamera + 12MP ultra geniş + 5MP makro\n• 5000mAh batareya\n• 25W sürətli şarj"
        },
        {
            "name": "JBL Charge 5 Speaker",
            "description": "Portativ Bluetooth speaker, suya davamlı",
            "price": 299.99,
            "category": "Səs Sistemləri",
            "image_urls": [
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400"
            ],
            "stock": 25,
            "is_featured": True,
            "specifications": "• IP67 suya davamlılıq\n• 20 saata qədər musiqi\n• JBL Pro Sound\n• Powerbank funksiyası\n• PartyBoost texnologiyası"
        },
        {
            "name": "Dell Inspiron 15 3000",
            "description": "Intel i5, 8GB RAM, 256GB SSD",
            "price": 1499.99,
            "category": "Noutbuklar",
            "image_urls": [
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400"
            ],
            "stock": 10,
            "is_featured": False,
            "specifications": "• 15.6 düym Full HD ekran\n• Intel Core i5-1135G7\n• 8GB DDR4 RAM\n• 256GB PCIe SSD\n• Windows 11 Home"
        },
        {
            "name": "Canon EOS M50 Mark II",
            "description": "24.1MP APS-C CMOS sensor, 4K video",
            "price": 2199.99,
            "category": "Kamera",
            "image_urls": [
                "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400",
                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"
            ],
            "stock": 8,
            "is_featured": True,
            "specifications": "• 24.1MP APS-C CMOS sensor\n• DIGIC 8 prosessor\n• 4K video çəkiliş\n• Vari-angle toxunma ekranı\n• Built-in Wi-Fi və Bluetooth"
        },
        {
            "name": "LG 24GN600-B Gaming Monitor",
            "description": "24 düym, 144Hz, Full HD IPS",
            "price": 549.99,
            "category": "Monitorlar",
            "image_urls": [
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400"
            ],
            "stock": 20,
            "is_featured": False,
            "specifications": "• 24 düym Full HD IPS\n• 144Hz refresh rate\n• 1ms response time\n• AMD FreeSync Premium\n• HDR10 dəstək"
        },
        {
            "name": "Midea Inverter AC 12000 BTU",
            "description": "Enerji səmərəli kondisioner, inverter texnologiyası",
            "price": 1899.99,
            "category": "Kondisionerlər",
            "image_urls": [
                "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400"
            ],
            "stock": 5,
            "is_featured": False,
            "specifications": "• 12000 BTU soyutma gücü\n• Inverter texnologiya\n• A++ enerji səmərəliliyi\n• Uzaq idarə pultu\n• Avtomatik temperatur tənzimlənməsi"
        }
    ]
    
    # Məhsulları əlavə et
    for product_data in sample_products:
        product = Product(**product_data)
        await db.products.insert_one(product.dict())
    
    return {"message": f"{len(sample_products)} ilkin məhsul əlavə edildi"}

# File Upload Endpoint
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Check if file is an image
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Yalnız şəkil faylları qəbul edilir")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Save file
        file_path = UPLOAD_DIR / unique_filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL
        file_url = f"/uploads/{unique_filename}"
        
        return {
            "message": "Şəkil uğurla yükləndi",
            "filename": unique_filename,
            "url": file_url,
            "full_url": f"https://bu-github-update.preview.emergentagent.com{file_url}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Şəkil yükləmə xətası: {str(e)}")

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