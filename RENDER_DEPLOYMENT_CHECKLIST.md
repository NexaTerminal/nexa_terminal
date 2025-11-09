# 🚀 Render Deployment Checklist

## ✅ What's Already Done
- ✅ All code pushed to GitHub (`feature/comprehensive-style-review` branch)
- ✅ New secure secrets generated (JWT, CSRF, Admin Setup Key)
- ✅ Production environment file created: `render-production.env`

---

## 🔐 Keys You Need to Rotate (Replace in render-production.env)

### 1. OpenAI API Key
**Current Status:** ❌ EXPOSED - Must rotate immediately

**Steps:**
1. Go to: https://platform.openai.com/api-keys
2. Sign in with your account
3. **Revoke** the old key (starts with `sk-proj--S4vrdeOep...`)
4. Click **"Create new secret key"**
5. Name: `Nexa Terminal Production`
6. **Copy the key** (you won't see it again!)
7. In `render-production.env`, replace:
   ```
   OPENAI_API_KEY=<paste-your-new-key-here>
   ```

---

### 2. Qdrant API Key
**Current Status:** ❌ EXPOSED - Must rotate immediately

**Steps:**
1. Go to: https://cloud.qdrant.io/
2. Sign in to your account
3. Click on your cluster: `0e2686c0-8c77-46df-847e-5f7d6012fe3e`
4. Navigate to **"API Keys"** section
5. **Delete** the old key (starts with `eyJhbGci...`)
6. Click **"Create API Key"**
7. **Copy the new key**
8. In `render-production.env`, replace:
   ```
   QDRANT_API_KEY=<paste-your-new-key-here>
   ```

---

### 3. Google OAuth Credentials
**Current Status:** ❌ EXPOSED - Must rotate immediately

**Steps:**
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to **"APIs & Services" → "Credentials"**
4. Find OAuth 2.0 Client ID: `264091914823-c0ijsqppmlt146s6ncrqvq8p3oomlhmn`
5. **Delete** this OAuth client
6. Click **"Create Credentials" → "OAuth 2.0 Client ID"**
7. Settings:
   - **Application type:** Web application
   - **Name:** Nexa Terminal Production
   - **Authorized JavaScript origins:**
     - `https://www.nexa.mk`
     - `https://nexa.mk`
   - **Authorized redirect URIs:**
     - `https://nexa-terminal-api.onrender.com/api/auth/google/callback`
8. Click **"Create"**
9. **Copy Client ID and Client Secret**
10. In `render-production.env`, replace:
    ```
    GOOGLE_CLIENT_ID=<paste-new-client-id>
    GOOGLE_CLIENT_SECRET=<paste-new-client-secret>
    ```

---

### 4. Resend API Key
**Current Status:** ❌ EXPOSED - Must rotate immediately

**Steps:**
1. Go to: https://resend.com/api-keys
2. Sign in with your account
3. **Delete** the old key (starts with `re_b7tXbBSB...`)
4. Click **"Create API Key"**
5. Settings:
   - **Name:** Nexa Terminal Production
   - **Permission:** Full Access (or "Sending access" only)
6. **Copy the new key**
7. In `render-production.env`, replace:
   ```
   RESEND_API_KEY=<paste-your-new-key-here>
   ```

---

## 📤 Upload to Render

### Option 1: Using Render Dashboard (Recommended)
1. Go to: https://dashboard.render.com/
2. Select your **backend service** (nexa-terminal-api)
3. Click **"Environment"** in left sidebar
4. Click **"Add from .env"** button (top right)
5. **Copy all contents** from `render-production.env`
6. **Paste** into the text area
7. Click **"Save Changes"**
8. Render will **automatically redeploy**

### Option 2: Manual Entry
1. Go to: https://dashboard.render.com/
2. Select your backend service
3. Click **"Environment"** in left sidebar
4. For each variable in `render-production.env`:
   - Click **"Add Environment Variable"**
   - Enter **Key** and **Value**
   - Click **"Add"**
5. Click **"Save Changes"** when done

---

## 🔍 Verification After Deployment

Once Render finishes deploying (watch the "Logs" tab):

### 1. Check Backend Health
```bash
curl https://nexa-terminal-api.onrender.com/api/health
```
Expected: Should return server status

### 2. Check Chatbot Limits Endpoint
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     https://nexa-terminal-api.onrender.com/api/chatbot/limits
```
Expected: Should return question limits

### 3. Test Frontend
1. Go to: https://www.nexa.mk/terminal/ai-chat
2. Log in with your account
3. Try asking a question
4. Should see AI response with sources

---

## ⚠️ Important Notes

### After Rotating JWT Secret:
- ❌ **All users will be logged out**
- Users need to log in again
- This is normal and expected

### After Rotating Google OAuth:
- Update authorized URLs if your frontend URL changes
- Test Google Sign-In after deployment

### Document Processing:
- The legal documents are in `server/legal sources/`
- You need to process them ONCE to populate Qdrant
- Run the processing script after deployment (see below)

---

## 📚 Process Legal Documents (One-Time Setup)

After deployment, you need to process documents and upload embeddings to Qdrant:

### Option 1: Run Locally Then Sync
```bash
cd server
node scripts/process-documents.js
```
This will process all documents in `legal sources/` and upload to Qdrant cloud.

### Option 2: Run on Render (Recommended)
1. Go to Render Dashboard → Your Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd server
   node scripts/process-documents.js
   ```
4. Wait for processing to complete (may take 5-10 minutes)

---

## 📋 Quick Reference - What Changed

| Variable | Status | Action Required |
|----------|--------|-----------------|
| JWT_SECRET | ✅ NEW | Already updated in file |
| CSRF_SECRET | ✅ NEW | Already updated in file |
| ADMIN_SETUP_KEY | ✅ NEW | Already updated in file |
| OPENAI_API_KEY | ❌ PLACEHOLDER | You must rotate & replace |
| QDRANT_API_KEY | ❌ PLACEHOLDER | You must rotate & replace |
| GOOGLE_CLIENT_ID | ❌ PLACEHOLDER | You must rotate & replace |
| GOOGLE_CLIENT_SECRET | ❌ PLACEHOLDER | You must rotate & replace |
| RESEND_API_KEY | ❌ PLACEHOLDER | You must rotate & replace |

---

## 🆘 Troubleshooting

### If Deployment Fails:
1. Check **"Logs"** tab in Render
2. Look for environment variable errors
3. Ensure all `<REPLACE_THIS>` placeholders are filled

### If Chatbot Doesn't Work:
1. Verify OpenAI API key is valid
2. Verify Qdrant API key is valid
3. Check if documents are processed in Qdrant
4. Check Render logs for errors

### If Google OAuth Fails:
1. Verify redirect URI matches exactly
2. Check Client ID and Secret are correct
3. Ensure authorized origins include your domain

---

## ✅ Final Checklist

- [ ] Rotate OpenAI API key
- [ ] Rotate Qdrant API key
- [ ] Rotate Google OAuth credentials
- [ ] Rotate Resend API key
- [ ] Replace all placeholders in `render-production.env`
- [ ] Upload environment variables to Render
- [ ] Wait for Render deployment to complete
- [ ] Process legal documents to Qdrant
- [ ] Test chatbot on production site
- [ ] Verify all features working

---

**Need help? Check the logs or ask for assistance!**
