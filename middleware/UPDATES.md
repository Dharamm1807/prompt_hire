# Project Updates

## v1.1.0 - Current Working Version

This version documents the uncommitted changes in the worktree after commit `797c4e5` (`Merge pull request #4 from Dharamm1807/client`). It is a documentation version, not a Git tag or release.

### Changes since the previous commit

- Mounted history routes under `/api/history` alongside the existing `/api/auth` routes.
- Added `POST /api/history/new` to create a MongoDB history record for the authenticated PostgreSQL user.
- Added `GET /api/history/get` to return the authenticated user's histories.
- Added a Mongoose history schema and a message schema with an index on `history_id`.
- Added optional in-memory multipart uploads for the `document` field, with a 10 MB file size limit.
- Added Supabase Storage upload and PDF text extraction support.
- Added MongoDB connection configuration and an asynchronous JWT-to-user lookup helper.
- Moved signup and login controllers into `controllers/authControllers`; the old controller files were removed. A logout placeholder remains but is not mounted.
- Added dependencies for MongoDB, Mongoose, Multer, Supabase, and PDF parsing, with corresponding lockfile updates.
- Updated API documentation and the project directory overview for the current backend structure.

### Known limitations in v1.1.0

- New history records currently use the constant `history_id` value `1`; unique history IDs are not implemented.
- Logout is not an active route and does not invalidate tokens.
- Invalid-token errors from history routes are returned as generic `500` responses.
- The npm `test` script is still a placeholder; automated tests are not configured.

## Previous Changes: v1.0.0

The previous documented version covered the initial authentication implementation:

- Added the Express middleware server, JSON parsing, permissive CORS, and PostgreSQL connection pooling.
- Added signup and login at `POST /api/auth/signup` and `POST /api/auth/login`.
- Added Argon2 password hashing and verification.
- Added one-hour JWT creation and token storage during signup/login.
- Added the JWT verification helper and an unwired logout controller placeholder.
- Added the React + Vite client and initial setup/API documentation.

