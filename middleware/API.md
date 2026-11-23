# Middleware API

**Version 1.4.0** - Authentication, History, Messaging, Groq, and RAG Interview Assistance API

The middleware is an Express server. By default it runs on port `5000`. Authentication routes use `/api/auth`, history routes use `/api/history`, and messaging routes use `/api/message`. AI-assisted question and reply generation is provided by Groq. Resume question generation can optionally receive context from the RAG API in `rag/retrieve_api.py`.

## Base URL

```text
http://localhost:5000
```

## AI configuration

Set `GROQ_API_KEY` in `middleware/.env` to enable AI-generated interview questions and message replies.

Set `RAG_URL` to the RAG FastAPI base URL if it is not running at the default `http://localhost:8000`. Context retrieval is best-effort: if profile extraction or RAG retrieval fails, the middleware continues with available resume text and general interview guidance.

## `POST /api/auth/signup`

Creates a user after validating and hashing the password.

### Request body

```json
{
  "email": "person@example.com",
  "password": "secret123",
  "username": "person"
}
```

### Successful response: `201 Created`

```json
{
  "message": "User created successfully.",
  "user": {
    "email": "person@example.com",
    "username": "person",
    "token": "<jwt>"
  }
}
```

The exact user object returned is the row returned by PostgreSQL, so it may include additional database columns.

### Possible errors

- `400 Bad Request` when `email`, `password`, or `username` is missing.
- `400 Bad Request` when the password has fewer than six characters.
- `409 Conflict` when the email already exists.
- `500 Internal Server Error` when the database or another server operation fails.

## `POST /api/history/new`

Creates a history record for the authenticated user. Send a valid JWT in the `Authorization` header. The request may be JSON when creating a record without a file, or `multipart/form-data` when attaching a document.

### Headers

```text
Authorization: Bearer <jwt>
```

### Request body

JSON without a document:

```json
{
  "title": "Resume review"
}
```

For a document, send `multipart/form-data` with a text field named `title` and an optional file field named `document`. The upload limit is 10 MB. The file is uploaded to the Supabase Storage bucket named `documents`, and its text is extracted for the history record.

When extracted PDF text is available, the middleware:

1. Uploads the original PDF to Supabase Storage.
2. Extracts text with `pdf-parse`.
3. Attempts to build a resume profile and retrieve RAG context.
4. Calls Groq to generate 8 structured interview questions by default.
5. Saves the JSON-serialized questions as a bot message in MongoDB.

`newHistory.js` passes the returned `{ profile, context }` object to `initialResponse(documentText, rag)`, so structured resume questions are generated with the retrieved knowledge base context when available.

### Successful response: `201 Created`

The response contains the saved `history` document and `newMessage`. With a PDF, `newMessage` is a JSON-serialized array of question objects, and those questions are saved in the message collection with `content_type: "json"` and `role: "bot"`. Without a PDF, `newMessage` is an empty string.

Example question item:

```json
{
  "question_number": 1,
  "question": "How did you apply this skill in your recent project?",
  "category": "Technical",
  "difficulty": "Easy"
}
```

History fields include `user_id`, `history_id`, `title`, `pdf`, `document_text`, `created_at`, and `updated_at`.

### Possible errors

- `401 Unauthorized` when the authorization token is missing or the user cannot be authenticated.
- `500 Internal Server Error` when token verification, database access, file upload, PDF parsing, Groq question generation, or saving fails. The history record may already have been saved if question generation fails.

## `GET /api/history/get`

Returns history records belonging to the authenticated user, newest first.

### Headers

```text
Authorization: Bearer <jwt>
```

### Successful response: `200 OK`

```json
{
  "history": []
}
```

The array contains saved history documents and is empty when the user has no history.

### Possible errors

- `401 Unauthorized` when the authorization token is missing.
- `500 Internal Server Error` when token verification or database access fails.

## `POST /api/message/send`

Saves a submitted message and a generated AI reply in the message collection for the supplied history thread. The AI reply is generated from the submitted `content`.

### Headers

```text
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Request body

```json
{
  "content": "Hello, can you help me review this resume?",
  "history_id": "history-123",
  "role": "user"
}
```

The request's `role` is stored as supplied. Use `"user"` for messages submitted by the user.

### Successful response: `201 Created`

```json
{
  "message": {
    "_id": "...",
    "message_id": "...",
    "content": "Hello, can you help me review this resume?",
    "content_type": "text",
    "history_id": "history-123",
    "role": "user",
    "created_at": "2026-10-09T00:00:00.000Z"
  },
  "botResponse": {
    "_id": "...",
    "message_id": "...",
    "content": "Generated AI response...",
    "content_type": "text",
    "history_id": "history-123",
    "role": "bot",
    "created_at": "2026-10-09T00:00:00.000Z"
  }
}
```

The `message` property is the saved user message document; it is not a status string. Both documents are saved in MongoDB before the response is returned.

The bot document has `content_type: "html"` and its content is sanitized before it is stored. The generated HTML supports paragraphs, headings, lists, emphasis, links, code blocks, blockquotes, and tables.

### Possible errors

- `401 Unauthorized` when the authorization token is missing or invalid.
- `500 Internal Server Error` when token verification, message saving, or Groq reply generation fails. The submitted message may already be saved if reply generation fails.

## `POST /api/message/get`

Returns saved messages matching the supplied `history_id`, sorted newest first by `created_at`.

### Headers

```text
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Request body

```json
{
  "history_id": "history-123"
}
```

### Successful response: `200 OK`

```json
{
  "messages": [
    {
      "_id": "...",
      "message_id": "...",
      "history_id": "history-123",
      "content": "Hello, can you help me review this resume?",
      "content_type": "text",
      "role": "user",
      "created_at": "2026-10-09T00:00:00.000Z"
    }
  ]
}
```

