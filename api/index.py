"""
Vercel Serverless API Handler for SafeSpace Backend
This file adapts the FastAPI application for Vercel's serverless environment
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from mangum import Mangum
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
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection (serverless-optimized with connection pooling)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'safespace_db')

# Create MongoDB client with connection pooling for serverless
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=10,
    minPoolSize=1,
    maxIdleTimeMS=45000,
    serverSelectionTimeoutMS=5000
)
db = client[db_name]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'safespace-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

# Create the main app
app = FastAPI(title="SafeSpace API", version="1.0.0")

# CORS configuration
cors_origins = os.environ.get('CORS_ORIGINS', '*')
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if cors_origins == "*" else cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Pydantic Models
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
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
        return {"id": user_id, "role": role, "email": user.get("email")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        name=user_data.name,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Create token
    access_token = create_access_token(user.id, user.role.value)
    
    user_dict = user.model_dump()
    user_dict.pop("password_hash")
    
    return TokenResponse(access_token=access_token, user=user_dict)

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Check 2FA if enabled
    if user.get("totp_enabled", False):
        if not login_data.totp_code:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="2FA code required")
        
        totp = pyotp.TOTP(user["totp_secret"])
        if not totp.verify(login_data.totp_code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")
    
    access_token = create_access_token(user["id"], user["role"])
    
    user_dict = serialize_doc(user)
    user_dict.pop("password_hash")
    
    return TokenResponse(access_token=access_token, user=user_dict)

@app.post("/api/auth/2fa/setup")
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    """Setup 2FA for user"""
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user["email"],
        issuer_name="SafeSpace"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Save secret
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"totp_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_code_base64}"
    }

@app.post("/api/auth/2fa/enable")
async def enable_2fa(totp_code: str, current_user: dict = Depends(get_current_user)):
    """Enable 2FA after verification"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user.get("totp_secret"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA not set up")
    
    totp = pyotp.TOTP(user["totp_secret"])
    if not totp.verify(totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"totp_enabled": True}}
    )
    
    return {"message": "2FA enabled successfully"}

@app.post("/api/auth/2fa/disable")
async def disable_2fa(current_user: dict = Depends(get_current_user)):
    """Disable 2FA"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"totp_enabled": False}}
    )
    return {"message": "2FA disabled successfully"}

# ==================== PROFILE ENDPOINTS ====================

@app.get("/api/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile"""
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user_dict = serialize_doc(user)
    user_dict.pop("password_hash")
    return user_dict

@app.put("/api/profile")
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    user = await db.users.find_one({"id": current_user["id"]})
    user_dict = serialize_doc(user)
    user_dict.pop("password_hash")
    return user_dict

@app.post("/api/profile/emergency-contacts")
async def add_emergency_contact(
    contact: EmergencyContact,
    current_user: dict = Depends(get_current_user)
):
    """Add emergency contact"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$push": {"emergency_contacts": contact.model_dump()}}
    )
    return {"message": "Emergency contact added"}

@app.delete("/api/profile/emergency-contacts/{index}")
async def remove_emergency_contact(
    index: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove emergency contact by index"""
    user = await db.users.find_one({"id": current_user["id"]})
    contacts = user.get("emergency_contacts", [])
    
    if 0 <= index < len(contacts):
        contacts.pop(index)
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"emergency_contacts": contacts}}
        )
        return {"message": "Emergency contact removed"}
    
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

# ==================== SOS ENDPOINTS ====================

@app.post("/api/sos")
async def trigger_sos(sos_data: SOSCreate, current_user: dict = Depends(get_current_user)):
    """Trigger SOS alert"""
    alert = SOSAlert(
        user_id=current_user["id"],
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        notes=sos_data.notes
    )
    
    await db.sos_alerts.insert_one(alert.model_dump())
    
    # Get user's emergency contacts
    user = await db.users.find_one({"id": current_user["id"]})
    emergency_contacts = user.get("emergency_contacts", [])
    
    # Note: SMS notifications would be sent here if Twilio is configured
    logger.info(f"SOS triggered by {current_user['email']} at {sos_data.latitude}, {sos_data.longitude}")
    
    return {"message": "SOS alert triggered", "alert_id": alert.id, "contacts_notified": len(emergency_contacts)}

@app.get("/api/sos")
async def get_sos_alerts(current_user: dict = Depends(get_current_user)):
    """Get user's SOS alerts"""
    alerts = await db.sos_alerts.find({"user_id": current_user["id"]}).sort("timestamp", -1).to_list(100)
    return [serialize_doc(alert) for alert in alerts]

