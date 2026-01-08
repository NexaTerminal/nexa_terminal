# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexa Terminal is a bilingual (English/Macedonian) MERN stack business document automation platform. The application generates professional legal documents for Macedonian businesses through a web interface with company verification and user management.

## Development Commands

### Setup & Installation
```bash
# Install dependencies for both client and server
npm run install-client
npm run install-server

# Copy and configure environment variables
cp server/.env.example server/.env
```

### Running Development Servers
```bash
# Backend server (port 5002) - includes API, database, document generation
npm run dev            # Development mode with nodemon
cd server && npm run dev-simple  # Simple nodemon without NODE_ENV

# Frontend client (port 3000) - React app with proxy to localhost:5001
npm start             # React development server
cd client && npm start

# Individual testing
cd client && npm test  # React Testing Library tests
cd server && npm test  # Shows "no test specified" (no server tests configured)
```

### Feature Management
```bash
# Control which features are enabled in development
cd server && npm run features                    # Show current status
cd server && npm run features authentication on  # Enable specific feature
cd server && npm run features social off        # Disable feature
```

### Production Build
```bash
npm run build         # Builds client for production (calls cd client && npm install && npm run build)
cd client && npm run vercel-build  # Vercel-specific build command
```

## Architecture Overview

### Client-Server Structure
- **Client**: React 19 + React Router + i18next (internationalization) + CSS Modules
- **Server**: Express.js + MongoDB (native driver) + JWT auth + Socket.io
- **Proxy Setup**: Client development server proxies API calls to `http://localhost:5001`
- **Port Configuration**: Client on 3000, Server on 5002, but proxy expects 5001

### Key Architectural Patterns

#### Feature Toggle System
The application uses a sophisticated feature management system controlled by `server/config/settingsManager.js`:
- **Development**: Features controlled via `.vscode/settings.json` under `"nexa.features"`
- **Production**: All features automatically enabled (override via `NODE_ENV=production`)
- **Toggle Script**: `server/toggle-features.js` provides CLI for enabling/disabling features

#### Authentication & Authorization Flow
- **JWT-based**: Tokens stored in localStorage, included in API headers
- **Context Management**: `client/src/contexts/AuthContext.js` manages global auth state
- **Route Protection**: Components wrapped with authentication checks
- **CSRF Protection**: Server implements CSRF tokens for state-changing operations
- **Role-based Access**: Users, verified companies, and admins with different permissions

#### Document Generation System
- **Template-based**: DOCX templates in `server/document_templates/` (employment, personal data)
- **Dynamic Forms**: React components generate forms based on template requirements
- **Company Data Integration**: All documents pull company info from `user.companyInfo`
- **Validation Rules**: 13-digit PIN validation for Macedonian personal identification
- **Categories**: Employment documents, personal data protection, etc.

### Critical Business Rules

#### Company Verification Requirements
- Users must have `isVerified: true` to access premium features
- Verification process involves email confirmation of business email address
- Company data stored in `user.companyInfo` with required fields: `companyName`, `address`, `taxNumber`, `role`

#### Document Template Standards
- **PIN/EMBG Validation**: Exactly 13 digits required (Macedonian standard)
- **Company Data Source**: ALL documents MUST use `req.user.companyInfo`
- **Template Parameters**: User data, form data, company data passed in that order
- **DOCX Generation**: Uses `docxtemplater` library for Word document creation

### Database Design
- **MongoDB Collections**: Users (with embedded company info), social posts, analytics
- **User Schema**: Includes authentication, profile, company info, verification status
- **Settings-driven Collections**: Some collections enabled/disabled based on feature flags
- **No Mongoose**: Uses native MongoDB driver for database operations

### Client Architecture

#### Page Organization
- **Public Pages**: `client/src/pages/website/` - Landing page, about, contact
- **Authenticated Pages**: `client/src/pages/terminal/` - Dashboard, documents, profile
- **Admin Pages**: `client/src/pages/terminal/admin/` - User management, system admin

#### Component Structure
- **Common Components**: `client/src/components/common/` - Header, sidebars, shared UI
- **Feature Components**: `client/src/components/terminal/` - Business logic components
- **Document Components**: `client/src/components/documents/` - Document generation forms
- **Form Components**: `client/src/components/forms/` - Reusable form elements

#### Styling System
- **CSS Modules**: `.module.css` files co-located with components
- **Global Styles**: `client/src/styles/global.css` with CSS custom properties
- **Document Pages**: MUST use `client/src/styles/terminal/documents/DocumentGeneration.module.css`
- **Design Tokens**: Brand colors, typography, spacing defined in CSS variables

#### State Management
- **Context Pattern**: AuthContext, LanguageContext for global state
- **Local State**: Component-level useState for form data and UI state
- **API Integration**: Centralized in `client/src/services/api.js`

### Server Architecture

#### Route Organization
```
server/routes/
├── auth.js          # Authentication endpoints
├── autoDocuments.js # Document generation endpoints
├── admin.js         # Admin management endpoints
├── verification.js  # Company verification endpoints
└── ...
```

#### Controller Pattern
- **Feature Controllers**: `server/controllers/` organized by business domain
- **Document Controllers**: `server/controllers/autoDocuments/` for each document type
- **Base Controller**: Shared logic for document generation controllers
- **Admin Controllers**: User management, system administration

#### Service Layer
- **Business Logic**: `server/services/` contains reusable business operations
- **Email Service**: `server/services/emailService.js` - Resend API + Gmail fallback
- **User Service**: User CRUD operations, profile management
- **Document Generators**: Specialized services for different document types

#### Middleware Stack
- **Authentication**: JWT validation middleware
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Request sanitization and validation
- **Security Headers**: Helmet.js for security headers
- **CORS**: Cross-origin request handling

### Development Environment

#### Environment Variables
```env
# Required
MONGODB_URI=mongodb://localhost:27017/nexa
JWT_SECRET=your-jwt-secret
CSRF_SECRET=your-csrf-secret

# Optional
RESEND_API_KEY=your-resend-key
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password
NODE_ENV=development
PORT=5002
```

#### VS Code Configuration
Feature toggles stored in `.vscode/settings.json`:
```json
{
  "nexa.features": {
    "authentication": true,
    "documentAutomation": true,
    "socialPosts": true
    "blog": false
  }
}
```

### Deployment Configuration

#### Client (Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `build/`
- **Environment**: Production URLs configured in env variables

#### Server (Render/Railway)
- **Start Command**: `npm start`
- **Auto-scaling**: Production mode enables all features automatically
- **Health Check**: Available endpoints for monitoring

### Key Development Rules

#### Port Management
- **NEVER** start dev servers if user has active sessions - causes authentication failures
- Client proxies to port 5001, but server runs on 5002 - verify proxy configuration
- Use separate terminal sessions for client and server during development

#### Styling Standards
- Document generation pages: Only use `DocumentGeneration.module.css`
- No inline styles allowed in React components
- CSS Modules pattern required for component-specific styles
- Global styles only for design tokens and resets

#### Feature Development
- Add new features to `settingsManager.js` feature flags first
- Test with feature toggles before production deployment
- All features automatically enabled in production environment

#### Database Operations
- Use native MongoDB driver (no Mongoose)
- Company verification status stored in user document
- User profile completion tracked via `profileComplete` boolean
- All document operations require verified company status