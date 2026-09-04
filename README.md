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

1. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a long, random `JWT_SECRET`. The development profile uses an in-memory H2 database, so only `JWT_SECRET` is needed locally.
2. Optional: set `OPENAI_API_KEY` and `OPENAI_MODEL` (default: `gpt-4o-mini`).
3. For password-reset emails, set `RESEND_API_KEY` and `RESEND_FROM` (for example, `MockMate <security@yourdomain.com>`). Verify that domain in Resend first: the shared `onboarding@resend.dev` sender is restricted to testing and cannot deliver to arbitrary recipients. If neither Resend nor SMTP is configured, development mode returns the reset code in the API response instead of sending email.
4. Install Maven and Node.js (LTS).
5. In one terminal, run `mvn spring-boot:run` from the repository root.
6. In a second terminal, run `cd frontend`, `npm install`, and `npm run dev`.
7. Open `http://localhost:5173`. In development, the API runs at `http://localhost:8081`; health is at `/actuator/health`.

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

## Public deployment

1. Create a Render web service from this repository. Render detects `render.yaml`; deploy the API using Docker.
2. After Render gives an API URL, set `APP_CORS_ALLOWED_ORIGINS` to the exact frontend origins (for example, `https://sachinworks.in,https://www.sachinworks.in`) and `APP_PASSWORD_RESET_FRONTEND_URL` to `https://sachinworks.in`.
3. Import this same GitHub repository into Vercel, set **Root Directory** to `frontend`, add custom domain `sachinworks.in`, and set `VITE_API_URL` to `https://<your-render-service>.onrender.com/api`.
4. Redeploy both services. The Render blueprint uses the `prod` profile and requires a managed MySQL database through the `DB_*` variables.

### Password-reset email setup on Render

Add the following **secret** environment variables to the Render API service, then redeploy it:

- `RESEND_API_KEY`: an API key from your Resend account.
- `RESEND_FROM`: a sender address on a domain verified in Resend, such as `MockMate <security@yourdomain.com>`.

Reset emails are sent only for an email address that already has a MockMate account. If the address is not registered, the API returns the same generic success message to avoid revealing which accounts exist.
