---
applyTo: '**'
---
# Coding standards, domain knowledge, and preferences that AI should follow.

rules:
  - Never create a report file after completing a task.
  - Use only the MERN stack:
    - MongoDB (no Mongoose)
    - Node.js with Express
    - React (no TypeScript, no Next.js)
  - Do not create test files. If unavoidable, ensure they are deleted afterward.
  - Never run build tests or start development servers when user has active sessions running. Port conflicts cause authentication failures and disrupt user workflow.
  - All features are enabled for full app functionality except the blog:
    - Authentication is always enabled (required)
    - Document automation, social posts, legal health check, and profile completion are all enabled
    - Only the Next.js blog remains disabled (separate application)
  - All middleware is enabled for complete functionality:
    - Essential middleware (authentication, CSRF, validation, security, CORS, rateLimit) always enabled
    - File upload middleware enabled for document and social features
    - Analytics middleware disabled (not currently needed)
  - VS Code workspace is optimized for performance:
    - Only exclude the blog directory (Next.js separate app)
    - All other features remain visible and searchable
  - When working on document generation pages:
    - **Only use** the following style file:
      `src/styles/terminal/documents/DocumentGeneration.module.css`
    - No inline styles, additional CSS files, or global styling changes are allowed for this feature.

notes:
  - The app now runs with full functionality both locally and in production
  - Only the Next.js blog is excluded to keep the workspace focused
  - All MERN features (social, documents, legal, profiles) are active and working
  - Performance is optimized by excluding only unnecessary files (blog, node_modules, build files)
