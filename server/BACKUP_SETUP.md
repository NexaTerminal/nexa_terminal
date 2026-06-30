# Database Backup — Setup & Usage

Backs up **all MongoDB collections** to a single `.zip` (Extended JSON per
collection, lossless BSON types). Pure-Node — no `mongodump` needed, so it runs
anywhere including Railway.

There are three layers, independent of each other:

| Layer | What | Status |
|-------|------|--------|
| **Phase 1** | On-demand backup: `npm run backup` (local zip) + `GET /api/admin/backup` (download button) | ✅ live, no setup |
| **Phase 2** | Weekly cron on Railway → uploads zip to Google Drive → prunes → emails you | ✅ code done, needs Google setup below |
| **Phase 3** | MongoDB Atlas built-in snapshot/PITR backups | enable in Atlas UI (separate, recommended) |

---

## Phase 1 — manual backup (works today)

```bash
cd server
npm run backup                                  # -> server/backups/nexa-backup-<date>.zip
npm run backup -- --out ~/"Google Drive/Nexa Backups"   # write straight to a Drive-synced folder
```

Or, as admin in the app, hit `GET /api/admin/backup` to download the zip.

Zip layout:
```
_manifest.json            # db name, timestamp, per-collection doc counts
collections/<name>.json   # EJSON array of that collection
```

> ⚠️ Backups contain PII (EMBG, company data). `server/backups/` is gitignored.
> Keep any copy (Drive, disk) private.

---

## Phase 2 — automated weekly backup to Google Drive

**Where it runs:** the cron lives in `server.js`, which runs on **Railway**, so
the real backups execute on Railway against **production Atlas** and upload to
Drive. Vercel (frontend) is not involved. Your laptop is used **only once** to
mint a refresh token.

