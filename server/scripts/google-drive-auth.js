#!/usr/bin/env node
/**
 * scripts/google-drive-auth.js — one-time helper to mint a Google Drive
 * refresh token for the scheduled backup (Phase 2).
 *
 * Prerequisites (Google Cloud Console, do once):
 *   1. Create/select a project → enable the "Google Drive API".
 *   2. APIs & Services → Credentials → Create Credentials → OAuth client ID
 *      → Application type "Web application".
 *      Add Authorized redirect URI: http://localhost:5002/oauth2callback
 *   3. OAuth consent screen → add YOUR Gmail as a Test user (so consent works
 *      without app verification).
 *   4. Put the client id/secret in server/.env:
 *        GOOGLE_DRIVE_CLIENT_ID=...
 *        GOOGLE_DRIVE_CLIENT_SECRET=...
 *
 * Then run:   node scripts/google-drive-auth.js
 * It starts a tiny local server on the redirect URI, opens (prints) a consent
 * URL, captures the code, and prints the GOOGLE_DRIVE_REFRESH_TOKEN to add to
 * .env. Nothing is written for you — you copy the line in.
 */

const http = require('http');
const path = require('path');
const { URL } = require('url');
const { google } = require('googleapis');

const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const { DRIVE_SCOPES } = require('../services/googleDriveService');

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5002/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET in', envFile);
  console.error('See the header of this file for the Google Cloud Console setup.');
  process.exit(1);
}

const redirect = new URL(REDIRECT_URI);
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',   // required to receive a refresh_token
  prompt: 'consent',        // force a refresh_token even on re-consent
  scope: DRIVE_SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith(redirect.pathname)) {
    res.writeHead(404).end();
    return;
  }
  const code = new URL(req.url, REDIRECT_URI).searchParams.get('code');
  if (!code) {
    res.writeHead(400).end('No code in callback.');
    return;
  }
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>✅ Got it. You can close this tab and return to the terminal.</h2>');

    console.log('\n========================================================');
    if (tokens.refresh_token) {
      console.log('Add this line to server/.env:\n');
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log('⚠️  No refresh_token returned. Revoke the app\'s access at');
      console.log('   https://myaccount.google.com/permissions and run again');
      console.log('   (refresh_token is only issued on first consent).');
    }
    console.log('========================================================\n');
  } catch (e) {
    res.writeHead(500).end('Token exchange failed: ' + e.message);
    console.error('Token exchange failed:', e.message);
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500);
  }
});

const port = Number(redirect.port) || 80;
server.listen(port, () => {
  console.log(`\nListening for the OAuth callback on ${REDIRECT_URI}`);
  console.log('\n1) Open this URL in your browser (signed in as the backup Gmail):\n');
  console.log('   ' + authUrl + '\n');
  console.log('2) Approve access. The refresh token prints here when you return.\n');
});
