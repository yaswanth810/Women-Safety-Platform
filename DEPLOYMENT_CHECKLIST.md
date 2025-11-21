# 🚀 Vercel Deployment Checklist

Use this checklist to deploy SafeSpace to Vercel with zero errors!

---

## ✅ Pre-Deployment (Local Setup)

- [ ] All code is working locally
- [ ] Backend runs without errors
- [ ] Frontend connects to backend
- [ ] MongoDB is accessible
- [ ] All features tested locally

---

## ✅ MongoDB Atlas Setup

### Account & Cluster
- [ ] MongoDB Atlas account created (FREE)
- [ ] M0 FREE cluster created (512MB)
- [ ] Cluster name noted: `_________________`
- [ ] Cluster is active (green status)

### Security Configuration
- [ ] Database user created
  - Username: `_________________`
  - Password saved securely: ☐
- [ ] Network Access configured
  - IP Whitelist: `0.0.0.0/0` added
  - Status: Active

### Connection String
- [ ] Connection string obtained from "Connect" button
- [ ] Format: `mongodb+srv://user:password@cluster.mongodb.net/...`
- [ ] Password replaced in connection string
- [ ] Connection tested (using MongoDB Compass or Python script)
- [ ] Connection string saved: `_________________`

### Database Structure
- [ ] Database created: `safespace_db` (or your choice)
- [ ] Collections will be created automatically by application

---

## ✅ Vercel Account Setup

- [ ] Vercel account created at https://vercel.com
- [ ] Email verified
- [ ] Account type: Free tier
- [ ] Payment method: Not required ✅

---

## ✅ Code Repository (Recommended)

- [ ] Git repository created (GitHub/GitLab/Bitbucket)
  - Repository URL: `_________________`
- [ ] Code pushed to main/master branch
- [ ] All files committed:
  - [ ] `vercel.json` (root)
  - [ ] `api/index.py` (serverless backend)
  - [ ] `api/requirements.txt`
  - [ ] `.vercelignore`
  - [ ] `frontend/` (React app)
  - [ ] `VERCEL_DEPLOYMENT.md`

---

## ✅ Vercel Project Configuration

### Project Creation
- [ ] Vercel project created
- [ ] Project linked to Git repository (or deployed via CLI)
- [ ] Project name: `_________________`

### Build Settings
- [ ] Framework Preset: **Other** (or leave default)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: Default (Vercel auto-detects)
- [ ] Output Directory: Default
- [ ] Install Command: Default

### Environment Variables
- [ ] All variables added in Vercel Dashboard → Settings → Environment Variables

| Variable | Value | Status |
|----------|-------|--------|
| `MONGO_URL` | Your Atlas connection string | ☐ |
| `DB_NAME` | `safespace_db` | ☐ |
| `JWT_SECRET` | Generated secure token | ☐ |
| `CORS_ORIGINS` | `*` | ☐ |
| `REACT_APP_BACKEND_URL` | Your Vercel URL | ☐ |

**JWT Secret Generated?**
```bash
python3 generate_jwt_secret.py
```
- [ ] JWT Secret generated
- [ ] JWT Secret saved: `_________________`

---

## ✅ Initial Deployment

- [ ] First deployment triggered
- [ ] Build completed successfully
- [ ] No build errors in Vercel logs
- [ ] Deployment URL obtained: `_________________`

---

## ✅ Post-Deployment Configuration

### Update Environment Variables
- [ ] `REACT_APP_BACKEND_URL` updated with actual Vercel URL
- [ ] Example: `https://your-app-name.vercel.app` (no trailing slash)

### Redeploy
- [ ] Redeployed after environment variable update
- [ ] New deployment successful

---

## ✅ Backend Verification

### Health Check
- [ ] Visit: `https://your-app.vercel.app/api/health`
- [ ] Expected response:
  ```json
  {
    "status": "healthy",
    "database": "connected"
  }
  ```
- [ ] Status: ☐ Healthy ☐ Unhealthy

### API Documentation
- [ ] Visit: `https://your-app.vercel.app/docs`
- [ ] Swagger UI loads correctly
- [ ] All endpoints visible

### Common Issues
If health check fails:
- [ ] Check Vercel Functions logs
- [ ] Verify MongoDB Atlas IP whitelist
- [ ] Verify MongoDB connection string
- [ ] Check environment variables are set correctly

---

## ✅ Frontend Verification

- [ ] Visit: `https://your-app.vercel.app`
- [ ] Homepage loads correctly
- [ ] No console errors (F12 → Console)
- [ ] Navigation works
- [ ] UI looks correct (Tailwind CSS loaded)

---

## ✅ Database Initialization

### Create Admin User
```bash
python3 create_admin.py
```

- [ ] Script run successfully
- [ ] Admin user created in MongoDB
- [ ] Admin credentials saved:
  - Email: `_________________`
  - Password: `_________________`

**Or use MongoDB Compass:**
- [ ] Connect to MongoDB Atlas
- [ ] Navigate to `safespace_db.users`
- [ ] Insert admin document (see VERCEL_DEPLOYMENT.md)

### Seed Legal Resources (Optional)
```bash
python3 seed_legal_resources.py
```

- [ ] Script run successfully
- [ ] Legal resources added to database
- [ ] Count: _____ resources added

---

## ✅ Functional Testing

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
  - Email: `_________________`
  - Password: `_________________`
- [ ] JWT tokens generated correctly
- [ ] Protected routes require authentication

