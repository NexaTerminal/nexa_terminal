# 🏢 Nexa Terminal

A bilingual (English/Macedonian) MERN stack business document automation platform with AI-powered features.

## ✨ Features

- **📄 Automated Document Generation** - Professional legal documents (Employment Agreements, Annual Leave Decisions, etc.)
- **🔐 Company Verification** - Email-based verification system for business authentication
- **🌐 Bilingual Support** - Full English/Macedonian localization
- **👥 User Management** - Role-based access control with admin panel
- **💼 Social Features** - Company networking and content sharing
- **📊 Analytics** - User activity tracking and business insights

## 🚀 Quick Start

```bash
# Install dependencies
npm run install-client
npm run install-server

# Set up environment variables
cp server/.env.example server/.env

# Start development servers
npm run dev    # Backend (port 5002)
npm start      # Frontend (port 3000)
```

## 📁 Project Structure

```
nexa.v1/
├── client/          # React frontend application
├── server/          # Express.js backend API
├── docs/           # Feature documentation
│   ├── automated-documents.md
│   ├── email-verification.md
│   ├── authentication.md
│   ├── admin-system.md
│   ├── ui-ux-design.md
│   ├── security.md
│   └── development-guide.md
└── README.md
```

## 🌐 Deployment

- **Frontend**: [https://nexa-terminal.vercel.app](https://nexa-terminal.vercel.app)
- **Backend**: [https://nexa-terminal-api.onrender.com](https://nexa-terminal-api.onrender.com)

## 📚 Documentation

For detailed information, see the `/docs` directory:

- **[Development Guide](docs/development-guide.md)** - Setup and development workflow
- **[Automated Documents](docs/automated-documents.md)** - Document generation system
- **[Email Verification](docs/email-verification.md)** - Company verification process
- **[Authentication](docs/authentication.md)** - User authentication and authorization
- **[Admin System](docs/admin-system.md)** - Administrative features
- **[UI/UX Design](docs/ui-ux-design.md)** - Design system and components
- **[Security](docs/security.md)** - Security architecture and best practices

## 🔧 Technology Stack

- **Frontend**: React, React Router, i18next, CSS Modules
- **Backend**: Express.js, MongoDB, JWT, Passport.js
- **Document Generation**: docxtemplater, DOCX.js
- **Email**: Resend API with Gmail fallback
- **Deployment**: Vercel (frontend), Render (backend)

---

*Built with ❤️ for Macedonian businesses*
