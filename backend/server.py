from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import pyotp
import io
import base64
import qrcode
import aiofiles
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'safespace_db')]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'safespace-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

# File upload directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app
app = FastAPI(title="SafeSpace API")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class IncidentType(str, Enum):
    HARASSMENT = "harassment"
    ASSAULT = "assault"
    STALKING = "stalking"
    DOMESTIC_VIOLENCE = "domestic_violence"
    WORKPLACE_HARASSMENT = "workplace_harassment"
    ONLINE_ABUSE = "online_abuse"
    OTHER = "other"

class CaseStatus(str, Enum):
    NEW = "new"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    phone: Optional[str] = None
    name: str
    password_hash: str
    role: UserRole = UserRole.USER
    emergency_contacts: List[dict] = Field(default_factory=list)
    totp_secret: Optional[str] = None
    totp_enabled: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class EmergencyContact(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    relationship: str

class SOSAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    latitude: float
    longitude: float
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class SOSCreate(BaseModel):
    latitude: float
    longitude: float
    notes: Optional[str] = None

class IncidentReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    incident_type: IncidentType
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_anonymous: bool = False
    evidence_files: List[str] = Field(default_factory=list)
    status: CaseStatus = CaseStatus.NEW
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IncidentCreate(BaseModel):
    incident_type: IncidentType
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_anonymous: bool = False

class IncidentUpdate(BaseModel):
    status: CaseStatus
    notes: Optional[str] = None

class ForumPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    author_name: str
    title: str
    content: str
    upvotes: int = 0
    comments: List[dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumPostCreate(BaseModel):
    title: str
    content: str

class ForumComment(BaseModel):
    user_id: str
    author_name: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LegalResource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LegalResourceCreate(BaseModel):
    title: str
    content: str
    category: str

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, role: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"user_id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "moderator"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        name=user_data.name,
        password_hash=hash_password(user_data.password)
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token(user.id, user.role)
    
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check 2FA if enabled
    if user.get("totp_enabled"):
        if not credentials.totp_code:
            raise HTTPException(status_code=401, detail="2FA code required")
        
        totp = pyotp.TOTP(user["totp_secret"])
        if not totp.verify(credentials.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    token = create_access_token(user["id"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}
    )

# 2FA Routes
@api_router.post("/auth/2fa/setup")
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate TOTP secret
    secret = pyotp.random_base32()
    
    # Generate QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user["email"], issuer_name="SafeSpace")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_code = base64.b64encode(buffered.getvalue()).decode()
    
    # Save secret (not enabled yet)
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"totp_secret": secret}}
    )
    
    return {"secret": secret, "qr_code": f"data:image/png;base64,{qr_code}"}

@api_router.post("/auth/2fa/enable")
async def enable_2fa(totp_code: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user or not user.get("totp_secret"):
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(totp_code):
        raise HTTPException(status_code=400, detail="Invalid code")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"totp_enabled": True}}
    )
    
    return {"message": "2FA enabled successfully"}

# User Profile Routes
@api_router.get("/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0, "totp_secret": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/profile")
async def update_profile(name: Optional[str] = None, phone: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    
    if update_data:
        await db.users.update_one({"id": current_user["user_id"]}, {"$set": update_data})
    
    return {"message": "Profile updated successfully"}

@api_router.post("/users/emergency-contacts")
async def add_emergency_contact(contact: EmergencyContact, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$push": {"emergency_contacts": contact.model_dump()}}
    )
    return {"message": "Emergency contact added"}

@api_router.get("/users/emergency-contacts")
async def get_emergency_contacts(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"emergency_contacts": 1, "_id": 0})
    return user.get("emergency_contacts", [])

# SOS Routes
@api_router.post("/sos")
async def trigger_sos(sos_data: SOSCreate, current_user: dict = Depends(get_current_user)):
    # Create SOS alert
    alert = SOSAlert(
        user_id=current_user["user_id"],
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        notes=sos_data.notes
    )
    
    alert_dict = alert.model_dump()
    alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
    await db.sos_alerts.insert_one(alert_dict)
    
    # Get emergency contacts
    user = await db.users.find_one({"id": current_user["user_id"]})
    emergency_contacts = user.get("emergency_contacts", [])
    
    # In production, send SMS/push notifications here
    # For now, we'll just log it
    logger.info(f"SOS triggered by {user['name']} at {sos_data.latitude}, {sos_data.longitude}")
    logger.info(f"Emergency contacts: {emergency_contacts}")
    
    return {"message": "SOS alert triggered", "alert_id": alert.id, "contacts_notified": len(emergency_contacts)}

@api_router.get("/sos")
async def get_active_sos(current_user: dict = Depends(get_current_user)):
    alerts = await db.sos_alerts.find({"user_id": current_user["user_id"], "is_active": True}, {"_id": 0}).to_list(100)
    return alerts

@api_router.post("/sos/{alert_id}/deactivate")
async def deactivate_sos(alert_id: str, current_user: dict = Depends(get_current_user)):
    await db.sos_alerts.update_one(
        {"id": alert_id, "user_id": current_user["user_id"]},
        {"$set": {"is_active": False}}
    )
    return {"message": "SOS alert deactivated"}

