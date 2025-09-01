# 💻 Development Guide

## Project Overview

Nexa Terminal is a bilingual (English/Macedonian) MERN stack web application that serves as an AI-powered business document generator with authentication, social features, and document automation capabilities.

## Architecture

### Client-Server Structure
- **Client**: React frontend with React Router, i18next for internationalization, and CSS modules for styling
- **Server**: Express.js backend with MongoDB, Passport.js authentication, and modular route structure
- **Database**: MongoDB with connection pooling and index management

### Key Architectural Patterns
- **Context-based state management**: AuthContext, LanguageContext, ToastContext for global state
- **Route protection**: PrivateRoute wrapper for authenticated pages
- **Modular routing**: Express routes organized by feature (auth, documents, social, etc.)
- **Service layer pattern**: Separate service classes for business logic (UserService, SocialPostService, etc.)
- **Settings-driven features**: Dynamic feature toggling via settingsManager
- **Document templates**: Structured document generation system in `server/document_templates/`

### Security Architecture
- CSRF protection with token-based validation
- JWT authentication with token validation
- Rate limiting on API endpoints
- Input sanitization and validation middleware
- Security headers via Helmet
- CORS configuration for cross-origin requests

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd nexa.v1

# Install dependencies for both client and server
npm run install-client
npm run install-server

# Set up environment variables
cp server/.env.example server/.env
# Edit .env with your MongoDB URI and other settings
```

### Environment Configuration
```env
# Required environment variables
MONGODB_URI=mongodb://localhost:27017/nexa
JWT_SECRET=your-jwt-secret
CSRF_SECRET=your-csrf-secret
PORT=5002

# Optional email configuration
RESEND_API_KEY=your-resend-key
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-app-password
```

### Running Development Servers
```bash
# Start server only (port 5002)
npm run dev

# Start client only (port 3000)
npm start

# Using Docker (full stack with MongoDB)
docker-compose up
```

## Development Commands

### Feature Management
```bash
# Toggle features during development
cd server && npm run features              # Show current feature status
cd server && npm run features blog on      # Enable blog feature
cd server && npm run features social off   # Disable social features
```

### Testing
```bash
# Client tests
cd client && npm test

# Server tests (not configured yet)
cd server && npm test  # Will show "no test specified" error
```

### Production Build
```bash
# Build client for production
npm run build

# Production deployment uses same codebase but different settings
# Production automatically enables all features
```

## Code Architecture

### Frontend Architecture
- **Pages**: Organized under `client/src/pages/` with separate folders for `website/` (public) and `terminal/` (authenticated)
- **Components**: Reusable components in `client/src/components/` with feature-based organization
- **Styles**: CSS Modules pattern with `.module.css` files co-located with components
- **Services**: API communication centralized in `client/src/services/api.js`
- **Authentication**: Context-based auth with automatic token validation and refresh
- **Internationalization**: i18next with JSON translation files for en/mk languages

### Backend Architecture
- **Routes**: Feature-based route organization in `server/routes/`
- **Controllers**: Request handling logic in `server/controllers/`
- **Services**: Business logic in `server/services/` with dependency injection
- **Middleware**: Security, validation, and authentication middleware in `server/middleware/`
- **Models**: Database schemas in `server/models/` (MongoDB with native driver)
- **Document Templates**: Automated document generation system in `server/document_templates/`

### Database Design
- **Users Collection**: Authentication and profile data with sparse unique indexes
- **Feature Collections**: Social posts, blogs, documents, and investments collections
- **Settings-driven**: Collections enabled/disabled based on feature flags

## Development Standards & Rules

### Technology Stack Requirements
- **MERN Stack Only**: MongoDB (no Mongoose), Node.js with Express, React (no TypeScript, no Next.js)
- **Authentication**: Always enabled (required for app functionality)
- **Features**: All features enabled except blog (separate Next.js application)
- **Middleware**: All essential middleware enabled (authentication, CSRF, validation, security, CORS, rate limiting)

### Coding Standards
- Never create report files after completing tasks
- Do not create test files unless absolutely necessary (delete afterward if created)
- Never run build tests or start development servers when user has active sessions (causes port conflicts and authentication failures)
- For document generation pages: **Only use** `src/styles/terminal/documents/DocumentGeneration.module.css` - no inline styles or additional CSS files allowed

### File Organization
- VS Code workspace optimized for performance by excluding only blog directory
- All MERN features (social, documents, legal, profiles) remain visible and searchable
- Performance optimized by excluding unnecessary files (node_modules, build files)

## Feature Toggle System

The application uses a sophisticated feature toggle system:
- **Settings Manager**: `server/config/settingsManager.js` controls feature availability
- **VS Code Integration**: Development features controlled via `.vscode/settings.json`
- **Production Override**: All features enabled in production environment
- **Route Mapping**: Features automatically map to routes, middleware, and database collections

### Adding New Features
1. Add feature flag to `server/config/settingsManager.js`
2. Create route in `server/routes/`
3. Implement controller in `server/controllers/`
4. Add React components in appropriate `client/src/` folders
5. Update `toggle-features.js` for development control

## Authentication Flow

1. Login/register creates JWT token
2. Token stored in localStorage and included in API requests
3. AuthContext manages authentication state and automatic token validation
4. PrivateRoute wrapper protects authenticated pages
5. CSRF tokens fetched and included for state-changing operations

## Document Generation System

- **Template-based**: Structured templates in `server/document_templates/`
- **Category Organization**: Employment, personal data protection, etc.
- **Dynamic Forms**: React components generate forms based on template requirements
- **DOCX Generation**: Uses `docxtemplater` for Word document creation

## Environment Configuration Details

### Client Configuration
- Uses proxy to `http://localhost:5001` for API calls in development
- Build process creates optimized production bundle
- Internationalization configured for English and Macedonian

### Server Configuration
- Defaults to port 5002, configurable via PORT environment variable
- MongoDB connection configured via MONGODB_URI environment variable
- Feature toggles control which routes and middleware are enabled
- Production mode automatically enables all features

## Deployment

### Client Deployment (Vercel)
- Automatic builds from main branch
- Environment variables configured in Vercel dashboard
- Build command: `npm run build`
- Output directory: `build`

### Server Deployment (Render/Railway)
- Node.js environment with automatic dependency installation
- Environment variables configured in hosting platform
- All features enabled in production
- Health check endpoint: `/health`

### Database Deployment
- MongoDB Atlas recommended for production
- Connection string configured via MONGODB_URI
- Indexes created automatically on startup
- Backup and monitoring configured through Atlas

## Debugging and Troubleshooting

### Common Development Issues
- **Port conflicts**: Ensure no other applications are running on ports 3000 and 5002
- **Authentication failures**: Check JWT_SECRET and CSRF_SECRET in environment
- **Database connection**: Verify MONGODB_URI and database server status
- **Feature toggles**: Use `npm run features` to check current configuration

### Logging and Monitoring
- Console logging in development
- Structured logging recommended for production
- Error tracking via try/catch blocks
- Health monitoring endpoint available

### Performance Optimization
- CSS Modules for component isolation
- Lazy loading for large components
- Database indexes for query optimization
- Image optimization for static assets

---

*Last Updated: January 2025*
*Next Review: March 2025*