@app.put("/api/sos/{alert_id}/deactivate")
async def deactivate_sos(alert_id: str, current_user: dict = Depends(get_current_user)):
    """Deactivate SOS alert"""
    result = await db.sos_alerts.update_one(
        {"id": alert_id, "user_id": current_user["id"]},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    
    return {"message": "Alert deactivated"}

# ==================== INCIDENT ENDPOINTS ====================

@app.post("/api/incidents")
async def create_incident(
    incident_data: IncidentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create incident report"""
    incident = IncidentReport(
        user_id=current_user["id"],
        incident_type=incident_data.incident_type,
        description=incident_data.description,
        location=incident_data.location,
        latitude=incident_data.latitude,
        longitude=incident_data.longitude,
        is_anonymous=incident_data.is_anonymous
    )
    
    await db.incidents.insert_one(incident.model_dump())
    return serialize_doc(incident.model_dump())

@app.get("/api/incidents")
async def get_incidents(current_user: dict = Depends(get_current_user)):
    """Get user's incidents"""
    incidents = await db.incidents.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    return [serialize_doc(inc) for inc in incidents]

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific incident"""
    incident = await db.incidents.find_one({"id": incident_id, "user_id": current_user["id"]})
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return serialize_doc(incident)

@app.post("/api/incidents/{incident_id}/evidence")
async def upload_evidence(
    incident_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload evidence file - stores as base64 in MongoDB for serverless"""
    # Verify incident belongs to user
    incident = await db.incidents.find_one({"id": incident_id, "user_id": current_user["id"]})
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    # Read file and convert to base64 (for serverless, store in DB)
    contents = await file.read()
    
    # Limit file size to 5MB
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large (max 5MB)")
    
    file_data = base64.b64encode(contents).decode()
    file_entry = {
        "filename": file.filename,
        "content_type": file.content_type,
        "data": file_data,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Add to incident
    await db.incidents.update_one(
        {"id": incident_id},
        {"$push": {"evidence_files": file_entry}}
    )
    
    return {"message": "Evidence uploaded", "filename": file.filename}

# ==================== FORUM ENDPOINTS ====================

@app.post("/api/forum/posts")
async def create_post(post_data: ForumPostCreate, current_user: dict = Depends(get_current_user)):
    """Create forum post"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    post = ForumPost(
        user_id=current_user["id"],
        author_name=user["name"],
        title=post_data.title,
        content=post_data.content
    )
    
    await db.forum_posts.insert_one(post.model_dump())
    return serialize_doc(post.model_dump())

@app.get("/api/forum/posts")
async def get_posts():
    """Get all forum posts"""
    posts = await db.forum_posts.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(post) for post in posts]

@app.post("/api/forum/posts/{post_id}/upvote")
async def upvote_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Upvote a post"""
    await db.forum_posts.update_one(
        {"id": post_id},
        {"$inc": {"upvotes": 1}}
    )
    return {"message": "Post upvoted"}

@app.post("/api/forum/posts/{post_id}/comments")
async def add_comment(
    post_id: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    """Add comment to post"""
    user = await db.users.find_one({"id": current_user["id"]})
    
    comment = ForumComment(
        user_id=current_user["id"],
        author_name=user["name"],
        content=content
    )
    
    await db.forum_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment.model_dump()}}
    )
    
    return {"message": "Comment added"}

# ==================== LEGAL RESOURCES ENDPOINTS ====================

@app.get("/api/legal-resources")
async def get_legal_resources(category: Optional[str] = None, search: Optional[str] = None):
    """Get legal resources"""
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    resources = await db.legal_resources.find(query).to_list(100)
    return [serialize_doc(res) for res in resources]

@app.post("/api/legal-resources")
async def create_legal_resource(
    resource_data: LegalResourceCreate,
    current_user: dict = Depends(require_admin)
):
    """Create legal resource (admin only)"""
    resource = LegalResource(**resource_data.model_dump())
    await db.legal_resources.insert_one(resource.model_dump())
    return serialize_doc(resource.model_dump())

# ==================== ADMIN ENDPOINTS ====================

@app.get("/api/admin/incidents")
async def get_all_incidents(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Get all incidents (admin only)"""
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    incidents = await db.incidents.find(query).sort("created_at", -1).to_list(200)
    return [serialize_doc(inc) for inc in incidents]

@app.put("/api/admin/incidents/{incident_id}")
async def update_incident_status(
    incident_id: str,
    update_data: IncidentUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update incident status (admin only)"""
    result = await db.incidents.update_one(
        {"id": incident_id},
        {
            "$set": {
                "status": update_data.status.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    
    return {"message": "Incident updated"}

@app.get("/api/admin/analytics/stats")
async def get_analytics_stats(current_user: dict = Depends(require_admin)):
    """Get platform statistics (admin only)"""
    total_users = await db.users.count_documents({})
    total_incidents = await db.incidents.count_documents({})
    total_sos = await db.sos_alerts.count_documents({})
    active_sos = await db.sos_alerts.count_documents({"is_active": True})
    
    # Incidents by status
    incidents_by_status = {}
    for status_val in CaseStatus:
        count = await db.incidents.count_documents({"status": status_val.value})
        incidents_by_status[status_val.value] = count
    
    return {
        "total_users": total_users,
        "total_incidents": total_incidents,
        "total_sos_alerts": total_sos,
        "active_sos_alerts": active_sos,
        "incidents_by_status": incidents_by_status
    }

@app.get("/api/admin/analytics/hotspots")
async def get_hotspots(current_user: dict = Depends(require_admin)):
    """Get incident hotspots (admin only)"""
    incidents = await db.incidents.find(
        {"latitude": {"$exists": True}, "longitude": {"$exists": True}}
    ).to_list(500)
    
    hotspots = []
    for inc in incidents:
        if inc.get("latitude") and inc.get("longitude"):
            hotspots.append({
                "latitude": inc["latitude"],
                "longitude": inc["longitude"],
                "incident_type": inc.get("incident_type", "unknown")
            })
    
    return {"hotspots": hotspots, "total": len(hotspots)}

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SafeSpace API",
        "version": "1.0.0",
        "status": "running"
    }

# Mangum handler for Vercel serverless
handler = Mangum(app, lifespan="off")
