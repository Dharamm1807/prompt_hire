# Prompt Hire

Prompt Hire is a work-in-progress interview-preparation application. Users can create an account, start interview-preparation conversations, optionally attach a PDF resume, and exchange messages with an AI assistant. The frontend is a React single-page application; the backend is an Express API backed by PostgreSQL and MongoDB, with Supabase Storage for uploaded PDFs and Groq for AI generation.

> **Project status:** This repository contains a functional prototype, not a production-ready service. See [Known limitations and security notes](#known-limitations-and-security-notes) before deploying it or handling real user data.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Application structure](#application-structure)
- [Requirements](#requirements)
- [Configuration](#configuration)
- [Run locally](#run-locally)
- [How it works](#how-it-works)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Known limitations and security notes](#known-limitations-and-security-notes)
- [Testing and build](#testing-and-build)
- [Further documentation](#further-documentation)

## Features

- Account signup and login with Argon2 password hashing and one-hour JWTs.
- A dashboard for creating and browsing interview-preparation conversations.
- Optional PDF resume upload (up to 10 MB) when creating a conversation.
- PDF text extraction and generation of 10 interview questions based on the extracted content.
- Persistent conversation history and messages.
- Server-side logout that invalidates the current JWT.
- AI-generated replies to submitted messages.
- A profile page that displays locally stored account details and previews a selected image in the browser.

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, React Router, Vite, Tailwind CSS, Bootstrap |
| API | Node.js, Express 5 |
| Authentication | PostgreSQL (`pg`), Argon2, JSON Web Tokens |
| Conversation data | MongoDB with Mongoose |
| PDF storage and extraction | Supabase Storage, `pdf-parse`, Multer |
| AI | Groq SDK |

## Application structure

```text
prompt_hire/
├── README.md
├── directory.txt
├── client/                         # React + Vite web application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js                  # API base URL
│       ├── main.jsx                # React app and routes
│       ├── home.jsx                # Home page
│       ├── form.jsx                # Signup page
│       ├── login.jsx               # Login page
│       ├── dashboard.jsx           # Conversations and messaging
│       ├── userprofile.jsx         # Profile and image preview
│       ├── navbar.jsx              # Main navigation
│       └── index.css               # Global styles
└── middleware/                     # Express API
    ├── API.md                      # Detailed endpoint documentation
    ├── UPDATES.md                  # Project update history
    ├── package.json
    └── src/
        ├── server.js               # API setup and route mounting
        ├── config/                 # Database, storage, AI, and env setup
        ├── controllers/
        │   ├── aiControllers/      # Groq question/reply generation
        │   ├── authControllers/    # Signup and login
        │   ├── documentControllers/# PDF upload and text extraction
        │   ├── historyControllers/ # Conversation creation and listing
        │   └── messageControllers/ # Message send and retrieval
        ├── models/                 # MongoDB history and message schemas
        ├── routes/                 # Express routers
        └── tokenManager/           # JWT creation and verification
```

## Requirements

- Node.js compatible with Vite 8 (Node.js 20.19+ or 22.12+).
- npm.
- A PostgreSQL database with the user table expected by the API.
- A MongoDB deployment.
- A Groq API key for AI-generated questions and replies.
- A Supabase project and a Storage bucket named `documents` if PDF uploads are needed.

## Configuration

Create `middleware/.env` locally. The root `.gitignore` excludes `.env` files; do not commit real credentials.

```dotenv
# The current frontend calls localhost:3000; see the port note below.
PORT=3000

DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=replace_with_a_long_random_secret
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key

# Required for PDF uploads
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

`PORT` is optional and the API defaults to `5000`. However, the current frontend base URL is hard-coded as `http://localhost:3000` in `client/src/api.js`. To run without changing the frontend, set `PORT=3000` in `middleware/.env`. Alternatively, change `API_URL` in `client/src/api.js` to match the port used by the API.

`DATABASE_URL`, `JWT_SECRET`, and `MONGODB_URI` are needed for the API's core authentication and conversation features. `GROQ_API_KEY` is needed for generated interview questions and replies. The Supabase values are needed when uploading PDFs; configure a Storage bucket named `documents` and allow the server's service role to upload to it. Keep the service role key on the server only.

The PostgreSQL API expects a table named `public."Users"` with at least the columns `user_id`, `email`, `password`, `username`, and `token`. The password column stores an Argon2 hash. The current token expiry is set to one hour in the signup and login controllers.

## Run locally

Install and start the API in a terminal:

```powershell
cd middleware
npm install
npm run dev
```

Install and start the frontend in a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`). The API prints its listening port when it starts. CORS is enabled by the API to allow local browser requests.

## How it works

1. A user signs up or logs in through the frontend. The API validates credentials, hashes signup passwords with Argon2 (or verifies a login password), and returns a JWT.
2. The frontend stores the JWT, username, and email in browser `localStorage`.
3. The dashboard sends the JWT as `Authorization: Bearer <token>` when creating or loading histories and messages.
4. Creating a conversation stores a history record in MongoDB. If a PDF is attached, the API uploads it to Supabase Storage, extracts its text, asks Groq for 10 interview questions, and saves those questions as an initial bot message.
5. Sending a message saves it in MongoDB and asks Groq to generate a reply, which is saved as a bot message and returned to the frontend.
6. The dashboard fetches the conversation messages and displays them in chronological order. Generated question messages are rendered as a question list.

The home page is currently a welcome placeholder. The profile page reads account details from `localStorage`; choosing a profile image only previews it in the current page and does not upload or persist it.

## API overview

The API base URL is `http://localhost:<PORT>`. All routes are mounted under `/api`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | Create an account and return a JWT |
| `POST` | `/api/auth/login` | No | Authenticate and return a JWT |
| `POST` | `/api/history/new` | Bearer token | Create a conversation; optionally accept a `document` PDF upload |
| `GET` | `/api/history/get` | Bearer token | List the current user's conversations |
| `POST` | `/api/message/send` | Bearer token | Save a message and generate/save an AI reply |
| `POST` | `/api/message/get` | Bearer token | Fetch messages for a supplied `history_id` |

For signup and login, send JSON. For history creation, send JSON with a `title` when no PDF is attached, or `multipart/form-data` with a `title` field and optional `document` file field. The PDF upload limit is 10 MB. Message requests use JSON; `/api/message/send` expects `content`, `history_id`, and `role`, while `/api/message/get` expects `history_id`.

All history and message routes require an `Authorization: Bearer <token>` header. The API returns the initial generated questions as JSON-serialized content with `content_type: "json"`. Message history is returned newest-first by the API; the dashboard reverses it for display.

See [middleware/API.md](middleware/API.md) for request and response examples, status codes, and manual testing instructions.

## Data model

- **PostgreSQL users:** Email, username, Argon2 password hash, and current JWT token. User IDs are used to associate conversations with authenticated accounts.
- **MongoDB histories:** User ID, history ID, title, optional PDF name/path, extracted document text, and timestamps.
- **MongoDB messages:** History ID, message ID, role, content type, content, and timestamps. Messages may be text or generated question JSON.
- **Supabase Storage:** Uploaded PDF files are stored in the `documents` bucket. MongoDB history stores the returned storage path.

## Known limitations and security notes

- The frontend stores JWTs in `localStorage`; this has security implications if the site is exposed to cross-site scripting.
- Signup and login currently return database user rows. Because signup uses `RETURNING *` and login selects all columns, the response may include the password hash and stored token. Do not deploy this API with real users until responses are explicitly limited to safe fields.
- Message operations verify that a token can be resolved to a user but do not confirm that the supplied `history_id` belongs to that user. Do not expose this API to untrusted users before adding ownership checks.
- CORS currently accepts all origins. Restrict allowed origins for deployment.
- History and message IDs are generated from timestamps and are not guaranteed unique.
- If Groq generation fails, the history or submitted message may already have been saved even though the request returns an error.
- The profile image is only a local preview; it is not saved.
- The client API URL is hard-coded to port `3000`, while the API defaults to port `5000`; configure them to match.
- Error handling for some invalid tokens may return `500` instead of `401`.
- The middleware `npm test` script is a placeholder; automated backend tests are not currently configured.

Never put credentials in this README, frontend source, or version control. If a credential has been shared or committed, revoke or rotate it at its provider and update the local environment.

## Testing and build

Build the frontend with:

```powershell
cd client
npm run build
```

The production build is written to `client/dist`. The frontend package also provides `npm run preview` for locally previewing a production build. There is currently no configured backend test suite.

## Further documentation

- [API reference and manual test examples](middleware/API.md)
- [Project update history](middleware/UPDATES.md)
- [Directory overview](directory.txt)
