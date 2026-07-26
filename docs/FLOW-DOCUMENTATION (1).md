# Flow Documentation

This file tracks the request/response flow for each implemented feature,
sprint by sprint. Update this alongside development — after each module,
add its flow diagram and a short explanation here.

---

## Sprint 0 — Infrastructure Flow

```
Docker Compose
   │
   ├── Postgres container (port 5432)
   │        │
   │        └── Prisma schema.prisma → migrations → tables
   │
   └── Redis container (port 6379)
            │
            └── (reserved for BullMQ job queue — Sprint 3+)

Backend (Express + TypeScript)
   └── src/config/database.ts → Prisma Client singleton → connects to Postgres

Frontend (Next.js)
   └── lib/api.ts → apiFetch() → will call Backend API (http://localhost:4000)

CI/CD (GitHub Actions)
   └── On push/PR → lints + builds backend and frontend independently
```

**Status:** Complete. Backend and frontend run independently, connected to
their own Postgres/Redis via Docker, with a passing CI pipeline.

---

## Sprint 1 — Module 1 & 2: Signup and Login Flow

```
Client
   │
POST /signup  (or /login)
   │
Routes            → routes/auth.routes.ts
   │
Controller        → controllers/auth.controller.ts
   │
Validator (Zod)   → validators/auth.validator.ts
   │
 Valid?
 ┌───────┴────────┐
 │                │
No               Yes
 │                │
400 Error      Service           → services/auth.service.ts
(sendResponse)     │
              Signup: email check → hash password → create user
              Login:  find user  → compare password hash
                     │
              Sign JWT (jsonwebtoken)
                     │
        { success: true/false, data / error }   (return, not throw)
                     │
                Controller
                     │
          sendResponse(res, statusCode, status, data, message)
                     │
                  Client
```

**Response shape (every endpoint, success or error):**
```json
{
  "statusCode": 201,
  "status": "success",
  "data": { "token": "...", "user": { "id": "...", "name": "...", "email": "..." } },
  "message": "Account created successfully"
}
```

**Key decisions:**
- Error handling is **return-based**, not throw-based. Every service function
  wraps its logic in try/catch and returns `{ success, data | error }`.
  Controllers check `result.success` and never need their own try/catch.
- Passwords are hashed with bcrypt (10 salt rounds) — plaintext is never stored.
- Login returns the same generic "Invalid email or password" whether the
  email doesn't exist or the password is wrong — this avoids leaking which
  one was incorrect (security best practice).
- Swagger (`/api-docs`) documents both endpoints and is used for manual testing.

**Status:**
- [x] Module 1 — Signup (tested via Swagger, working)
- [x] Module 2 — Login (tested via Swagger, working)
- [x] Module 3 — Auth middleware + protected route (tested via Swagger, working)
- [x] Module 4 — Frontend signup/login pages (tested end-to-end, working)

---

## Sprint 1 — Module 3: Auth Middleware + Protected Route

```
Client (has JWT token from login/signup)
   │
GET /api/auth/me
   │  Authorization: Bearer <token>
   │
Routes
   │
requireAuth middleware   → middlewares/auth.middleware.ts
   │
 Token valid?
 ┌───────┴────────┐
 │                │
No               Yes
 │                │
401 Error    req.userId = decoded.userId
             (attached to request)
                  │
             Controller → Service.getProfile(userId)
                  │
             sendResponse (200 + user data, or 404)
                  │
               Client
```

Verified with Swagger's "Authorize" button (bearer token flow) — both the
valid-token (200) and missing-token (401) cases were tested and pass.

---

## Sprint 1 — Module 4: Frontend (Signup, Login, Home, Dashboard)

```
Home (/)          → links to /login and /signup
   │
Login (/login) or Signup (/signup)
   │
lib/api.ts → apiFetch() → POST /api/auth/login or /signup
   │
On success: token saved to localStorage
   │
Redirect → /dashboard
   │
Dashboard checks localStorage for token on mount
   │
 Token present?
 ┌───────┴────────┐
 │                │
No               Yes
 │                │
Redirect      Show placeholder dashboard
to /login     ("Log out" clears token → /login)
```

**Design system:** split-screen auth layout with an animated ATS "scan
line" over a resume silhouette (dark ink navy panel) paired with the form
(warm parchment panel) — Fraunces for display headlines, Inter for body
text, amber accent for focus states and CTAs. Fully responsive; the dark
panel hides on mobile.

**Status:** Sprint 1 — **Complete**. Full signup → login → protected
route → frontend flow works end-to-end.

