# Nexa Terminal

## Project Overview

Nexa Terminal is a full-stack MERN (MongoDB, Express.js, React, Node.js) application designed to provide document automation, user management, and legal assistance services. A key feature of the application is a sophisticated Legal AI Chatbot, which uses Retrieval-Augmented Generation (RAG) to query a large corpus of legal documents in the Macedonian language.

The application is divided into two main parts:
-   **`client`**: A React-based single-page application that provides the user interface.
-   **`server`**: A Node.js and Express.js backend that handles business logic, API endpoints, and database interactions.

### Core Technologies

-   **Frontend**: React, React Router, Axios, Socket.io
-   **Backend**: Node.js, Express.js, MongoDB
-   **Authentication**: JWT (JSON Web Tokens), Passport.js
-   **AI/Chatbot**: LangChain.js, OpenAI GPT-4
-   **Styling**: CSS Modules

## Building and Running

### Prerequisites

-   Node.js and npm
-   MongoDB instance

### Server Setup

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `server` directory and populate it with the necessary configuration (e.g., database connection string, JWT secret, OpenAI API key). Refer to the source code and existing `.env.production` for required variables.

4.  **Run the server:**
    -   For production:
        ```bash
        npm start
        ```
    -   For development (with auto-reloading via nodemon):
        ```bash
        npm run dev
        ```

The server will typically run on `http://localhost:5002`.

### Client Setup

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the client:**
    ```bash
    npm start
    ```

The client development server will start, usually on `http://localhost:3000`, and will proxy API requests to the backend server.

## Development Conventions

### Backend Architecture

The backend follows a standard Model-View-Controller (MVC) like pattern, with a clear separation of concerns:

-   **`routes`**: Define the API endpoints and connect them to the appropriate controllers.
-   **`controllers`**: Handle incoming requests, process input, and call services to perform business logic.
-   **`services`**: Contain the core business logic of the application.
-   **`models`**: (Implicitly defined through schemas) Represent the data structures used in the application.
-   **`middleware`**: Used for handling authentication, rate limiting, and other cross-cutting concerns.

### Frontend Architecture

The frontend is built with React and uses a component-based architecture.

-   **`pages`**: Represent top-level views for different routes.
-   **`components`**: Reusable UI elements.
-   **`contexts`**: For managing global state (e.g., authentication, language).
-   **`services`**: For making API calls to the backend.
-   **`styles`**: Uses CSS Modules for scoped styling to avoid class name collisions.

### Feature Toggles

The application uses a feature toggle system managed by `server/config/settingsManager.js`. This allows for enabling or disabling features without changing the code, which is useful for gradual rollouts and A/B testing.

### AI Chatbot

The Legal AI Chatbot is a core feature. Its implementation is centered in the `server/chatbot` and `server/services/aiChatService.js` files. It uses LangChain.js to manage conversations and interact with the OpenAI API. The chatbot is designed to be cost-effective and production-ready.
