# Invitation System - Internal Test Guide

**Date:** November 20, 2025
**Status:** ✅ Debug Logging Added - Ready for Testing

## 🎯 What Was Added

Comprehensive console logging throughout the entire invitation flow to verify each step works correctly:

1. **Frontend (Header.js)** - Browser console logs
2. **API Route (routes/referrals.js)** - Server console logs
3. **Referral Service** - Server console logs
4. **Email Service** - Server console logs

## 📋 How to Test

### Step 1: Open the Application

1. Navigate to `http://localhost:3000`
2. Login with your account
3. **Open browser console** (F12 or Cmd+Option+I)
4. **Keep terminal visible** for server logs

### Step 2: Open Credit Modal

1. Click the credit counter in navbar (shows "14/14")
2. Modal should open
3. Scroll down to "Покани пријатели" section

### Step 3: Test Valid Single Email

**What to do:**
1. Enter `friend@example.com` in Email 1 field
2. Leave Email 2 and 3 empty
3. Click "Испрати покани"

**Expected: Browser Console Logs**
```
🎯 [Header] Invitation form submitted
📧 [Header] Collected emails: ['friend@example.com']
✅ [Header] All emails valid, sending to API...
🔑 [Header] Token exists: true
📡 [Header] API Response status: 200
📦 [Header] API Response data: {success: true, message: '...', results: {...}}
✅ [Header] Invitations sent successfully
🏁 [Header] Invitation process complete
```

**Expected: Server Console Logs**
```
🎯 [Referrals API] POST /api/referrals/invite
👤 [Referrals API] User ID: ObjectId('...')
📧 [Referrals API] Request body: { emails: ['friend@example.com'] }
📨 [Referrals API] Received emails: ['friend@example.com']
✅ [Referrals API] Validation passed, calling referralService...
🔍 [Referrals API] ReferralService available: true

🎯 [ReferralService] sendInvitations called
👤 [ReferralService] User ID: ObjectId('...')
📧 [ReferralService] Emails to send: ['friend@example.com']
👤 [ReferralService] User found: martinboshkoskilaw
🔑 [ReferralService] Existing referral code: NX-MARTINBOS-XXXX
📨 [ReferralService] Starting to process emails...

📧 [ReferralService] Processing email: friend@example.com
📝 [ReferralService] Tracking invitation...
✅ [ReferralService] Invitation tracked
📮 [ReferralService] Sending email via emailService...

🎯 [EmailService] sendInvitationEmail called
📧 [EmailService] To: friend@example.com
👤 [EmailService] Referrer: martinboshkoskilaw
🔑 [EmailService] Referral code: NX-MARTINBOS-XXXX
🏢 [EmailService] Referrer name: НЕКСА ДООЕЛ Скопје
🔗 [EmailService] Referral link: http://localhost:3000/register?ref=NX-MARTINBOS-XXXX
📨 [EmailService] Email data prepared
   From: noreply@nexa.mk
   To: ['friend@example.com']
   Subject: НЕКСА ДООЕЛ Скопје те покани да се приклучиш на Nexa Terminal
🔍 [EmailService] Resend client available: false

📧 [MOCK EMAIL] Invitation email would be sent:
==========================================
To: friend@example.com
From: НЕКСА ДООЕЛ Скопје
Referral Link: http://localhost:3000/register?ref=NX-MARTINBOS-XXXX
==========================================

✅ [ReferralService] Email sent successfully to friend@example.com

📊 [ReferralService] Final results:
   ✅ Sent: ['friend@example.com']
   ❌ Failed: []

📊 [Referrals API] Results: { sent: ['friend@example.com'], failed: [] }
✅ [Referrals API] Sent: 1, Failed: 0
```

**Expected: UI Feedback**
- Green success message appears
- Message text: "✅ Успешно испратени 1 покани!" (or similar)
- All input fields clear automatically

### Step 4: Test Multiple Valid Emails

**What to do:**
1. Enter `friend1@example.com` in Email 1
2. Enter `friend2@example.com` in Email 2
3. Enter `friend3@example.com` in Email 3
4. Click "Испрати покани"

**Expected:**
- Same log pattern as above but repeated 3 times
- Server logs show processing for each email sequentially
- Success message: "✅ Успешно испратени 3 покани!"
- All inputs clear

### Step 5: Test Invalid Email Format

**What to do:**
1. Enter `notanemail` in Email 1 (no @ symbol)
2. Click "Испрати покани"

**Expected: Browser Console**
```
🎯 [Header] Invitation form submitted
📧 [Header] Collected emails: ['notanemail']
⚠️ [Header] Invalid email format: ['notanemail']
🏁 [Header] Invitation process complete
```