---

## Sprint 2 — Resume Upload, List, Delete

```
Client (dashboard, drag-drop or click-to-browse)
   │
POST /api/resumes/upload  (multipart/form-data, field "resume")
   │  Authorization: Bearer <token>
   │
Routes → requireAuth → multer (memory storage, 5MB limit) → Controller
   │
Controller reads req.userId + req.file
   │
Service.uploadResume(userId, file)
   │
extractText(mimetype, buffer)
   │
 PDF? ──── pdf-parse         DOCX? ──── mammoth        other ──── unsupported
   │                             │                            │
   └─────────────┬───────────────┘                    { success:false,
                  │                                      error: "..." }
            rawText extracted
                  │
        Prisma: create Resume record
        (userId, originalFilename, rawText)
                  │
        { success: true, data: { id, originalFilename, uploadedAt } }
                  │
              Controller → sendResponse (201 / 422 / 500)
                  │
                Client → shown in Uploaded Resumes list

---

GET /api/resumes        → list resumes for req.userId only
DELETE /api/resumes/:id → deleteMany WHERE id AND userId
                           (ownership check — a user can never delete
                            another user's resume; 404 if no match)
```

**Key decisions:**
- `pdf-parse`'s default import doesn't work cleanly with this TS setup —
  had to destructure/cast its CommonJS export shape manually.
