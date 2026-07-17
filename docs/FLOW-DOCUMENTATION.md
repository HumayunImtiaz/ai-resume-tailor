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
