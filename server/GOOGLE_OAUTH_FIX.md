# Google OAuth Fix - Deep Debugging Summary

## 🐛 THE BUG

The error `"Unknown authentication strategy \"google\""` was caused by a **route loading order issue**.

### Root Cause
In `server/server.js`, the routes were being loaded in the **WRONG ORDER**:

```javascript
// ❌ BEFORE (Lines 105-110) - WRONG ORDER
app.use(passport.initialize());

// Routes loaded HERE - BEFORE passport strategies are configured
app.use('/api/auth', require('./routes/auth'));  // Google OAuth route loaded
app.use('/api/users', require('./routes/users'));
app.use('/api/documents', require('./routes/documents'));
```

But the passport strategies (including Google) were only configured much later:

```javascript
// ✅ CORRECT ORDER (Lines 500-505)
async function initializeServer() {
  const database = await connectToDatabase();
  require('./config/passport')(database);  // Strategies registered HERE
  registerRoutes();  // Routes should be loaded HERE
}
```

### The Problem
1. Server starts
2. Routes load at line 108 (including Google OAuth routes)
3. Routes reference `passport.authenticate('google')`
4. **BUT** the Google strategy hasn't been registered yet!
5. Much later, passport strategies are registered (line 503)
6. Too late - routes already cached the old passport state

## 🔧 THE FIX

**Removed duplicate route loading** from top-level and ensured routes are **ONLY** loaded inside `registerRoutes()` function, which runs **AFTER** passport initialization.

### Changes Made:

1. **server/server.js** (Lines 105-110)
   ```javascript
   // BEFORE
   app.use('/api/auth', require('./routes/auth'));
   app.use('/api/users', require('./routes/users'));
   app.use('/api/documents', require('./routes/documents'));

   // AFTER
   // API Routes will be registered after passport strategies are configured
   // See registerRoutes() function below
   ```

2. **Added comprehensive debug logging**:
   - Environment variable loading (`server/server.js` lines 5-11)
   - Passport strategy registration (`server/config/passport.js`)
   - Route loading (`server/routes/auth.js`)

## 📊 WHAT YOU SHOULD SEE

When you restart the server, you should see this **EXACT ORDER** in console:

```
🌍 [ENV] Loading environment from: .env.development
🌍 [ENV] NODE_ENV: development
🌍 [ENV] PORT: 5002
🌍 [ENV] GOOGLE_CLIENT_ID: SET (264091914823-c0ijsqp...)
🌍 [ENV] GOOGLE_CLIENT_SECRET: SET
🌍 [ENV] GOOGLE_CALLBACK_URL: http://localhost:5002/api/auth/google/callback

... (database connection logs) ...

🔧 [PASSPORT] Initializing passport strategies...
🔧 [PASSPORT] Database connection: Connected
✅ [PASSPORT] Registering JWT strategy
✅ [PASSPORT] Registering Local (email) strategy
✅ [PASSPORT] Registering Local (username) strategy
🔍 [PASSPORT] Checking Google OAuth credentials...
🔍 [PASSPORT] GOOGLE_CLIENT_ID: SET (264091914823-c0ijsqp...)
🔍 [PASSPORT] GOOGLE_CLIENT_SECRET: SET
🔍 [PASSPORT] GOOGLE_CALLBACK_URL: http://localhost:5002/api/auth/google/callback
✅ [PASSPORT] Registering Google OAuth strategy
🎉 [PASSPORT] Google OAuth strategy registered successfully!
🎯 [PASSPORT] All passport strategies initialized

📡 [ROUTES] Registering API routes...
🔐 [ROUTES] Loading auth routes (including Google OAuth)...
✅ [ROUTES] Auth routes loaded successfully
```

## ✅ TESTING STEPS

1. **Stop your current server** (Ctrl+C)

2. **Restart the backend:**
   ```bash
   npm run dev
   ```

3. **Check the console logs** - Verify you see the order above with:
   - ✅ Google OAuth strategy registered
   - ✅ Auth routes loaded AFTER passport initialization

4. **Test the OAuth flow:**
   - Go to `http://localhost:3000/login`
   - Click "Најавете се со Google"
   - You should be redirected to Google login
   - After authenticating, you should be logged into Nexa Terminal

5. **Check the console when clicking the button:**
   You should see:
   ```
   🚀 [AUTH] Google OAuth flow initiated
   🚀 [AUTH] Available strategies: ['session', 'jwt', 'local', 'local-username', 'google']
   ```

## 🎯 EXPECTED BEHAVIOR

### Success Flow:
1. User clicks "Најавете се со Google"
2. Redirects to `http://localhost:5002/api/auth/google`
3. Server logs: `🚀 [AUTH] Google OAuth flow initiated`
4. Redirects to Google login page
5. User authenticates with Google
6. Google redirects to `http://localhost:5002/api/auth/google/callback?code=...`
7. Server logs: `🔄 [AUTH] Google OAuth callback received`
8. Server logs: `✅ [AUTH] Google OAuth authentication successful`
9. Creates/updates user in database
10. Generates JWT token
11. Redirects to `http://localhost:3000/auth/callback?token=xxx`
12. User logged into Nexa Terminal dashboard

### If it STILL fails:
- Check the console logs for any missing steps
- Verify Google Cloud Console redirect URIs include:
  - `http://localhost:5002/api/auth/google/callback`
  - `http://localhost:3000/auth/callback`

## 📝 FILES MODIFIED

1. `server/.env.development` - Added Google OAuth credentials
2. `server/.env` - Added Google OAuth credentials
3. `server/.env.production` - Added production Google OAuth credentials
4. `server/server.js` - Fixed route loading order + debug logging
5. `server/config/passport.js` - Added debug logging + enhanced user creation
6. `server/routes/auth.js` - Added Google OAuth routes + debug logging
7. `client/package.json` - Updated proxy to port 5002
8. `client/src/pages/website/Login.js` - Added Google Sign-In button
9. `client/src/styles/website/Login.module.css` - Added Google button styles
10. `client/src/App.js` - Added `/auth/callback` route

## 🔍 DEBUGGING TOOLS CREATED

1. `server/test-google-oauth.js` - Test environment variables
   ```bash
   node test-google-oauth.js
   ```

2. `server/list-passport-strategies.js` - List registered strategies
   ```bash
   node list-passport-strategies.js
   ```

---

**Ready to test!** 🚀