- List endpoint deliberately excludes `rawText` from the response (keeps
  the payload light; full text isn't needed until the tailoring step).
- Delete uses `deleteMany` with both `id` and `userId` in the `where`
  clause rather than `delete` — this makes ownership enforcement part of
  the query itself, not a separate check-then-delete step (avoids a race
  condition and is a one-line safety net).

**Frontend:** `components/ResumeUploader.tsx` (drag-drop, upload state,
success/error messaging) and `components/ResumeList.tsx` (fetches list on
mount, renders filename + formatted date, delete button) — both under the
same ink navy / parchment / amber design system as the auth pages.

**Status:** Sprint 2 — **Complete**. Upload (PDF + DOCX), list, and
delete all tested end-to-end via Swagger and the frontend dashboard.

---

## Sprint 3 — Job Description Input, Queue Wiring, Async Processing

```
Client (dashboard/tailor page)
   │
Selects a resume, pastes job title + description
   │
POST /api/jobs   { resumeId, title, company, rawText }
   │  Authorization: Bearer <token>
   │
Routes → requireAuth → Controller
   │
Controller validates (Zod) → Service.createJobDescription(userId, ...)
   │
Ownership check: does this resumeId belong to userId?
   │
 No ──► { success:false, error:"Resume not found" } ──► 404
   │
 Yes
   │
Prisma: create JobDescription record
   │
addTailorJob({ userId, resumeId, jobDescriptionId })
   │
        ┌──────────────────────────────┐
        │   Redis-backed BullMQ Queue    │  ("tailor-resume")
        └──────────────────────────────┘
   │                                    │
Controller responds 201                 Worker (same process, separate
immediately with jobDescription         listener) picks up the job:
+ queueJobId                              - logs "started processing"
   │                                      - waits 2.5s (mock — real AI
Client polls                               work replaces this in Sprint 4/5)
GET /api/jobs/status/:jobId                - creates TailoredVersion record
every 1.5s                                   (matchScore:0, missingKeywords:[],
   │                                          tailoredText:"" — placeholders)
   │                                      - logs "completed"
   └──────────────◄──────────────────────────┘
        state: "waiting" → "active" → "completed"
```

**Key decisions:**
- The API responds immediately after queueing (202/201), never waiting on
  the worker — this is the core reason for using a queue at all: the HTTP
  request/response cycle never blocks on background work.
- The worker runs inside the same Node process as the Express server for
  local development simplicity. In production this would be split into
  its own container/process so it can scale independently of the API.
- Ownership is checked in the service layer before a job is ever queued —
  a user can only tailor resumes they own.
- `TailoredVersion` is created with placeholder values (`matchScore: 0`,
  empty `tailoredText`) for now; Sprint 4 replaces the matching logic and
  Sprint 5 replaces the AI rewrite logic, without changing this queue flow.

**Frontend:** `app/dashboard/tailor/page.tsx` — job description form,
animated multi-step progress UI (scan-line motif reused from the auth
pages) during polling, and a success state with placeholder cards for fit
score / missing keywords / tailored draft.

**Status:** Sprint 3 — **Complete**. Full flow tested end-to-end: job
created → queued → picked up by worker → processed → status polled →
success UI shown, with worker logs confirmed in the terminal.

---

## Sprint 4 — Match Score + Keyword Gap Analysis (Real AI)

```
tailor.worker.ts (job picked up)
   │
Fetch Resume.rawText + JobDescription.rawText from DB
   │
ai.service.ts → analyzeMatch(resumeText, jobText)
   │
AI provider call (system prompt: ATS/resume-matching expert,
user prompt: both texts, instructed to return ONLY JSON)
   │
 Success?                              Failure (API error, bad JSON, etc.)
   │                                          │
 Parse + validate JSON                  Log real error to console
 { matchScore, missingKeywords }        Fall back: matchScore: 0,
   │                                     missingKeywords: [] — job still
 Prisma: create TailoredVersion         completes, just without useful data
 with REAL matchScore + missingKeywords        │
 (tailoredText still "" — Sprint 5)            │
   └──────────────────┬─────────────────────────┘
                       │
              Worker logs outcome (success or fallback), job id included

---

GET /api/jobs/status/:jobId  (when state === "completed")
   │
Look up the matching TailoredVersion (by resumeId + jobDescriptionId,
most recent) → include matchScore + missingKeywords directly in the
status response, alongside `state`
   │
Client (tailor page, polling) → renders real Fit Score % + progress bar
+ missing-keyword pills instead of placeholders
```

**Key decisions:**
- **AI provider swap:** the plan originally called for the Anthropic API,
  but with no funded account available, the integration was swapped to
  Groq's API instead — the `analyzeMatch(resumeText, jobText)` function
  signature and its `{ success, data | error }` return shape stayed
  identical, so nothing in the worker, controller, or routes needed to
  change. This is the payoff of keeping AI calls behind a single service
  function: the provider is an implementation detail. Swapping back to
  Claude later (e.g. once there's API budget) only touches this one file.
- The worker never lets an AI failure fail the whole job — a failed
  analysis still produces a "completed" job with placeholder score/keywords
  rather than leaving the user stuck in "active" forever. This is a
  deliberate resilience choice; a stricter version could instead mark the
  job "failed" and let the frontend show a retry option.
- `tailoredText` is still an empty placeholder — the actual AI-rewritten
  resume text is Sprint 5's responsibility, built on top of this same
  worker step.

**Status:** Sprint 4 — **Complete**. Real AI-generated match score and
missing keywords flow end-to-end from job creation through to the
frontend results UI, tested with an 85%+ match on a real resume/job pair.

---

## Sprint 5 — AI Resume Rewrite (Tailored Draft)

```
ai.service.ts → analyzeMatch(resumeText, jobText)
   │
Single AI call now returns THREE fields (expanded from Sprint 4's two):
{
  matchScore: <0-100>,
  missingKeywords: [...],
  tailoredText: "<rewritten resume, reframed with the job's language,
                  zero fabricated content>"
}
   │
System prompt hard rule: never invent experience, skills, employers,
dates, or achievements — only rephrase/reorder/emphasize what's already
in the original resume text.
   │
tailor.worker.ts → on success, TailoredVersion is created with the real
tailoredText (previously left as ""); on AI failure, tailoredText stays
"" alongside the existing matchScore:0 / missingKeywords:[] fallback
   │
GET /api/jobs/status/:jobId → completed response now also includes
tailoredText, alongside matchScore and missingKeywords
   │
Frontend tailor results page → "Tailored Draft" card renders the real
text (scrollable, max-height), with Copy-to-clipboard and Download-as-.txt
buttons — no backend call needed for either, both are client-side
```

**Key decisions:**
- **One AI call, not two.** Match scoring and resume rewriting share a
  single prompt/response round trip rather than separate calls — half the
  latency and cost of the alternative, and the model naturally has full
  context of both tasks at once.
- **Factual-accuracy is a hard constraint in the prompt**, not a soft
  suggestion — this is the ethical core of the product: the tool reframes
  what's true, it doesn't fabricate. Tested output confirms the model
  stays within the original resume's actual skills/experience.
- Copy and download are implemented client-side (clipboard API, Blob +
  temporary anchor) — no new backend endpoint needed for either.

**Status:** Sprint 5 — **Complete**. Full pipeline tested end-to-end:
resume upload → job description submit → queued AI analysis → real match
score, missing keywords, AND a rewritten resume draft — with copy/download
working on the frontend. This is the project's core value proposition,
fully functional.

---

## Sprint 6 — ATS-safe DOCX Export

```
docx.service.ts → generateResumeDocx(tailoredText)
   │
Split tailoredText into paragraphs
   │
Build a Word document (docx npm package):
  - Calibri, 11pt body text
  - Single-column layout — no tables, text boxes, or images (ATS-safe)
  - Standard 1-inch margins
   │
Packer.toBuffer() → in-memory Buffer, no temp files on disk

---

Client (tailor results page, "Download as .docx" button)
   │
GET /api/jobs/:jobDescriptionId/download
   │  Authorization: Bearer <token>
   │
Routes → requireAuth → Controller
   │
Service.getTailoredDocx(userId, jobDescriptionId)
   │
Ownership check: does this jobDescriptionId belong to userId?
   │
 No ──► { success:false, error:"Job not found" } ──► 404
   │
 Yes
   │
Find most recent TailoredVersion for this job
   │
 tailoredText empty/missing? ──► { success:false,
                                    error:"Tailored resume not ready yet" }
   │
 Yes, has content
   │
generateResumeDocx(tailoredText) → Buffer
   │
Controller sets headers (Content-Type: .docx mime, Content-Disposition:
attachment) and sends the raw buffer — NOT wrapped in sendResponse,
since this is a binary file response, not JSON
   │
Client receives blob → triggers browser download via a temporary
anchor element (same pattern as the .txt download, but the blob comes
from the fetch response instead of being built from tailoredText directly)
```

**Key decisions:**
- DOCX generation happens entirely in memory (`Packer.toBuffer()`) — no
  temporary files written to disk, which keeps the endpoint stateless and
  safe for concurrent requests.
- The download endpoint is the one place in the API that intentionally
  does NOT use the `sendResponse` JSON envelope — a binary file response
  needs raw bytes and file-specific headers, not a JSON wrapper. This is
  a deliberate, documented exception to the standard pattern, not an
  inconsistency.
- "ATS-safe" here specifically means: no tables, no multi-column layout,
  no text boxes/images, and a standard font — these are the layout
  features most likely to break ATS text extraction in real systems.

**Status:** Sprint 6 — **Complete**. Verified end-to-end: opened the
downloaded .docx in Microsoft Word — Calibri font, clean single-column
paragraphs, correct content matching the AI-tailored text. Both .txt and
.docx download options work from the frontend.

---

## Sprint 6 — Enhancement: Structured Resume + Real Hyperlinks

After initial Sprint 6 testing, the tailored resume was still a single
flat paragraph — not an actual resume layout — and any links in the
original resume (GitHub, LinkedIn, Portfolio) were lost as plain text.
This enhancement fixes both.

```
Resume upload (DOCX only)
   │
mammoth.convertToHtml() → parse <a href="..."> tags
   │
Extract [{ text, url }] → save as Resume.links (new Json? column)
   │
(PDF uploads: links stays [] — out of scope, PDF link extraction is
 more complex and wasn't needed for the target use case)

---

tailor.worker.ts → analyzeMatch(resumeText, jobText, resume.links)
   │
AI prompt now includes the real captured links as context, with a hard
rule: use these exact URLs only, never fabricate a URL
   │
tailoredResume.contactLine is now a structured object, not a string:
{ email, phone?, location?, links: [{ label, url }] }
   │
Rest of tailoredResume unchanged (fullName, title, summary, skills,
experience, education, projects, certifications)

---

docx.service.ts → renders contactLine.links using the docx library's
ExternalHyperlink feature — actual clickable, blue/underlined hyperlinks
in the downloaded .docx (not plain text). Also compacted to one page:
0.5" margins, tightened font sizes (9.5-22pt) and paragraph spacing.
```

**Key decisions:**
- Only DOCX uploads capture links (via HTML conversion, since mammoth's
  plain-text extraction discards hyperlink targets entirely). PDF uploads
  intentionally get an empty links array rather than attempting more
  complex PDF link extraction — a documented scope boundary, not a bug.
- The AI is given the real URLs as context and explicitly instructed
  never to invent one — if a link label exists in the resume text with no
  matching captured URL, it's rendered as plain text rather than a
  fabricated/broken link.
- One-page layout was a deliberate density pass (smaller margins, tighter
  spacing) after the first structured version overflowed to two pages —
  matches how real ATS-friendly resume templates are typically formatted.

**Status:** Complete. Verified end-to-end: downloaded DOCX fits one page,
sections match a real resume layout (summary, skills, experience with
bullets, education, projects, certifications), and GitHub/LinkedIn/
Portfolio links are live, clickable hyperlinks pointing to the correct URLs.