**Expected: UI**
- Red error message appears
- Message: "Невалиден email формат: notanemail"
- No API call is made (check server logs - should be silent)

### Step 6: Test Empty Form

**What to do:**
1. Leave all fields empty
2. Click "Испрати покани"

**Expected: Browser Console**
```
🎯 [Header] Invitation form submitted
📧 [Header] Collected emails: []
⚠️ [Header] No emails provided
🏁 [Header] Invitation process complete
```

**Expected: UI**
- Red error message appears
- Message: "Ве молиме внесете барем еден email."
- No API call made

### Step 7: Test Loading State

**What to do:**
1. Enter a valid email
2. Click "Испрати покани"
3. **Watch immediately** before response comes back

**Expected: UI Changes**
- Button text changes to "Се испраќа..."
- Button becomes disabled (grayed out)
- All input fields become disabled
- After response: Button returns to "Испрати покани"

## 🔍 Debugging Checklist

### If No Logs Appear in Browser Console:
- ✅ Check browser console is open (F12)
- ✅ Check no filters are applied in console
- ✅ Try refreshing the page
- ✅ Check React dev tools for errors

### If No Logs Appear in Server Console:
- ✅ Check server is running on port 5002
- ✅ Check API call is being made (Network tab in browser)
- ✅ Check for authentication errors
- ✅ Verify token exists in localStorage

### If Email Not Logged as "MOCK EMAIL":
- ✅ This means RESEND_API_KEY is set
- ✅ Email will try to send via Resend API
- ✅ Check for Resend API errors
- ✅ Check Gmail fallback is attempted

## 📊 Complete Log Flow Diagram

```
Browser (Header.js)
    │
    ├─ 🎯 Form submitted
    ├─ 📧 Collect emails
    ├─ ✅ Validate format
    ├─ 🔑 Check token
    └─ 📡 Call API (/api/referrals/invite)
         │
         └─> Server (routes/referrals.js)
              │
              ├─ 🎯 Receive request
              ├─ 👤 Check user
              ├─ 📨 Validate emails
              └─ 🔍 Call ReferralService
                   │
                   └─> ReferralService
                        │
                        ├─ 🎯 Start processing
                        ├─ 👤 Find user
                        ├─ 🔑 Get/create referral code
                        └─ 📮 For each email:
                             │
                             ├─ 📝 Track invitation
                             └─ Call EmailService
                                  │
                                  └─> EmailService
                                       │
                                       ├─ 🎯 Prepare email
                                       ├─ 🏢 Get referrer name
                                       ├─ 🔗 Create referral link
                                       ├─ 📨 Build email data
                                       ├─ 🔍 Check if Resend available
                                       │
                                       ├─ If MOCK MODE:
                                       │   └─ 📧 Log to console
                                       │
                                       └─ If PRODUCTION:
                                           ├─ 📮 Send via Resend
                                           └─ 🔄 Or fallback to Gmail
```

## ✅ Success Criteria

The test is **successful** if you see:

### Browser Console:
- ✅ All 7 log emojis appear in order
- ✅ No errors in red
- ✅ API response status 200
- ✅ Success message in response data

### Server Console:
- ✅ All service logs appear
- ✅ User found correctly
- ✅ Referral code exists or is created
- ✅ Email tracked in database
- ✅ Mock email logged with correct details
- ✅ Final results show sent emails

### UI:
- ✅ Green success message appears
- ✅ Inputs clear after success
- ✅ Loading state works during submission
- ✅ Error messages work for invalid inputs

## 🚨 Common Issues & Solutions

### Issue: "Token exists: false"
**Solution:** You're not logged in. Login first.

### Issue: No server logs appear
**Solution:** API call didn't reach server. Check Network tab for errors.

### Issue: "ReferralService available: false"
**Solution:** ReferralService not initialized. Check server startup logs.

### Issue: Mock email not showing
**Solution:** RESEND_API_KEY might be set. Check .env file.

### Issue: Invalid email passes validation
**Solution:** Email regex might be wrong. Check console for actual email collected.

## 📝 What to Report

After testing, please report:

1. **Which test cases passed** (1-7)
2. **Any errors in browser console** (screenshot)
3. **Any errors in server console** (copy text)
4. **UI behavior** (success messages, errors, loading states)
5. **Mock email details** (from server logs)

## 🎬 Next Steps

After successful testing:
1. Test complete flow → Proceed to deployment
2. Any issues found → I'll fix them
3. Email sending works → Configure RESEND_API_KEY for production

---

**Ready to Test?**
1. Open browser console
2. Keep server terminal visible
3. Click credit counter → Scroll to invitations
4. Test each scenario above
5. Report results!

**Status:** ✅ All logging added - Waiting for your test results
