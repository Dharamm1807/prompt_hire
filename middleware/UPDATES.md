# Project Updates

## Current implementation

- Added an Express middleware server in `middleware/src/server.js`.
- Added JSON request parsing and permissive CORS handling.
- Added PostgreSQL connection pooling through `pg` using `DATABASE_URL`.
- Added startup database connectivity logging.
- Added signup at `POST /api/auth/signup`.
- Added login at `POST /api/auth/login`.
- Added Argon2 password hashing during signup and password verification during login.
- Added JWT creation with a one-hour expiry during signup and login.
- Added JWT verification helper code in `middleware/src/tokenManager/checkToken.js`.
- Added a logout controller placeholder, but it is not wired into the routes and does not invalidate tokens yet.
- Added a Vite client package with `npm run dev`, `npm run build`, and `npm run preview` scripts.
- Added project documentation for the current API and local setup.
- Updated Git ignore rules for environment files, dependencies, logs, build output, coverage, and local editor files.

