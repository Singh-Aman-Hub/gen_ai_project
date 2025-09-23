# backend_2 (Node.js) - Legal Document Assistant API

Express + Firestore + Vertex AI (Gemini + text-embedding-005)

## Endpoints
- POST `/auth/register` { name, email, password }
- POST `/auth/login` { email, password }
- POST `/documents/upload` multipart form-data: file=PDF, user_id
- GET `/analysis/:documentId` -> summary JSON (raw output)
- POST `/chat/:documentId` { query } -> RAG answer

## Setup
1. Node.js 18+
2. Copy `backend/legal-firebase.json` into `backend_2/legal-firebase.json` (or set GOOGLE_APPLICATION_CREDENTIALS path)
3. Create `.env` in `backend_2`:

```
PORT=8000
CORS_ORIGINS=http://localhost:8080,*
GOOGLE_APPLICATION_CREDENTIALS=./legal-firebase.json
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
VERTEX_PROJECT_ID=${GCP_PROJECT_ID}
VERTEX_LOCATION=${GCP_LOCATION}
VERTEX_GEMINI_MODEL=gemini-2.5-flash-lite
VERTEX_EMBED_MODEL=text-embedding-005
CACHE_DIR=./cache
VECTOR_DIR=./vector
```

## Run
```
cd backend_2
npm install
npm start
```

## Notes
- Uses Firestore collections: `users`, `documents`, `document_vectors/{docId}/chunks`
- Requires Vertex AI access in your GCP project
- Ensure the service account in `legal-firebase.json` has roles for Firestore and Vertex AI

