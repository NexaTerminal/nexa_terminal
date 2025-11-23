# GEMINI.md

## Project Overview

This is a MERN stack project called **Nexa Terminal**, a bilingual (English/Macedonian) business document automation platform. It features AI-powered document generation, company verification, user management, and social features.

The project is structured as a monorepo with a `client` directory for the React frontend and a `server` directory for the Express.js backend.

### Key Technologies

*   **Frontend**: React, React Router, i18next, CSS Modules
*   **Backend**: Express.js, MongoDB, JWT, Passport.js, LangChain, OpenAI
*   **Document Generation**: docxtemplater, DOCX.js
*   **Deployment**: Vercel (frontend), Render (backend)

## Building and Running

### Prerequisites

*   Node.js and npm
*   MongoDB

### Installation

1.  **Install server dependencies:**
    ```bash
    npm run install-server
    ```
2.  **Install client dependencies:**
    ```bash
    npm run install-client
    ```

### Environment Variables

1.  Copy the example environment file for the server:
    ```bash
    cp server/.env.example server/.env
    ```
2.  Update `server/.env` with your environment-specific settings (database connection string, JWT secret, etc.).

### Running the Application

1.  **Start the backend server (runs on port 5002):**
    ```bash
    npm run dev
    ```
2.  **Start the frontend development server (runs on port 3000):**
    ```bash
    npm start
    ```

## Development Conventions

*   The backend uses a `settingsManager` to conditionally enable/disable features and routes. This is a good practice for managing a modular application.
*   The frontend uses `react-router-dom` for routing, with a clear separation between public and private routes.
*   The project uses `i18next` for internationalization, supporting both English and Macedonian.
*   The backend includes security middleware for headers, rate limiting, and CSRF protection.
*   The backend uses Passport.js for authentication, with support for local, Google, and LinkedIn strategies.
*   The project includes AI features using LangChain and OpenAI.
