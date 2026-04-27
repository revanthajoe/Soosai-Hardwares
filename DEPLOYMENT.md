# Deployment Guide - Soosai Hardwares

## Overview
This guide covers deploying the full-stack Soosai Hardwares application to production.

- **Frontend:** Vercel (recommended)
- **Backend:** Render, Railway, or Heroku
- **Database:** PostgreSQL (Render Database or external service)

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account: https://vercel.com/signup
- GitHub repository access

### Deployment Steps

1. **Connect GitHub Repository**
   ```bash
   # Push frontend code to GitHub (already done)
   ```

2. **Deploy on Vercel**
   - Visit https://vercel.com
   - Click "New Project"
   - Import from GitHub
   - Select `Soosai-Hardwares` repository
   - Configure project:
     - **Framework:** Vite
     - **Build command:** `npm run build`
     - **Output directory:** `dist`
   - Set environment variables:
     - `VITE_API_URL=https://your-backend-url.com`
   - Click "Deploy"

3. **Post-Deployment**
   - Verify frontend loads at `https://your-project.vercel.app`
   - Check API calls connect to backend
   - Test dark/light theme toggle
   - Verify responsive design on mobile

### Redeploy After Changes
```bash
git push origin main  # Vercel automatically redeploys
```

---

## Backend Deployment (Render)

### Prerequisites
- Render account: https://render.com
- PostgreSQL database ready

### Step 1: Set Up PostgreSQL Database

**Option A: Render PostgreSQL (Easiest)**
1. Go to https://dashboard.render.com
2. Create new PostgreSQL service
3. Copy connection string (DATABASE_URL)

**Option B: External PostgreSQL (AWS RDS, DigitalOcean, etc.)**
1. Create PostgreSQL database
2. Copy connection string: `postgresql://user:password@host:port/database`

### Step 2: Deploy Backend Service

1. **Push Code to GitHub** (if not done)
   ```bash
   git push origin main
   ```

2. **Create Render Service**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `Soosai-Hardwares` repo
   - Configure:
     - **Name:** soosai-hardwares-api
     - **Environment:** Node
     - **Build command:** `npm install`
     - **Start command:** `npm start`
     - **Root directory:** `backend/`

3. **Set Environment Variables**
   Go to Service Settings → Environment:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-secure-jwt-secret-generate-a-long-random-string
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://your-frontend-url.vercel.app
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=change-this-secure-password
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Verify at `https://soosai-hardwares-api.onrender.com`

### Step 3: Initialize Database

1. **Create Admin User**
   ```bash
   curl -X POST https://soosai-hardwares-api.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "admin123"
     }'
   ```

2. **Seed Initial Data** (if using seed script)
   ```bash
   # SSH into Render service or run via deployment hook
   npm run seed
   ```

---

## Backend Deployment (Railway/Heroku)

### Railway

1. **Create Account**
   - Visit https://railway.app
   - Sign in with GitHub

2. **Deploy Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose repository
   - Add PostgreSQL add-on
   - Set environment variables (same as Render)
   - Deploy

### Heroku (Alternative)

1. **Install Heroku CLI**
   ```bash
   choco install heroku-cli  # Windows
   ```

2. **Login and Deploy**
   ```bash
   heroku login
   heroku create soosai-hardwares-api
   heroku addons:create heroku-postgresql:hobby-dev
   
   # Set config vars
   heroku config:set JWT_SECRET=your-secret
   heroku config:set NODE_ENV=production
   
   # Deploy
   git push heroku main
   ```

---

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secure-random-string-min-32-chars
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.vercel.app
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
LOG_LEVEL=info
```

---

## Post-Deployment Verification

### Frontend
- [ ] Page loads without errors
- [ ] Theme toggle works (light/dark)
- [ ] Product list displays
- [ ] Search/filter works
- [ ] Product detail page works
- [ ] Mobile responsive

### Backend
- [ ] API documentation: `https://your-api-url/api/docs`
- [ ] Health check: `GET /api/health` returns 200
- [ ] Login works: `POST /api/auth/login`
- [ ] Get products: `GET /api/products` returns data
- [ ] Admin panel accessible
- [ ] Rate limiting active on auth endpoints

### Integration
- [ ] Frontend connects to backend
- [ ] Product data displays correctly
- [ ] Admin login works
- [ ] File uploads work
- [ ] No console errors

---

## Monitoring & Maintenance

### Logs
- **Render:** Service → Logs tab
- **Railway:** Deployments → Logs
- **Heroku:** `heroku logs --tail`

### Database Backups
- **Render PostgreSQL:** Automatic daily backups
- **External:** Configure provider-specific backups

### Performance Monitoring
- Check API response times: `https://your-api-url/api/health`
- Monitor database connections
- Review rate limiting logs

### Updates
To deploy code changes:
```bash
git commit -am "Feature: description"
git push origin main
# Vercel/Render auto-deploy from main branch
```

---

## Troubleshooting

### Backend won't start
1. Check DATABASE_URL format
2. Verify PostgreSQL service is running
3. Check logs: `npm start` locally first
4. Verify all required env vars are set

### Database connection errors
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is accessible (not blocked by firewall)
3. Confirm database exists
4. Test connection locally

### API not responding
1. Check backend service logs
2. Verify CORS settings match frontend URL
3. Check API health: `GET /api/health`
4. Verify rate limiting not blocking requests

### Frontend can't reach backend
1. Check VITE_API_URL environment variable
2. Verify backend URL is correct
3. Check browser console for CORS errors
4. Verify backend CORS settings

---

## Quick Redeploy Commands

```bash
# Frontend (Vercel)
git push origin main

# Backend (Any platform)
git push origin main  # Auto-deploys from GitHub integration

# Force rebuild (if needed)
# Render: Go to Deploys → Manual Deploy → Deploy latest
# Railway: Push to main branch
# Heroku: git push heroku main
```

---

## Performance Optimization

### Frontend
- Code splitting: ✅ Implemented in vite.config.js
- Image optimization: Use VITE_IMAGE_OPTIMIZATION
- CSS compression: ✅ Enabled in build
- JavaScript minification: ✅ Terser configured

### Backend
- Database query optimization: Indexes on slug, categoryId, isActive
- Response compression: ✅ Gzip enabled
- Static file caching: ✅ 1-year expires for uploads
- Rate limiting: ✅ Prevents abuse

---

## Security Checklist

Before going to production:
- [ ] Change admin password (not admin123)
- [ ] Generate secure JWT_SECRET (min 32 chars, random)
- [ ] Enable HTTPS everywhere
- [ ] Set proper CORS origin
- [ ] Enable Helmet security headers ✅
- [ ] Configure rate limiting ✅
- [ ] Enable request logging ✅
- [ ] Disable debug logs in production
- [ ] Backup database regularly
- [ ] Monitor for unauthorized access attempts
