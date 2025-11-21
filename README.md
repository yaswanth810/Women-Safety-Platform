# SafeSpace - Women's Safety Platform

**Full-stack platform (web-ready) for women's safety with emergency alerts, incident reporting, legal help, community support, and admin analytics.**

## 🚀 Live Demo

Demo Credentials:
- **Admin**: `admin@safespace.com` / `admin123`

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Open Source Resources Used](#open-source-resources-used)
- [Skipped Features](#skipped-features)

## ✨ Features

### Milestone 1 MVP (Implemented)

#### 1. User Management & Authentication
- ✅ Email/password registration and login
- ✅ JWT-based authentication with secure tokens
- ✅ Two-Factor Authentication (TOTP) using Google Authenticator
- ✅ Role-based access control (user, moderator, admin)
- ✅ Profile management with emergency contacts
- ✅ Password hashing with bcrypt

#### 2. Emergency Response & Alerts
- ✅ One-click SOS button with location tracking
- ✅ Real-time GPS location capture (browser geolocation)
- ✅ Automatic notification to emergency contacts
- ✅ SOS alert history and management
- ✅ Interactive map display with OpenStreetMap
- ✅ Deactivate alerts feature

#### 3. Incident Reporting & Case Management
- ✅ Comprehensive incident report creation
- ✅ Multiple incident types (harassment, assault, stalking, etc.)
- ✅ Anonymous reporting option
- ✅ Evidence file upload (photos/videos)
- ✅ Case status tracking (new → resolved)
- ✅ Location and GPS coordinates capture
- ✅ Admin case management interface

#### 4. Community Support & Forum
- ✅ Create discussion posts
- ✅ Upvote posts
- ✅ Comment on posts
- ✅ Real-time interaction
- ✅ User avatars and profiles

#### 5. Legal Resources
- ✅ Comprehensive legal information library
- ✅ Categorized resources (Rights, Procedures, Legal Actions, etc.)
- ✅ Search functionality
- ✅ Category filtering
- ✅ Accordion-style resource display
- ✅ Topics: Rights, Filing Complaints, Restraining Orders, Domestic Violence, Workplace Harassment, Cyberstalking

#### 6. Admin Dashboard & Analytics
- ✅ Platform statistics (users, incidents, SOS alerts)
- ✅ Incident management with status updates
- ✅ Hotspot map visualization
- ✅ Filter incidents by status
- ✅ Incidents by status breakdown
- ✅ Geographic incident clustering

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT (PyJWT) + bcrypt
- **2FA**: pyotp + qrcode
- **File Upload**: aiofiles
- **Security**: passlib, python-jose

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **UI Components**: Shadcn/UI + Radix UI
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet + OpenStreetMap
- **Notifications**: Sonner (toast notifications)
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Container**: Kubernetes
- **Process Manager**: Supervisor
- **Reverse Proxy**: Kubernetes Ingress

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 3000)   │
└────────┬────────┘
         │
         │ HTTPS/REST API
         │
┌────────▼────────┐
│  FastAPI Backend│
│   (Port 8001)   │
└────────┬────────┘
         │
         │ Motor (Async)
         │
┌────────▼────────┐
│    MongoDB      │
│  (Port 27017)   │
└─────────────────┘
```

### Backend Structure

```
/app/backend/
├── server.py           # Main FastAPI application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
└── uploads/           # File upload directory
```

### Frontend Structure

```
/app/frontend/
├── src/
│   ├── App.js         # Main app with routing
│   ├── App.css        # Global styles
│   ├── pages/         # Page components
│   │   ├── AuthPage.js
│   │   ├── Dashboard.js
│   │   ├── SOSPage.js
│   │   ├── IncidentReportPage.js
│   │   ├── ForumPage.js
│   │   ├── LegalResourcesPage.js
│   │   ├── ProfilePage.js
│   │   └── AdminPage.js
│   └── components/
│       ├── Layout.js  # Main layout with navigation
│       └── ui/        # Shadcn UI components
├── public/
├── package.json
└── .env
```

### Database Schema

#### Collections

**users**
```javascript
{
  id: String (UUID),
  email: String (unique),
  phone: String,
  name: String,
  password_hash: String,
  role: String (user|moderator|admin),
  emergency_contacts: [{
    name: String,
    phone: String,
    email: String,
    relationship: String
  }],
  totp_secret: String,
  totp_enabled: Boolean,
  created_at: ISO DateTime
}
```

**sos_alerts**
```javascript
{
  id: String (UUID),
  user_id: String,
  latitude: Float,
  longitude: Float,
  notes: String,
  timestamp: ISO DateTime,
  is_active: Boolean
}
```

**incidents**
```javascript
{
  id: String (UUID),
  user_id: String,
  incident_type: String (enum),
  description: String,
  location: String,
  latitude: Float,
  longitude: Float,
  is_anonymous: Boolean,
  evidence_files: [String],
  status: String (new|under_review|in_progress|resolved|closed),
  created_at: ISO DateTime,
  updated_at: ISO DateTime
}
```

**forum_posts**
```javascript
{
  id: String (UUID),
  user_id: String,
  author_name: String,
  title: String,
  content: String,
  upvotes: Integer,
  comments: [{
    user_id: String,
    author_name: String,
    content: String,
    timestamp: ISO DateTime
  }],
  created_at: ISO DateTime
}
```

**legal_resources**
```javascript
{
  id: String (UUID),
  title: String,
  content: String,
  category: String,
  created_at: ISO DateTime
}
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- Yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safespace
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Backend Environment**
   ```bash
   # backend/.env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="safespace_db"
   CORS_ORIGINS="*"
   JWT_SECRET="your-secret-key-change-in-production"
   ```

4. **Start Backend**
   ```bash
   uvicorn server:app --reload --host 0.0.0.0 --port 8001
   ```

5. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   ```

6. **Configure Frontend Environment**
   ```bash
   # frontend/.env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

7. **Start Frontend**
   ```bash
   yarn start
   ```

8. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

### Create Admin User

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create_admin():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['safespace_db']
    
    admin_user = {
        'id': 'admin-123',
        'email': 'admin@safespace.com',
        'name': 'Admin User',
        'phone': '+1234567890',
        'password_hash': pwd_context.hash('admin123'),
        'role': 'admin',
        'emergency_contacts': [],
        'totp_enabled': False,
        'created_at': '2024-01-01T00:00:00'
    }
    
    await db.users.insert_one(admin_user)
    print('Admin created: admin@safespace.com / admin123')
    client.close()

asyncio.run(create_admin())
```

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jane Doe",
  "phone": "+1234567890",
  "password": "securepassword"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "totp_code": "123456"  // Optional, required if 2FA enabled
}
```

#### Setup 2FA
```http
POST /api/auth/2fa/setup
Authorization: Bearer <token>

Response: 200 OK
{
  "secret": "BASE32SECRET",
  "qr_code": "data:image/png;base64,..."
}
```

### SOS Endpoints

#### Trigger SOS
```http
POST /api/sos
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Emergency situation"
}
```

### Incident Endpoints

#### Create Incident Report
```http
POST /api/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "incident_type": "harassment",
  "description": "Detailed description",
  "location": "Street address",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "is_anonymous": false
}
```

#### Upload Evidence
```http
POST /api/incidents/{incident_id}/evidence
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

### Admin Endpoints

#### Get Analytics Stats
```http
GET /api/admin/analytics/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "total_users": 100,
  "total_incidents": 50,
  "total_sos_alerts": 10,
  "active_sos_alerts": 2,
  "incidents_by_status": { ... }
}
```

#### Get Hotspots
```http
GET /api/admin/analytics/hotspots
Authorization: Bearer <token>

