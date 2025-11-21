# SafeSpace - Vercel Deployment Guide

Complete guide to deploy SafeSpace to Vercel with **100% FREE** services.

## 🎯 Overview

This guide will help you deploy:
- **Frontend**: React app on Vercel
- **Backend**: FastAPI as Vercel Serverless Functions  
- **Database**: MongoDB Atlas (FREE M0 tier - 512MB)
- **File Storage**: Base64 in MongoDB (for small files)

**Total Cost**: $0/month ✅

---

## 📋 Prerequisites

1. **Vercel Account** (Free)
   - Sign up at: https://vercel.com/signup

2. **MongoDB Atlas Account** (Free)
   - Sign up at: https://www.mongodb.com/cloud/atlas/register

3. **Git Repository** (Optional but recommended)
   - GitHub, GitLab, or Bitbucket account

---

## 🗄️ Step 1: Setup MongoDB Atlas (FREE)

### 1.1 Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose "Shared" plan (FREE M0 tier)

### 1.2 Create a FREE Cluster

1. After login, click **"Build a Database"**
2. Select **"M0 FREE"** tier
   - 512MB Storage
   - Shared RAM
   - No credit card required!
3. Choose your cloud provider (AWS, Google Cloud, or Azure)
4. Select region closest to your users
5. Name your cluster (e.g., `safespace-cluster`)
6. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.3 Configure Network Access

1. In Atlas dashboard, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is required for Vercel serverless functions
4. Click **"Confirm"**

### 1.4 Create Database User

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `safespace_user` (or your choice)
5. Password: Click **"Autogenerate Secure Password"** and **COPY IT** 🔒
6. Database User Privileges: **"Atlas Admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### 1.5 Get Connection String

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Python**, Version: **3.11 or later**
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://safespace_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace** `<password>` with the actual password you copied earlier
7. **Save this connection string** - you'll need it for Vercel!

**Example:**
```
mongodb+srv://safespace_user:MyP@ssw0rd123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

### 1.6 Create Database and Collections

You can create the database and collections through MongoDB Compass or the Atlas UI:

1. In Atlas, click **"Browse Collections"**
2. Click **"Add My Own Data"**
3. Database Name: `safespace_db`
4. Collection Name: `users`
5. Click **"Create"**

The application will automatically create other collections when needed:
- `users`
- `sos_alerts`
- `incidents`
- `forum_posts`
- `legal_resources`

---

## 🚀 Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

Or use Vercel Dashboard (easier for beginners).

### 2.2 Deploy via Vercel Dashboard

#### Option A: Deploy from Git Repository (Recommended)

1. **Push code to GitHub/GitLab**:
   ```bash
   git init
   git add .
   git commit -m "Ready for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/safespace.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Click **"Import Git Repository"**
   - Select your repository
   - Click **"Import"**

3. **Configure Project**:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as is)
   - Build Command: Leave default
   - Output Directory: Leave default
   - Install Command: Leave default

4. Click **"Deploy"** (don't worry, we'll add environment variables next)

#### Option B: Deploy via CLI

```bash
cd /app
vercel
```

Follow the prompts:
- Set up and deploy: **Y**
- Which scope: Select your account
- Link to existing project: **N**
- Project name: **safespace** (or your choice)
- Directory: **./app** (leave as is)
- Deploy: **Y**

### 2.3 Configure Environment Variables

After deployment (or during setup), add these environment variables:

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MONGO_URL` | Your MongoDB Atlas connection string | Production, Preview, Development |
| `DB_NAME` | `safespace_db` | Production, Preview, Development |
| `JWT_SECRET` | Generate a secure random string (see below) | Production, Preview, Development |
| `CORS_ORIGINS` | `*` | Production, Preview, Development |
| `REACT_APP_BACKEND_URL` | Your Vercel URL (e.g., `https://your-app.vercel.app`) | Production, Preview, Development |

**Generate JWT Secret:**
```bash
# Option 1: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -base64 32

# Option 3: Online generator
# Visit: https://www.random.org/strings/
```

Example output: `k8jH9mN2pQ3rT6vY8zA1bC4dE7fG0hI9jK2lM5nO8p`

4. Click **"Save"** for each variable

### 2.4 Update Frontend Environment Variable

After your first deployment, Vercel will give you a URL like:
```
https://your-app-name.vercel.app
```

1. Go back to **Environment Variables**
2. Update `REACT_APP_BACKEND_URL` to your actual Vercel URL
3. Click **"Save"**

### 2.5 Redeploy

