# Middleware API

**Version 1.2.0** - Authentication, History, and Messaging API

The middleware is an Express server. By default it runs on port `5000`. Authentication routes use `/api/auth`, history routes use `/api/history`, and messaging routes use `/api/message`.

## Base URL

```text
http://localhost:5000
```

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

### Successful response: `201 Created`

The response contains `message` and the saved `history` document. History fields include `user_id`, `history_id`, `title`, `pdf`, `document_text`, `created_at`, and `updated_at`.

### Possible errors

- `401 Unauthorized` when the authorization token is missing or the user cannot be authenticated.
- `500 Internal Server Error` when token verification, database access, file upload, PDF parsing, or saving fails.

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

Saves a new message for the authenticated user inside a specific history thread.

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

### Successful response: `201 Created`

```json
{
  "message": "Message added successfully.",
  "data": {
    "_id": "...",
    "user_id": "...",
    "content": "Hello, can you help me review this resume?",
    "content_type": "text",
    "history_id": "history-123",
    "role": "user",
    "created_at": "2026-10-09T00:00:00.000Z"
  }
}
```

### Possible errors

- `401 Unauthorized` when the authorization token is missing or invalid.
- `500 Internal Server Error` when the database save fails.

## `POST /api/message/get`

Returns all saved messages for the authenticated user within a particular `history_id`, sorted newest first by `created_at`.

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
      "user_id": "...",
      "history_id": "history-123",
      "content": "Hello, can you help me review this resume?",
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

- **Logout is not exposed**: A placeholder logout controller exists but is not mounted in `authRoutes.js`; tokens are not invalidated on logout.
- **History IDs are not unique yet**: `newHistory` currently assigns the constant value `1` to every `history_id`.
- **Message IDs are not assigned in the current add flow**: the Mongoose schema includes `message_id`, but the controller currently saves a document without setting it.
- **Invalid-token responses use status 500**: History and message controllers catch authentication errors as generic internal errors.
- **Permissive CORS**: CORS is enabled for all origins; restrict it before production deployment.
- **User rows are returned**: Signup and login return database user rows. Avoid adding secrets or plaintext credentials to that table.
- **External services required**: History and messaging operations require PostgreSQL and MongoDB. PDF upload and extraction also require configured Supabase Storage.

## Quick Test with Thunder Client

Start the middleware with `npm run dev` from the `middleware` directory. First call `POST /api/auth/login` with JSON containing `email` and `password`, then copy the returned `token`.

For `POST http://localhost:5000/api/history/new`, set **Auth** to **Bearer** and paste the token. Send JSON with a `title` to create a history without a file. To attach a file, use **Body → Form**, add `title` as Text and `document` as File. For `GET http://localhost:5000/api/history/get`, use the same **Auth** setup and no body.

For messaging, use `POST http://localhost:5000/api/message/send` with the same **Auth** header and JSON like `{ "content": "Hello", "history_id": "history-123", "role": "user" }`. Use `POST http://localhost:5000/api/message/get` with `{ "history_id": "history-123" }` to fetch the messages for that thread. Bearer token.
