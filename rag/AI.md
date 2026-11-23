# Prompt Hire RAG and AI Pipeline

## Overview

The RAG system combines a Qdrant knowledge base with Groq structured JSON generation. It provides interview-specific context for resume question generation and supports an optional standalone semantic search service.

The pipeline has three components:

1. `load.py` creates and populates the Qdrant collection.
2. `retrieve_api.py` retrieves relevant knowledge for a candidate profile.
3. Middleware AI controllers extract the resume profile and generate interview questions or chat replies.

## Environment Configuration

Create `rag/.env` locally:

```dotenv
QDRANT_URL=https://your-qdrant-cluster
QDRANT_API_KEY=your-qdrant-api-key
```

Create `middleware/.env` with the Groq and RAG settings:

```dotenv
GROQ_API_KEY=your-groq-api-key
RAG_URL=http://localhost:8000
```

Never commit credentials. If a key is committed or shared, revoke it and create a replacement.

## Knowledge-Base Loader

`load.py` performs the following steps:

1. Loads `rag/data/kb.json`.
2. Loads `BAAI/bge-small-en-v1.5`, a 384-dimensional Sentence Transformers model.
3. Connects to Qdrant using `QDRANT_URL` and `QDRANT_API_KEY`.
4. Creates `interview_kb_v1` with cosine distance if it does not exist.
5. Creates keyword payload indexes for `entry_type`, `family`, `role`, `seniority`, `category`, `locale`, and `skills`.
6. Builds entry-specific embedding text.
7. Encodes and upserts entries in batches of 100.
8. Uses a stable UUID5 derived from each entry's `id`, so re-running the loader updates instead of duplicating the source entry.

Run the loader from the project root:

```powershell
cd rag
python -m pip install -r requirements.txt
python load.py
```

The loader assumes the JSON file is a top-level array. It logs upload progress and prints the final point count.

## Retrieval API

Install and start the API:

```powershell
cd rag
python -m pip install -r requirements.txt
uvicorn retrieve_api:app --host 0.0.0.0 --port 8000
```

FastAPI and Uvicorn are included in `requirements.txt`.

### `GET /health`

Returns:

```json
{"ok": true}
```

### `POST /retrieve`

Request:

```json
{
  "family": "Software",
  "role": "Backend Engineer",
  "seniority": "senior",
  "skills": ["Python", "API Design"]
}
```

The allowed middleware profile families are Software, Sales, Marketing, Finance, Healthcare Administration, Operations, Human Resources, and Design. Seniority bands are `entry`, `mid`, `senior`, and `lead_manager`.

The response contains:

- `guidelines`: All-family interview guidelines.
- `competencies`: Top 4 semantically similar competencies for family `All`.
- `framework`: Family-specific framework entries.
- `ladder`: Seniority ladder entries.
- `skills`: Top 5 family-specific skill definitions.
- `exemplars`: Up to 6 question exemplars, restricted first by family and seniority.
- `coverage_gap`: `true` when no matching exemplars are found.

The primary exemplar search uses the joined skill names or family, semantic threshold `0.45`, and exact family/seniority filters. If it returns no records, the API retries with the family filter and no seniority restriction.

Before returning payloads, `retrieve_api.py` removes internal fields such as `embed_text`, `drafting_notes`, `source`, `review_status`, and `version`.

## Middleware Resume Pipeline

1. `newHistory.js` authenticates the request, uploads the PDF to Supabase, and extracts text.
2. The history is saved in MongoDB.
3. `ragContext.js` truncates resume text to 12,000 characters.
4. Groq extracts a strict structured profile using `openai/gpt-oss-120b`.
5. The profile is posted to `RAG_URL/retrieve` with a 15-second timeout.
6. `initialResponse.js` receives the resume and profile/context inputs and requests 8 structured questions by default.
7. Questions are JSON-serialized and saved as a bot message with `content_type: "json"`.

The RAG retrieval step is fail-open: it logs failures and returns an empty context while profile extraction or question generation can continue.

### RAG Context Integration

`newHistory.js` passes the complete retrieval value to `initialResponse`:

```js
const rag = await getContext(documentText);
const questions = await initialResponse(documentText, rag);
```

## Structured Question Schema

Each question contains:

- `question`
- `category`: `technical`, `behavioral`, or `situational`
- `difficulty`: `entry`, `mid`, `senior`, or `lead_manager`
- `tests`
- `resume_reference`
- `strong_signals`
- `weak_signals`
- `follow_ups`

The Groq JSON-schema call retries once after a parse or schema failure. A rule-based filter rejects prohibited questions about age, marital status, pregnancy, religion, ethnicity, nationality, citizenship, disability, sexual orientation, political activity, arrest history, and salary history.

## Chat Reply Pipeline

`POST /api/message/send` saves the user message, calls `generateResponse.js`, and saves the bot reply:

1. The user message is stored with `content_type: "text"`.
2. Groq receives a system prompt requiring an HTML fragment.
3. Markdown fences are removed.
4. `sanitize-html` allows a narrow set of tags and URL schemes.
5. The bot reply is stored with `content_type: "html"`.

If Groq reply generation fails, the user message may already be persisted and the endpoint returns `500`.

## Standalone Search

`search.py` demonstrates a direct semantic search. It embeds a query and returns payloads above a configurable score threshold. This script requires Qdrant environment variables and does not provide the same family/framework filtering API as `retrieve_api.py`.