After adding environment variables:

**Via Dashboard:**
1. Go to **"Deployments"**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

**Via CLI:**
```bash
vercel --prod
```

---

## ✅ Step 3: Verify Deployment

### 3.1 Test Backend API

Visit: `https://your-app.vercel.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 3.2 Test Frontend

Visit: `https://your-app.vercel.app`

You should see the SafeSpace landing page.

### 3.3 Create Admin User

Since this is a new database, you need to create an admin user.

**Method 1: Using MongoDB Compass** (Recommended)

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect using your connection string
3. Navigate to `safespace_db` → `users` collection
4. Click **"Add Data"** → **"Insert Document"**
5. Paste this document (update values as needed):

```json
{
  "id": "admin-001",
  "email": "admin@safespace.com",
  "name": "Admin User",
  "phone": "+1234567890",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5koNVmvr6SHFG",
  "role": "admin",
  "emergency_contacts": [],
  "totp_enabled": false,
  "totp_secret": null,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Password for above hash**: `admin123`

**Method 2: Using Python Script**

Create a file `create_admin.py`:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create_admin():
    # Replace with your MongoDB Atlas connection string
    MONGO_URL = "mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority"
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['safespace_db']
    
    # Check if admin exists
    existing = await db.users.find_one({"email": "admin@safespace.com"})
    if existing:
        print("Admin already exists!")
        return
    
    admin_user = {
        'id': 'admin-001',
        'email': 'admin@safespace.com',
        'name': 'Admin User',
        'phone': '+1234567890',
        'password_hash': pwd_context.hash('admin123'),
        'role': 'admin',
        'emergency_contacts': [],
        'totp_enabled': False,
        'totp_secret': None,
        'created_at': '2024-01-01T00:00:00Z'
    }
    
    await db.users.insert_one(admin_user)
    print('✅ Admin created successfully!')
    print('Email: admin@safespace.com')
    print('Password: admin123')
    print('\n⚠️  Please change the password after first login!')
    
    client.close()

asyncio.run(create_admin())
```

Run:
```bash
pip install motor passlib bcrypt
python create_admin.py
```

### 3.4 Test Login

1. Go to your deployed site
2. Click **"Login"**
3. Email: `admin@safespace.com`
4. Password: `admin123`
5. You should be logged in as admin!

---

## 🎨 Step 4: Initialize Legal Resources (Optional)

Your admin can add legal resources through the admin panel, or you can seed initial data:

Create `seed_legal_resources.py`:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

