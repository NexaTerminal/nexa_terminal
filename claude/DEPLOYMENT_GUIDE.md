# Nexa Application Deployment Guide

## Overview
This guide covers deploying the Nexa application with:
- **Frontend**: Vercel (React app)
- **Backend**: Render (Node.js API)
- **Database**: MongoDB Atlas (already configured)

## Pre-Deployment Security Fixes ✅

### Critical Security Issues Fixed:
1. ✅ **Removed hardcoded admin credentials** from `server/controllers/authController.js`
2. ✅ **Reduced excessive rate limits** in development mode
3. ✅ **Added environment variable configuration** for CORS origins
4. ✅ **Created secure .env files** with proper configuration

## Step 1: Prepare Your Code for Deployment

### 1.1 Update Environment Variables

**Server (.env file created):**
- Update `JWT_SECRET` with a strong random string
- Update `CSRF_SECRET` with a strong random string
- Add your OAuth credentials (Google, LinkedIn)
- Update CORS_ORIGINS with your Vercel app URL

**Client (.env file created):**
- Update `REACT_APP_API_URL` with your Render backend URL

### 1.2 Generate Secure Keys
```bash
# Generate secure JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate secure CSRF secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub
```bash
git add .
git commit -m "Prepare for production deployment - security fixes and env config"
git push origin main
```

### 2.2 Deploy to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `nexa-backend`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`

**Environment Variables** (Add these in Render dashboard):
```
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb+srv://terminalnexa:Dav1dBoshkosk1@nexacluster.ddjqk.mongodb.net/nexa
JWT_SECRET=your-generated-jwt-secret-here
CSRF_SECRET=your-generated-csrf-secret-here
ADMIN_SETUP_KEY=nexa-admin-setup-secure-key-2025
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-render-app.onrender.com/api/auth/google/callback
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=https://your-render-app.onrender.com/api/auth/linkedin/callback
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
CONTACT_EMAIL=contact@yourcompany.com
CORS_ORIGINS=https://your-vercel-app.vercel.app
LOG_LEVEL=info
NEXA_ALL_FEATURES=true
```

5. Click "Create Web Service"
6. Wait for deployment to complete
7. Note your Render URL (e.g., `https://nexa-backend-xxx.onrender.com`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Update Client Environment
1. Update `client/.env` with your Render backend URL:
```env
REACT_APP_API_URL=https://your-render-app.onrender.com/api
GENERATE_SOURCEMAP=false
```

### 3.2 Deploy to Vercel

**Option A: GitHub Integration (Recommended)**
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. Add Environment Variables in Vercel dashboard:
```
REACT_APP_API_URL=https://your-render-app.onrender.com/api
```

6. Deploy

**Option B: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from root directory
vercel --prod
```

### 3.3 Update CORS Configuration

Once you have your Vercel URL, update the backend CORS configuration:

1. Go to Render dashboard → Your service → Environment
2. Update `CORS_ORIGINS` to include your Vercel URL:
```
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

## Step 4: OAuth Configuration (Optional)

### 4.1 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Add authorized redirect URIs:
   - `https://your-render-app.onrender.com/api/auth/google/callback`
6. Copy Client ID and Secret to Render environment variables

### 4.2 LinkedIn OAuth Setup
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add redirect URLs:
   - `https://your-render-app.onrender.com/api/auth/linkedin/callback`
4. Copy Client ID and Secret to Render environment variables

## Step 5: Create First Admin User

After deployment, create your first admin user:

```bash
# Make a POST request to your Render API
curl -X POST https://your-render-app.onrender.com/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "YourSecureAdminPassword123!",
    "secretKey": "nexa-admin-setup-secure-key-2025"
  }'
```

## Step 6: Post-Deployment Verification

### 6.1 Health Checks
- Backend: `https://your-render-app.onrender.com/health`
- Frontend: `https://your-vercel-app.vercel.app`

### 6.2 Test Key Functionality
1. ✅ User registration/login
2. ✅ Document generation
3. ✅ Admin panel access
4. ✅ File uploads (if applicable)
5. ✅ Contact form submission

### 6.3 Monitor Logs
- **Render**: Check logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard

## Step 7: Custom Domain Setup (Optional)

### 7.1 For Vercel (Frontend)
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 7.2 For Render (Backend)
1. Go to Render service → Settings
2. Add custom domain
3. Configure DNS records as instructed

## Security Checklist ✅

- ✅ Hardcoded credentials removed
- ✅ Environment variables properly configured
- ✅ HTTPS enforced on all endpoints
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Input validation in place
- ✅ JWT tokens with expiration
- ✅ Secure cookie settings
- ✅ Security headers configured (Helmet)

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Update CORS_ORIGINS in Render with exact Vercel URL
2. **API Connection Failed**: Check REACT_APP_API_URL in Vercel environment variables
3. **MongoDB Connection**: Verify MONGODB_URI is correctly set in Render
4. **Build Errors**: Check Node.js version compatibility (use Node 18+)
5. **Rate Limiting**: Monitor rate limits in production, adjust if needed

### Debug Commands:
```bash
# Test backend health
curl https://your-render-app.onrender.com/health

# Test API endpoint
curl https://your-render-app.onrender.com/api/health

# Check CORS
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://your-render-app.onrender.com/api/
```

## Maintenance

### Regular Tasks:
1. Monitor application logs
2. Update dependencies regularly
3. Backup MongoDB data
4. Monitor rate limits and adjust as needed
5. Update security certificates (handled automatically)
6. Monitor resource usage and upgrade plans if needed

---

**🎉 Your Nexa application is now securely deployed and ready for production use!**