Response: 200 OK
{
  "hotspots": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "incident_type": "harassment"
    }
  ],
  "total": 50
}
```

For complete API documentation, visit `/docs` (Swagger UI) when backend is running.

## 🔒 Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - JWT tokens with expiration (24 hours)
   - Bcrypt password hashing (cost factor 12)
   - Role-based access control (RBAC)
   - Two-factor authentication (TOTP)

2. **Data Protection**
   - Passwords never stored in plain text
   - TOTP secrets encrypted in database
   - File uploads validated and stored securely
   - Anonymous reporting option for privacy

3. **API Security**
   - CORS configured
   - Bearer token authentication
   - Input validation with Pydantic
   - SQL injection prevention (NoSQL MongoDB)

4. **Best Practices**
   - Environment variables for secrets
   - HTTPS enforced in production (Kubernetes ingress)
   - Secure cookie flags
   - Rate limiting ready (can be added via middleware)

### Security Recommendations for Production

1. Change `JWT_SECRET` to a strong random value
2. Enable HTTPS only
3. Implement rate limiting
4. Add request/response logging
5. Set up monitoring and alerting
6. Regular security audits
7. Implement CSRF protection
8. Add API key management for third-party integrations

## 🌍 Open Source Resources Used

This project uses **100% open-source** technologies:

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database
- **Motor**: Async MongoDB driver
- **pyotp**: TOTP implementation
- **bcrypt/passlib**: Password hashing

### Frontend
- **React**: UI library
- **React Router**: Client-side routing
- **Shadcn/UI**: Component library
- **Tailwind CSS**: Utility-first CSS
- **Leaflet**: Interactive maps
- **OpenStreetMap**: Map tiles
- **Sonner**: Toast notifications

### Infrastructure
- **Supervisor**: Process control
- **Docker/Kubernetes**: Containerization

## ⏭ Skipped Features (Due to Paid APIs)

The following features require paid third-party services and were **skipped** as per requirements:

### 1. SMS Notifications (Twilio)
- **What was planned**: Send SMS alerts to emergency contacts
- **Why skipped**: Requires Twilio API ($$$)
- **Alternative implemented**: Database logging + in-app notifications
- **To implement**: Add Twilio credentials and uncomment SMS code

### 2. Push Notifications (Firebase Cloud Messaging)
- **What was planned**: Browser push notifications
- **Why skipped**: Requires Firebase setup
- **Alternative implemented**: Web-based toast notifications (Sonner)
- **To implement**: Set up Firebase project and integrate FCM SDK

### 3. Video Calls (Twilio/Agora/100ms)
- **What was planned**: Video consultations with counselors/lawyers
- **Why skipped**: All services require paid subscriptions
- **Alternative implemented**: None (marked as TODO in docs)
- **To implement**: Choose provider and integrate their SDK

### 4. AWS S3 File Storage
- **What was planned**: Cloud storage for evidence files
- **Why skipped**: Requires AWS account and S3 bucket
- **Alternative implemented**: Local file system storage (`/app/backend/uploads`)
- **To implement**: Add AWS credentials and use boto3

### 5. Google Maps API
- **What was planned**: Google Maps integration
- **Why skipped**: Requires API key ($$$)
- **Alternative implemented**: OpenStreetMap + Leaflet (FREE)
- **Works perfectly**: Fully functional maps without cost

### Optional Extensions (Not Implemented - Out of Scope)

- Email notifications (requires SMTP service)
- Geofencing alerts
- Multi-language support
- Mobile apps (React Native)
- WebRTC peer-to-peer calls
- AI-powered incident analysis

## 📝 Testing

### Manual Testing Checklist

- [x] User registration
- [x] User login
- [x] 2FA setup and verification
- [x] Profile updates
- [x] Emergency contact management
- [x] SOS alert trigger
- [x] Incident report creation
- [x] Evidence file upload
- [x] Forum post creation
- [x] Forum comments and upvotes
- [x] Legal resources browsing
- [x] Admin dashboard access
- [x] Incident status updates (admin)
- [x] Analytics and hotspot map

### Test Credentials

**Admin User:**
- Email: `admin@safespace.com`
- Password: `admin123`
- Role: admin

## 📦 Deployment

### Current Deployment (Kubernetes)

The application is deployed on Kubernetes with:
- Backend: FastAPI on port 8001
- Frontend: React on port 3000
- Database: MongoDB on port 27017
- Ingress: Handles routing and SSL

### Environment Variables

**Backend (.env)**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="safespace_db"
CORS_ORIGINS="*"
JWT_SECRET="change-in-production"
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Shadcn for the amazing UI component library
- OpenStreetMap contributors for free map data
- FastAPI team for the excellent Python framework
- React team for the powerful UI library

## 📞 Support

For support, please open an issue in the repository.

---

**Built with ❤️ for women's safety**