### Possible errors

- `401 Unauthorized` when the authorization token is missing or invalid.
- `500 Internal Server Error` when token verification or message lookup fails.

## `POST /api/auth/login`

Authenticates a user by email and password, creates a new one-hour JWT, and stores that token for the user.

### Request body

```json
{
  "email": "person@example.com",
  "password": "secret123"
}
```

### Successful response: `200 OK`

```json
{
  "message": "Login successful.",
  "user": {
    "email": "person@example.com",
    "username": "person",
    "token": "<jwt>"
  },
  "token": "<jwt>"
}
```

### Possible errors

- `400 Bad Request` when `email` or `password` is missing.
- `401 Unauthorized` when the email does not exist or the password is incorrect.
- `500 Internal Server Error` when the database or another server operation fails.

## Token helpers

The middleware includes internal token helpers; they are not HTTP routes:

- `createToken` signs a JWT with `JWT_SECRET` and a one-hour expiry.
- `checkToken` verifies a JWT with `JWT_SECRET` and throws an error for an invalid token.
- `getIdFromToken` verifies the JWT and looks up the matching user in PostgreSQL.

## Current Implementation Details

### RAG and Resume Question Pipeline

**Resume context retrieval:**
- `newHistory` authenticates the user and saves the history before AI question generation.
- `ragContext.js` sends at most 12,000 resume characters to Groq for structured profile extraction.
- The profile schema identifies a career family, role, seniority band, confidence, skills, achievements, and summary.
- The profile is sent to `POST http://localhost:8000/retrieve`, or to the URL configured in `RAG_URL`.
- RAG retrieval is limited to 15 seconds. Failures are logged and converted to an empty context rather than failing the history request.

**RAG data pipeline:**
- `rag/load.py` embeds `rag/data/kb.json` with `BAAI/bge-small-en-v1.5`.
- The Qdrant collection is `interview_kb_v1`; vectors have 384 dimensions and cosine distance.
- Entries are uploaded in batches of 100 with stable UUID5 IDs.
- `rag/retrieve_api.py` exposes `GET /health` and `POST /retrieve`.

**Question generation:**
- `initialResponse.js` returns structured JSON with question, category, difficulty, tests, resume reference, strong signals, weak signals, and follow-ups.
- Generation allows two JSON-schema attempts and applies a rule-based backstop for prohibited topics.
- The response is JSON-serialized and saved as `content_type: "json"`.
- Retrieved RAG context is passed to `initialResponse` for resume-specific question generation.

**Chat response pipeline:**
- `addMessage.js` saves the submitted user message before calling Groq.
- `generateResponse.js` asks `openai/gpt-oss-120b` for an HTML fragment.
- Markdown fences and disallowed HTML are removed using `sanitize-html`.
- The sanitized bot reply is saved as `content_type: "html"`.

### Authentication Flow

**Signup:**
- Validates email, password, and username
- Checks if email already exists (409 Conflict if duplicate)
- Hashes password using Argon2 before storage
- Creates JWT token with 1-hour expiry
- Stores token in database for session tracking
- Returns created user object with token

**Login:**
- Validates email and password
- Queries database for user by email
- Verifies password using Argon2.verify()
- Creates new JWT token on successful authentication
- Updates token in database for current session
- Returns user object with new token

### Database Schema (PostgreSQL)

Users table structure:
- `email` - unique identifier
- `password` - Argon2 hashed
- `username` - user display name
- `token` - current JWT token for session

## Current Limitations

- **RAG credentials require separate configuration**: `rag/.env` must define `QDRANT_URL` and `QDRANT_API_KEY`; do not commit real values.
- **Logout is not exposed**: A placeholder logout controller exists but is not mounted in `authRoutes.js`; tokens are not invalidated on logout.
- **IDs are timestamp-based**: History and message IDs use timestamps and are not guaranteed unique.
- **Invalid-token responses use status 500**: History and message controllers catch authentication errors as generic internal errors.
- **History ownership is not checked for message operations**: Message documents do not store a user ID, and send/get filter by `history_id` without checking whether the history belongs to the authenticated user.
- **AI calls can fail after persistence**: History is saved before initial question generation, and the submitted message is saved before reply generation. A Groq error can therefore produce a `500` while leaving saved data.
- **Groq configuration is required for AI features**: Set `GROQ_API_KEY` in `middleware/.env`. Without a working key, PDF question generation and message sending cannot complete.
- **Permissive CORS**: CORS is enabled for all origins; restrict it before production deployment.
- **User rows are returned**: Signup and login return database user rows. Avoid adding secrets or plaintext credentials to that table.
- **External services required**: History and messaging operations require PostgreSQL and MongoDB. PDF upload and extraction also require configured Supabase Storage.

## Quick Test with Thunder Client

Start the middleware with `npm run dev` from the `middleware` directory. First call `POST /api/auth/login` with JSON containing `email` and `password`, then copy the returned `token`.

For `POST http://localhost:5000/api/history/new`, set **Auth** to **Bearer** and paste the token. Send JSON with a `title` to create a history without a file. To attach a file, use **Body → Form**, add `title` as Text and `document` as File. For `GET http://localhost:5000/api/history/get`, use the same **Auth** setup and no body.

For messaging, use `POST http://localhost:5000/api/message/send` with the same **Auth** header and JSON like `{ "content": "Hello", "history_id": "history-123", "role": "user" }`. The response contains the saved user message and the generated `botResponse`. Use `POST http://localhost:5000/api/message/get` with `{ "history_id": "history-123" }` to fetch the messages for that thread. Bearer token.
