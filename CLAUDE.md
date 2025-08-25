# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexa is a bilingual (English/Macedonian) MERN stack web application that serves as an AI-powered business document generator with authentication, social features, and document automation capabilities.

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

## Common Development Commands

### Development Setup
```bash
# Install dependencies for both client and server
npm run install-client
npm run install-server

# Start development servers
npm run dev          # Starts server only (port 5002)
npm start           # Starts client only (port 3000)

# Using Docker
docker-compose up   # Full stack with MongoDB
```

### Testing
```bash
# Client tests
cd client && npm test

# Server doesn't have tests configured yet
cd server && npm test  # Will show "no test specified" error
```

### Feature Management
```bash
# Toggle features during development
cd server && npm run features              # Show current feature status
cd server && npm run features blog on      # Enable blog feature
cd server && npm run features social off   # Disable social features
```

### Production Deployment
```bash
# Build client for production
npm run build

# Server uses same codebase but different settings in production
# Production automatically enables all features
```

## Code Architecture Details

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

### Feature Toggle System
The application uses a sophisticated feature toggle system:
- **Settings Manager**: `server/config/settingsManager.js` controls feature availability
- **VS Code Integration**: Development features controlled via `.vscode/settings.json`
- **Production Override**: All features enabled in production environment
- **Route Mapping**: Features automatically map to routes, middleware, and database collections

### Document Generation System
- **Template-based**: Structured templates in `server/document_templates/`
- **Category Organization**: Employment, personal data protection, etc.
- **Dynamic Forms**: React components generate forms based on template requirements
- **DOCX Generation**: Uses `docxtemplater` for Word document creation

## Development Notes

### Environment Configuration
- **Client**: Uses proxy to `http://localhost:5001` for API calls in development
- **Server**: Defaults to port 5002, but can be configured via PORT environment variable
- **Database**: MongoDB connection configured via MONGODB_URI environment variable

### Authentication Flow
1. Login/register creates JWT token
2. Token stored in localStorage and included in API requests
3. AuthContext manages authentication state and automatic token validation
4. PrivateRoute wrapper protects authenticated pages
5. CSRF tokens fetched and included for state-changing operations

### Adding New Features
1. Add feature flag to `server/config/settingsManager.js`
2. Create route in `server/routes/`
3. Implement controller in `server/controllers/`
4. Add React components in appropriate `client/src/` folders
5. Update `toggle-features.js` for development control

### Testing Approach
- Client uses React Testing Library with Jest
- No server-side tests currently configured
- Manual testing via feature toggles and development environment

### Deployment Considerations
- **Vercel**: Client deployed to Vercel with build configuration
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **Environment Variables**: JWT_SECRET, MONGODB_URI, CSRF_SECRET required
- **Feature Flags**: All features automatically enabled in production