async def seed_legal_resources():
    MONGO_URL = "YOUR_MONGODB_ATLAS_CONNECTION_STRING"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['safespace_db']
    
    resources = [
        {
            "id": str(uuid.uuid4()),
            "title": "Know Your Rights",
            "content": "Every woman has fundamental rights under the law including the right to equality, dignity, and freedom from violence and discrimination.",
            "category": "Rights",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "How to File a Police Complaint",
            "content": "You have the right to file a complaint at any police station. The police must register your complaint (FIR) regardless of jurisdiction.",
            "category": "Procedures",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Restraining Orders",
            "content": "You can obtain a restraining order (protection order) to prevent someone from contacting or approaching you.",
            "category": "Legal Actions",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Domestic Violence Protection",
            "content": "The Domestic Violence Act provides protection, residence rights, and monetary relief to women facing domestic violence.",
            "category": "Domestic Violence",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Workplace Harassment Law",
            "content": "The Sexual Harassment of Women at Workplace Act, 2013 provides protection against sexual harassment at workplace.",
            "category": "Workplace",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Cyberstalking and Online Abuse",
            "content": "Cyberstalking, online harassment, and sharing private images without consent are criminal offenses under IT Act.",
            "category": "Cyber Crime",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Check if resources already exist
    count = await db.legal_resources.count_documents({})
    if count > 0:
        print(f"Legal resources already exist ({count} documents)")
        return
    
    # Insert resources
    await db.legal_resources.insert_many(resources)
    print(f"✅ Inserted {len(resources)} legal resources")
    
    client.close()

asyncio.run(seed_legal_resources())
```

Run:
```bash
python seed_legal_resources.py
```

---

## 🔧 Troubleshooting

### Backend Not Working

1. **Check Environment Variables**:
   - Verify all variables are set in Vercel
   - Ensure MONGO_URL has correct password
   - Check REACT_APP_BACKEND_URL matches your Vercel URL

2. **Check Logs**:
   - Go to Vercel Dashboard → Project → Functions
   - Click on `/api/index` function
   - View logs for errors

3. **MongoDB Connection Issues**:
   - Verify IP whitelist includes `0.0.0.0/0`
   - Check database user has correct permissions
   - Test connection string in MongoDB Compass

### Frontend Not Loading Backend Data

1. **Check CORS**:
   - Ensure CORS_ORIGINS is set to `*` in Vercel
   
2. **Check API URL**:
   - Verify REACT_APP_BACKEND_URL is correct
   - Should be `https://your-app.vercel.app` (no trailing slash)

3. **Open Browser Console**:
   - Check for errors (F12)
   - Look for 404 or CORS errors

### Database Connection Timeout

1. **MongoDB Atlas Free Tier**:
   - M0 clusters pause after inactivity
   - First request may be slow (cold start)
   - Subsequent requests will be faster

2. **Increase Timeout**:
   - Already configured in `api/index.py`
   - Default: 5 seconds

### File Upload Issues

- File uploads store files as base64 in MongoDB
- Maximum file size: 5MB (configured in code)
- For larger files, consider Vercel Blob or Cloudflare R2

---

## 🎯 Custom Domain (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Enter your domain (e.g., `safespace.com`)
3. Follow Vercel's DNS instructions
4. Update `REACT_APP_BACKEND_URL` to your custom domain

---

## 🔐 Security Best Practices

### Production Checklist

- [x] Change JWT_SECRET to a strong random value
- [x] Create strong admin password (not `admin123`)
- [ ] Enable 2FA for admin account
- [ ] Review and update CORS_ORIGINS to specific domain
- [ ] Set up MongoDB Atlas alerts for usage
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Regular security audits

### MongoDB Atlas Security

1. **Network Access**:
   - Review IP whitelist regularly
   - Use VPC peering if upgrading to paid tier

2. **Database Users**:
   - Use strong passwords
   - Rotate passwords periodically
   - Use separate users for dev/staging/prod

3. **Backup**:
   - M0 tier has no automatic backups
   - Export data regularly using `mongodump`
   - Consider upgrading to M10+ for automatic backups

---

## 📊 Monitoring & Limits

### Vercel Free Tier Limits

- ✅ 100GB Bandwidth/month
- ✅ 100 Deployments/day
- ✅ Serverless Function Execution: 100 hours/month
- ✅ Unlimited websites

### MongoDB Atlas M0 Free Tier Limits

- ✅ 512MB Storage
- ✅ Shared RAM
- ✅ Shared vCPU
- ✅ No credit card required
- ⚠️  Clusters pause after 60 days of inactivity

### Upgrade Considerations

When to upgrade:
- Storage > 450MB (MongoDB)
- > 5000 monthly active users
- Need automatic backups
- Need faster performance

---

## 🚀 Next Steps

1. **Test All Features**:
   - User registration
   - SOS alerts
   - Incident reporting
   - Forum posts
   - Admin dashboard

2. **Customize Content**:
   - Update legal resources
   - Add your organization's branding
   - Update contact information

3. **Add More Features**:
   - Email notifications (SendGrid free tier)
   - SMS alerts (Twilio trial credits)
   - Analytics (Google Analytics free)

4. **Monitor Performance**:
   - Set up Vercel Analytics
   - Monitor MongoDB Atlas metrics
   - Review error logs regularly

---

## 📞 Support & Resources

### Official Documentation

- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev

### Community

- **Vercel Discord**: https://vercel.com/discord
- **MongoDB Community**: https://www.mongodb.com/community/forums

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is set up:

- [ ] MongoDB Atlas cluster created (M0 Free)
- [ ] Database user created with password saved
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Code pushed to Git repository
- [ ] Vercel project created and linked to repository
- [ ] Environment variables added to Vercel
- [ ] Initial deployment successful
- [ ] Backend health check returns "healthy"
- [ ] Frontend loads correctly
- [ ] Admin user created in database
- [ ] Admin login works
- [ ] Legal resources seeded (optional)
- [ ] All features tested
- [ ] Custom domain configured (optional)
- [ ] Security settings reviewed

---

## 🎉 Congratulations!

Your SafeSpace application is now live on Vercel with 100% FREE infrastructure!

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-app.vercel.app/api`
- API Docs: `https://your-app.vercel.app/docs` (FastAPI auto-generated)

**Next**: Share your deployment with others and start making a difference! 💪

---

**Questions or Issues?**

Feel free to open an issue in the repository or reach out to the community forums.

**Built with ❤️ for women's safety**