### User Features
- [ ] Profile page loads
- [ ] Profile update works
- [ ] Emergency contacts can be added
- [ ] Emergency contacts can be removed
- [ ] SOS alert can be triggered
- [ ] SOS alert shows on map
- [ ] SOS alerts list displays

### Incident Reporting
- [ ] Create incident report works
- [ ] Incident types dropdown works
- [ ] Location capture works
- [ ] File upload works (evidence)
- [ ] Incident list displays
- [ ] Incident details page loads

### Forum
- [ ] Forum page loads
- [ ] Create post works
- [ ] Posts display correctly
- [ ] Upvote works
- [ ] Comments work
- [ ] User avatars display

### Legal Resources
- [ ] Legal resources page loads
- [ ] Resources display correctly
- [ ] Category filter works
- [ ] Search works

### Admin Panel
- [ ] Admin dashboard accessible (admin login required)
- [ ] Statistics display correctly
- [ ] Incident list shows all incidents
- [ ] Incident status can be updated
- [ ] Hotspot map displays correctly
- [ ] Analytics charts work

### 2FA (Two-Factor Authentication)
- [ ] 2FA setup page loads
- [ ] QR code generates
- [ ] 2FA can be enabled
- [ ] 2FA code verification works
- [ ] Login with 2FA works

---

## ✅ Performance & Monitoring

### Performance
- [ ] Page load time: _____ seconds (target: <3s)
- [ ] API response time: _____ ms (target: <500ms)
- [ ] First contentful paint: _____ seconds

### Vercel Analytics (Optional)
- [ ] Vercel Analytics enabled in dashboard
- [ ] Web Vitals being tracked

### Error Tracking
- [ ] Check Vercel Functions logs for errors
- [ ] No critical errors in logs
- [ ] API requests completing successfully

---

## ✅ Security Review

- [ ] JWT Secret is strong (32+ characters)
- [ ] MongoDB Atlas password is strong
- [ ] Database user has minimal required permissions
- [ ] CORS configured correctly
- [ ] No sensitive data in client-side code
- [ ] No API keys exposed in frontend
- [ ] Admin password changed from default
- [ ] Environment variables not committed to Git

---

## ✅ Custom Domain (Optional)

- [ ] Domain purchased/available: `_________________`
- [ ] Domain added in Vercel → Settings → Domains
- [ ] DNS records configured:
  - [ ] A record or CNAME record
  - [ ] DNS propagation complete (check at https://dnschecker.org)
- [ ] SSL certificate issued automatically by Vercel
- [ ] HTTPS working on custom domain
- [ ] Environment variables updated with custom domain URL

---

## ✅ Documentation

- [ ] README.md updated with deployment info
- [ ] VERCEL_DEPLOYMENT.md reviewed
- [ ] Team members have access to:
  - [ ] Vercel project
  - [ ] MongoDB Atlas cluster
  - [ ] Git repository
  - [ ] Admin credentials (securely shared)

---

## ✅ Backup & Recovery

- [ ] MongoDB Atlas connection string backed up (securely)
- [ ] Vercel environment variables documented
- [ ] Admin credentials backed up (securely)
- [ ] Code backed up in Git repository
- [ ] Database export taken (optional):
  ```bash
  mongodump --uri="mongodb+srv://..." --out=backup/
  ```

---

## ✅ Go Live

- [ ] All tests passed ✅
- [ ] Performance acceptable ✅
- [ ] Security reviewed ✅
- [ ] Team trained on admin panel ✅
- [ ] Support channels set up ✅
- [ ] Monitoring in place ✅

### Share Your Deployment! 🎉

- [ ] URL shared with stakeholders
- [ ] Demo credentials provided (if needed)
- [ ] User guide shared
- [ ] Feedback mechanism established

---

## 🎯 Post-Launch Monitoring

### Week 1
- [ ] Monitor error logs daily
- [ ] Check user registrations
- [ ] Verify SOS alerts working
- [ ] Review incident reports
- [ ] Check forum activity

### Week 2-4
- [ ] Review MongoDB Atlas usage (storage, queries)
- [ ] Check Vercel usage (bandwidth, function invocations)
- [ ] Gather user feedback
- [ ] Plan improvements

### Monthly
- [ ] Database backup
- [ ] Review security settings
- [ ] Update dependencies (if needed)
- [ ] Performance optimization

---

## 🚨 Troubleshooting Quick Reference

### Backend Not Working
1. Check Vercel Functions logs
2. Verify MongoDB connection string
3. Check IP whitelist in Atlas
4. Verify environment variables

### Frontend Not Loading Data
1. Check browser console (F12)
2. Verify REACT_APP_BACKEND_URL
3. Check CORS settings
4. Test API directly: `/api/health`

### Database Connection Issues
1. Test connection string in MongoDB Compass
2. Verify network access (0.0.0.0/0)
3. Check database user permissions
4. Verify password in connection string

### File Upload Not Working
- Files are stored as base64 in MongoDB
- Maximum file size: 5MB
- Check browser console for errors

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **SafeSpace Deployment Guide**: VERCEL_DEPLOYMENT.md
- **GitHub Issues**: [Your repository]/issues

---

## ✅ Final Checklist

- [ ] All above sections completed
- [ ] Application is live and working
- [ ] Team has access
- [ ] Documentation complete
- [ ] Monitoring in place
- [ ] Ready for users! 🚀

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Vercel URL**: _________________

**Custom Domain**: _________________ (if applicable)

---

**🎉 Congratulations! Your SafeSpace deployment is complete!**

**Built with ❤️ for women's safety**