# Incident Reporting Routes
@api_router.post("/incidents")
async def create_incident(incident_data: IncidentCreate, current_user: dict = Depends(get_current_user)):
    incident = IncidentReport(
        user_id=current_user["user_id"] if not incident_data.is_anonymous else "anonymous",
        incident_type=incident_data.incident_type,
        description=incident_data.description,
        location=incident_data.location,
        latitude=incident_data.latitude,
        longitude=incident_data.longitude,
        is_anonymous=incident_data.is_anonymous
    )
    
    incident_dict = incident.model_dump()
    incident_dict['created_at'] = incident_dict['created_at'].isoformat()
    incident_dict['updated_at'] = incident_dict['updated_at'].isoformat()
    await db.incidents.insert_one(incident_dict)
    
    return {"message": "Incident reported successfully", "incident_id": incident.id}

@api_router.post("/incidents/{incident_id}/evidence")
async def upload_evidence(incident_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Verify incident ownership
    incident = await db.incidents.find_one({"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident["user_id"] != current_user["user_id"] and incident["user_id"] != "anonymous":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{file_id}{file_extension}"
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Update incident
    await db.incidents.update_one(
        {"id": incident_id},
        {"$push": {"evidence_files": str(file_path)}}
    )
    
    return {"message": "Evidence uploaded", "file_id": file_id}

@api_router.get("/incidents")
async def get_incidents(current_user: dict = Depends(get_current_user)):
    incidents = await db.incidents.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    return incidents

@api_router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    incident = await db.incidents.find_one({"id": incident_id}, {"_id": 0})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if incident["user_id"] != current_user["user_id"] and current_user["role"] not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return incident

# Forum Routes
@api_router.post("/forum/posts")
async def create_post(post_data: ForumPostCreate, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    
    post = ForumPost(
        user_id=current_user["user_id"],
        author_name=user["name"],
        title=post_data.title,
        content=post_data.content
    )
    
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    await db.forum_posts.insert_one(post_dict)
    
    return {"message": "Post created", "post_id": post.id}

@api_router.get("/forum/posts")
async def get_posts():
    posts = await db.forum_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return posts

@api_router.post("/forum/posts/{post_id}/upvote")
async def upvote_post(post_id: str, current_user: dict = Depends(get_current_user)):
    await db.forum_posts.update_one({"id": post_id}, {"$inc": {"upvotes": 1}})
    return {"message": "Post upvoted"}

@api_router.post("/forum/posts/{post_id}/comments")
async def add_comment(post_id: str, content: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    
    comment = ForumComment(
        user_id=current_user["user_id"],
        author_name=user["name"],
        content=content
    )
    
    comment_dict = comment.model_dump()
    comment_dict['timestamp'] = comment_dict['timestamp'].isoformat()
    
    await db.forum_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment_dict}}
    )
    
    return {"message": "Comment added"}

# Legal Resources Routes
@api_router.post("/legal/resources", dependencies=[Depends(require_admin)])
async def create_legal_resource(resource_data: LegalResourceCreate):
    resource = LegalResource(**resource_data.model_dump())
    
    resource_dict = resource.model_dump()
    resource_dict['created_at'] = resource_dict['created_at'].isoformat()
    await db.legal_resources.insert_one(resource_dict)
    
    return {"message": "Resource created", "resource_id": resource.id}

@api_router.get("/legal/resources")
async def get_legal_resources(category: Optional[str] = None):
    query = {"category": category} if category else {}
    resources = await db.legal_resources.find(query, {"_id": 0}).to_list(100)
    return resources

# Admin Routes
@api_router.get("/admin/incidents", dependencies=[Depends(require_admin)])
async def get_all_incidents(status_filter: Optional[CaseStatus] = None):
    query = {"status": status_filter} if status_filter else {}
    incidents = await db.incidents.find(query, {"_id": 0}).to_list(1000)
    return incidents

@api_router.put("/admin/incidents/{incident_id}", dependencies=[Depends(require_admin)])
async def update_incident_status(incident_id: str, update_data: IncidentUpdate):
    update_dict = {"status": update_data.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    
    result = await db.incidents.update_one({"id": incident_id}, {"$set": update_dict})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return {"message": "Incident updated"}

@api_router.get("/admin/analytics/hotspots", dependencies=[Depends(require_admin)])
async def get_hotspots():
    # Get all incidents with location data
    incidents = await db.incidents.find(
        {"latitude": {"$exists": True}, "longitude": {"$exists": True}},
        {"_id": 0, "latitude": 1, "longitude": 1, "incident_type": 1}
    ).to_list(1000)
    
    return {"hotspots": incidents, "total": len(incidents)}

@api_router.get("/admin/analytics/stats", dependencies=[Depends(require_admin)])
async def get_stats():
    total_users = await db.users.count_documents({})
    total_incidents = await db.incidents.count_documents({})
    total_sos = await db.sos_alerts.count_documents({})
    active_sos = await db.sos_alerts.count_documents({"is_active": True})
    
    # Incidents by status
    incidents_by_status = {}
    for status in CaseStatus:
        count = await db.incidents.count_documents({"status": status.value})
        incidents_by_status[status.value] = count
    
    return {
        "total_users": total_users,
        "total_incidents": total_incidents,
        "total_sos_alerts": total_sos,
        "active_sos_alerts": active_sos,
        "incidents_by_status": incidents_by_status
    }

# Include the router
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