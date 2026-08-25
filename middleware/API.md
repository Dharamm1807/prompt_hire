# Middleware API

The middleware is an Express server. By default it runs on port `5000`, and all authentication routes are prefixed with `/api/auth`.

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

The middleware currently includes two internal helpers, but they are not routes yet:

- `createToken` signs a JWT with `JWT_SECRET` and a one-hour expiry.
- `checkToken` verifies a JWT with `JWT_SECRET` and throws an error for an invalid token.

## Current limitations

- There is no registered logout endpoint. `logoutController.js` exists, but it is not imported or mounted in `authRoutes.js` and does not invalidate tokens.
- There are no protected routes using `checkToken` yet.
- CORS is currently enabled for all origins through `cors()`.
- Signup and login return the database user row. Do not add plaintext passwords to that response if the database schema or query changes.

## Quick test with PowerShell

Start the middleware, then run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/signup -ContentType "application/json" -Body '{"email":"person@example.com","password":"secret123","username":"person"}'
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType "application/json" -Body '{"email":"person@example.com","password":"secret123"}'
```