**Auth:** OAuth2 refresh token for a **personal Gmail** (a service account has
0 bytes of Drive quota and can't write to a personal My Drive).

### ① Google Cloud Console (~5 min)
1. https://console.cloud.google.com → **New Project** `nexa-backups` → select it.
2. **APIs & Services → Library** → search **"Google Drive API"** → **Enable**.
3. **APIs & Services → OAuth consent screen** → **External** → app name
   `Nexa Backups`, your Gmail in both email fields → save →
   **Publish app**.
   *(Publishing avoids the 7-day refresh-token expiry that "Testing" mode
   imposes. The `drive.file` scope is non-sensitive, so no Google review.)*
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   **Web application** → under **Authorized redirect URIs** add **exactly**:
   ```
   http://localhost:5055/oauth2callback
   ```
   → **Create** → copy the **Client ID** and **Client secret**.

### ② Local `.env` (just enough to mint the token)
Add to `server/.env`:
```env
GOOGLE_DRIVE_CLIENT_ID=<client id>
GOOGLE_DRIVE_CLIENT_SECRET=<client secret>
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5055/oauth2callback
```

### ③ Mint the refresh token (on your laptop)
```bash
cd server && npm run drive-auth
```
Open the printed URL (signed in as the backup Gmail) → approve. The terminal
prints:
```
GOOGLE_DRIVE_REFRESH_TOKEN=1//0g....
```
Copy that whole value.

### ④ (optional) Target a Drive folder
Make a folder in Google Drive (e.g. "Nexa Backups"), open it, copy the id from
the URL: `drive.google.com/drive/folders/`**`<THIS>`**.
Omit to upload into My Drive root.

### ⑤ Railway — the config that actually runs backups
Railway dashboard → backend service → **Variables** → add:
```
BACKUP_SCHEDULE_ENABLED=true
GOOGLE_DRIVE_CLIENT_ID=<same as local>
GOOGLE_DRIVE_CLIENT_SECRET=<same as local>
GOOGLE_DRIVE_REFRESH_TOKEN=<minted in ③>
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5055/oauth2callback
GOOGLE_DRIVE_FOLDER_ID=<from ④, or omit>
BACKUP_NOTIFY_EMAIL=terminalnexa@gmail.com
```
> `GOOGLE_DRIVE_REDIRECT_URI` stays `localhost` even on Railway — it's only
> metadata the token flow already consumed; Railway never opens that port.

Railway redeploys on save. In the deploy logs you should see:
```
✅ Backup scheduler initialized
[BackupScheduler] ⏰ scheduled "0 3 * * 0" (Europe/Skopje), keep 8
```

### ⑥ Test it now (don't wait for Sunday)
`POST https://<your-railway-domain>/api/admin/backup/run-now` with your admin
token. Expect: JSON summary returned + an email + the zip appearing in Drive.

---

## Configuration reference

All optional; sensible defaults in `config/backupConfig.js`. Template:
`server/.env.backup.example`.

| Env var | Default | Meaning |
|---------|---------|---------|
| `BACKUP_SCHEDULE_ENABLED` | `false` | Master switch for the cron |
| `BACKUP_CRON` | `0 3 * * 0` | Schedule (cron, in `TZ_MK`) — weekly Sun 03:00 |
| `TZ_MK` | `Europe/Skopje` | Timezone for the cron |
| `BACKUP_RETENTION` | `8` | Keep this many newest zips in Drive |
| `BACKUP_NOTIFY_EMAIL` | `terminalnexa@gmail.com` | Where success/failure emails go |
| `GOOGLE_DRIVE_CLIENT_ID` | — | OAuth client id |
| `GOOGLE_DRIVE_CLIENT_SECRET` | — | OAuth client secret |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | — | From `npm run drive-auth` |
| `GOOGLE_DRIVE_REDIRECT_URI` | `http://localhost:5055/oauth2callback` | Must match Google Console |
| `GOOGLE_DRIVE_FOLDER_ID` | — | Target folder (empty = My Drive root) |

The feature is **inert** unless `BACKUP_SCHEDULE_ENABLED=true` **and** the three
`GOOGLE_DRIVE_*` credentials are present. An unconfigured deploy is a safe no-op.

---

## Restore (when you ever need it)

Each `collections/<name>.json` is an EJSON array. To restore a collection:

```js
const { EJSON } = require('bson');
const fs = require('fs');
const docs = EJSON.parse(fs.readFileSync('collections/users.json', 'utf8'));
await db.collection('users').insertMany(docs);   // EJSON preserves ObjectId/Date/etc.
```

(A `scripts/restore.js` helper can be added — not built yet.)

---

## Files

| File | Role |
|------|------|
| `services/backupService.js` | Shared core: dump all collections → EJSON → zip |
| `scripts/backup.js` | CLI (`npm run backup`) |
| `routes/adminBackup.js` | `GET /api/admin/backup`, `POST /api/admin/backup/run-now` |
| `config/backupConfig.js` | Phase 2 config (env-driven) |
| `services/googleDriveService.js` | Drive v3 upload / list / prune (OAuth2) |
| `services/backupScheduler.js` | Weekly cron → backup → upload → prune → email |
| `scripts/google-drive-auth.js` | One-time token minter (`npm run drive-auth`) |
| `.env.backup.example` | Env template |

---

## Troubleshooting

- **`redirect_uri_mismatch`** — the URI in Google Console ≠ your `.env`. Make
  all copies byte-identical (`http://localhost:5055/oauth2callback`).
- **No refresh token printed** — you already consented once. Revoke at
  https://myaccount.google.com/permissions and re-run `npm run drive-auth`
  (refresh tokens are only issued on first consent).
- **Token stops working after ~7 days** — the OAuth app is still in "Testing".
  Publish it (consent screen → Publish app).
- **`EADDRINUSE` on `npm run drive-auth`** — port 5055 is taken; close whatever
  uses it (it does not need your dev server).
- **Scheduler not scheduling** — check Railway logs: it prints why
  (`disabled`, `Drive not configured`, or `invalid BACKUP_CRON`).
