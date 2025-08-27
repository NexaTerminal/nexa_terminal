# Nexa Local Development Guide

This guide explains how to run and test the Nexa application locally before deploying.

## Prerequisites

- Node.js 18+ installed
- MongoDB connection (using same database as production)
- Git repository cloned

## Environment Setup

The application uses different environment configurations:

### Production (.env)
- Used for deployed version on Render
- Port 5002, production settings

### Development (.env.development, .env.local)
- Used for local development  
- Port 5001, development settings
- More relaxed rate limiting
- Debug logging enabled

## Quick Start - Localhost Development

### Option 1: One-Command Start (Recommended)
```bash
# From project root directory
./start-dev.sh
```
This automatically starts both servers and shows you the status.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend Server:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm install  
npm start
```

### Stop Development Environment
```bash
# Stop all servers
./stop-dev.sh

# Or press Ctrl+C in the terminal running start-dev.sh
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Employment Agreement:** http://localhost:3000/terminal/documents/employment/employment-agreement

## Environment Files

### Server Environment Files:
- **`.env`** - Production settings (committed to Git)
- **`.env.development`** - Development settings (ignored by Git)

### Client Environment Files:
- **`.env`** - Production API URL (committed to Git)
- **`.env.local`** - Development API URL (ignored by Git)

## Database Connection

Both development and production use the same MongoDB database:
```
mongodb+srv://terminalnexa:Dav1dBoshkosk1@nexacluster.ddjqk.mongodb.net/nexa
```

This allows you to test with real data without affecting deployment.

## API Endpoints

### Development (localhost):
- Backend: `http://localhost:5001/api`
- Frontend: `http://localhost:3000`

### Production (deployed):
- Backend: `https://nexa-v1-zj2p.onrender.com/api`
- Frontend: `https://your-vercel-url.vercel.app`

## Testing New Features

1. **Develop locally first**:
   ```bash
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Client  
   cd client && npm start
   ```

2. **Test functionality** on `http://localhost:3000`

3. **Commit and push** when ready:
   ```bash
   git add .
   git commit -m "Your feature description"
   git push origin main
   ```

4. **Auto-deployment** will trigger on Vercel and Render

## Key Differences: Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Port | 5001 | 5002 |
| Logging | debug | info |
| Rate Limits | 1000/100 requests | 100/10 requests |
| CORS | localhost:3000 | Vercel domains |
| Source Maps | enabled | disabled |

## Scripts Reference

### Server Scripts:
```bash
npm start          # Production mode
npm run dev        # Development mode (recommended)
npm run dev-simple # Simple nodemon restart
npm run features   # Toggle features on/off
```

### Client Scripts:
```bash
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
```

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Make sure nothing else is running on ports 3000 or 5001
2. **Environment variables**: Check that `.env.local` and `.env.development` are created
3. **Database connection**: Verify MongoDB URI is correct
4. **API calls failing**: Check that REACT_APP_API_URL points to localhost:5001

### Debug Steps:
```bash
# Check server logs
cd server && npm run dev

# Check client environment
cd client && cat .env.local

# Test API directly
curl http://localhost:5001/health
```

## File Structure
```
nexa.v1/
├── server/
│   ├── .env                    # Production (committed)
│   ├── .env.development        # Development (ignored)
│   └── package.json
├── client/
│   ├── .env                    # Production (committed) 
│   ├── .env.local              # Development (ignored)
│   └── package.json
├── .gitignore                  # Ignores .env.development and .env.local
└── DEVELOPMENT.md              # This file
```

## Security Notes

- Development files (`.env.development`, `.env.local`) are ignored by Git
- Production files (`.env`, `client/.env`) are committed for deployment
- Same database credentials used for testing (but separate from any future prod DB)
- Development has relaxed security settings for easier testing

---

**Happy coding! 🚀 Test locally first, deploy when ready!**