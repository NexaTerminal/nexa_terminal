# Verification Email URL Fix

## Problem
Verification emails in production were showing `http://localhost:5001` links instead of the production server URL `https://nexa-terminal-api.onrender.com`.

## Root Cause
The `SERVER_URL` environment variable was not set on Render, causing the code to fall back to the default value:
```javascript
const baseUrl = process.env.SERVER_URL || 'http://localhost:5001';
```

## Solution
Added environment variables to `server/render.yaml`:

```yaml
env:
  - key: SERVER_URL
    value: https://nexa-terminal-api.onrender.com
  - key: CLIENT_URL
    value: https://www.nexa.mk
```

### What These Variables Do:

**SERVER_URL**: Used for generating verification email links
- Location: `server/controllers/verificationController.js:431`
- Example: `https://nexa-terminal-api.onrender.com/api/verification/verify-email?token=...`

**CLIENT_URL**: Used for redirecting after email verification
- Location: `server/controllers/verificationController.js:477, 495, 521, 525`
- Example: Redirects to `https://www.nexa.mk/verification-result?success=true`

## Deployment
The fix has been committed and pushed to GitHub:
- Commit: `475c32d`
- Branch: `main`

Render will automatically redeploy with the new environment variables. This typically takes **3-5 minutes**.

## Verification
After Render redeploys:
1. Request a new verification email
2. Check that the email contains: `https://nexa-terminal-api.onrender.com/api/verification/verify-email?token=...`
3. Click the link and verify it redirects to: `https://www.nexa.mk/verification-result?success=true`

## Note
Existing verification emails with localhost links will not work. Users will need to request a new verification email after the deployment completes.
