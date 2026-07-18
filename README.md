# MockMate — AI-Powered Mock Interview Platform

A full-stack interview-practice website: a React/Vite frontend (`frontend/`) and Spring Boot 3 / Java 21 REST API.

## Included MVP

- JWT register/login authentication
- Interview session creation with AI-generated questions
- HR, Technical, Java, and DSA interview modes
- Answer evaluation, question feedback, overall score, and weakness analysis
- PDF/DOCX resume upload (10 MB max)
- Dashboard totals, averages, type-wise score summary, and recent sessions
- Central validation and exception responses
- MySQL + JPA persistence
- Offline AI fallback works by default. To use OpenAI, set both `OPENAI_ENABLED=true` and `OPENAI_API_KEY`.

## Run it

1. Create MySQL credentials, then set environment variables (or use the defaults): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a long `JWT_SECRET`.
2. Optional: set `OPENAI_API_KEY` and `OPENAI_MODEL` (default: `gpt-4o-mini`).
3. Install Maven and Node.js (LTS).
4. In one terminal, run `mvn spring-boot:run` from the repository root.
5. In a second terminal, run `cd frontend`, `npm install`, and `npm run dev`.
6. Open `http://localhost:5173`. In development, the API runs at `http://localhost:8081`; health is at `/actuator/health`.

## API flow

1. `POST /api/auth/register` with `{"name":"Asha","email":"asha@example.com","password":"password123"}`
2. Send `Authorization: Bearer <token>` on protected requests.
3. `POST /api/interviews` with `{"type":"JAVA","targetRole":"Backend Developer","questionCount":3}`
4. `POST /api/interviews/{id}/questions/{questionId}/answer` with `{"answer":"..."}`
5. `POST /api/interviews/{id}/complete`
6. `GET /api/dashboard`

Use `POST /api/resume` with multipart field name `file` to upload a PDF or DOCX.

## Suggested React pages

`Login`, `Register`, `Dashboard`, `InterviewSetup`, `InterviewRoom`, `Results`, and `ResumeUpload`. Store the JWT in memory or an HTTP-only cookie in a production frontend; do not place production tokens in local storage.

## Production notes

- Configure CORS to the deployed frontend origin.
- Move uploaded files to object storage (S3, Azure Blob, etc.) and virus-scan them.
- Add rate limits, refresh tokens, password reset/email verification, and ownership audit logs.
- Speech-to-text is best implemented in the React client with the browser Web Speech API, sending its transcript to the existing answer endpoint.
