# Project Updates

## v1.3.0 - Current Working Version

This version adds Groq-powered interview assistance to the existing history and messaging APIs. The middleware uses the `groq-sdk` package and requires `GROQ_API_KEY` for AI features.

### Changes in this version

- Added the Groq SDK client and AI controllers for generating chat replies and resume-based interview questions.
- When a PDF is attached to `POST /api/history/new`, its extracted text is sent to Groq to generate exactly 10 interview questions.
- Saved the generated questions as a bot message with `content_type: "json"` and included their JSON-serialized array in the response's `newMessage` field.
- Updated `POST /api/message/send` to generate and save a bot reply after saving the submitted message.
- Updated the API and directory documentation to cover the AI integration and current request/response behavior.

### Known limitations in v1.3.0

- AI operations require a working Groq API key and network access. A generation failure returns an error even though a history or user message may already have been saved.
- History and message IDs are generated from timestamps rather than guaranteed-unique IDs.
- Message reads and writes filter by `history_id`; they do not verify that the history belongs to the authenticated user. Message documents also do not store a user ID.
- The send response's `message` field contains the saved user message document (not a success string); the generated bot document is returned as `botResponse`.
- The npm `test` script is still a placeholder; automated tests are not configured.

## v1.2.0

This version added chat-style message persistence and retrieval for history threads.

### Changes in v1.2.0

- Added `POST /api/message/send` to save a message in MongoDB.
- Added `POST /api/message/get` to fetch messages for a `history_id`.
- Added the `messageRoutes.js` router and mounted it under `/api/message`.
- Added message controller logic and a MongoDB message schema indexed by `history_id`.
- The npm `test` script is still a placeholder; automated tests are not configured.

## v1.1.0

This version documented the uncommitted changes in the worktree after commit `797c4e5` (`Merge pull request #4 from Dharamm1807/client`). It is a documentation version, not a Git tag or release.

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

