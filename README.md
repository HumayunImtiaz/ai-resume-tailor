<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">🎯 ShortlistAI</h1>

<p align="center">
  <strong>An intelligent, full-stack SaaS application that uses AI to tailor your resume for any job description — maximizing your ATS (Applicant Tracking System) match score and helping you land more interviews.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-environment-variables">Env Variables</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://github.com/HumayunImtiaz/ai-resume-tailor/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  <img src="https://img.shields.io/github/license/HumayunImtiaz/ai-resume-tailor?style=flat-square" alt="License" />
  <img src="https://img.shields.io/github/last-commit/HumayunImtiaz/ai-resume-tailor?style=flat-square" alt="Last Commit" />
</p>

---

## 🚀 Features

### Core AI Pipeline
- **Two-Stage ATS Evaluation** — Before generating, see your original resume's ATS score, missing skills, and gaps. After tailoring, see the improved score with a clear before/after comparison.
- **Intelligent Resume Rewriting** — AI naturally integrates missing keywords and skills into your resume content (summaries, bullet points, skills section) rather than just listing them.
- **Categorized Skill Extraction** — Skills are automatically grouped into logical categories (Programming Languages, Frameworks, Cloud, etc.).

### Resume Management
- **PDF & DOCX Parsing** — Upload your resume in PDF or DOCX format; text and hyperlinks are extracted automatically.
- **Cover Letter Support** — Upload a cover letter to provide additional context for better AI tailoring.
- **Multiple Resume Versions** — Generate and manage multiple tailored versions for different job descriptions.
- **Individual & Bulk Delete** — Delete single tailored versions or wipe all at once from Settings.

### Export & Preview
- **WYSIWYG Preview** — Pixel-perfect, responsive resume preview that matches the exported document exactly using CSS container queries.
- **PDF Export** — Generate a professionally formatted, ATS-safe PDF using `pdf-lib`.
- **DOCX Export** — Generate a Word document with real hyperlinks, structured sections, and clean formatting.

### User Experience
- **Fully Responsive** — Works flawlessly on desktop, tablet, and mobile with a slide-out sidebar drawer.
- **Real-time Progress Tracking** — Live status polling shows queue position and processing state.
- **Modern SaaS UI** — Premium dark sidebar, glassmorphism cards, smooth transitions, and micro-animations.
- **Secure Authentication** — JWT-based auth with HTTP-only cookies, rate limiting, and Helmet security headers.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI Engine** | Groq SDK (LLaMA 3) |
| **Database** | PostgreSQL 16 via Prisma ORM |
| **Job Queue** | BullMQ + Redis 7 |
| **File Storage** | Cloudinary |
| **Document Generation** | `pdf-lib` (PDF), `docx` (DOCX) |
| **File Parsing** | `pdf-parse` (PDF), `mammoth` (DOCX) |
| **Security** | JWT, bcrypt, Helmet, express-rate-limit, CORS |
| **Logging** | Winston (structured, colorized) |
| **API Docs** | Swagger UI (swagger-jsdoc) |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker Compose |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                      │
│  Landing Page ─── Login/Signup ─── Dashboard ─── Settings    │
│                          │                                   │
│           ┌──────────────┼──────────────┐                    │
│           ▼              ▼              ▼                    │
│    Resume Upload    Job Input    Version History              │
│           │              │              │                    │
└───────────┼──────────────┼──────────────┼────────────────────┘
            │              │              │
            ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API SERVER (Express)                      │
│                                                              │
│   Auth ── Resume ── Job ── Analyze ── Export (PDF/DOCX)      │
│            │         │                                       │
│            ▼         ▼                                       │
│    ┌──────────┐  ┌────────────┐                              │
│    │Cloudinary│  │  BullMQ    │◄──── Redis                   │
│    │(Storage) │  │  (Queue)   │                               │
│    └──────────┘  └─────┬──────┘                              │
│                        │                                     │
│                        ▼                                     │
│               ┌────────────────┐                             │
│               │  Tailor Worker  │──── Groq AI (LLaMA 3)      │
│               └────────┬───────┘                             │
│                        │                                     │
│                        ▼                                     │
│               ┌────────────────┐                             │
│               │  PostgreSQL    │ (Prisma ORM)                │
│               └────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Upload** → User uploads resume (PDF/DOCX) → Text extracted → Stored in DB + Cloudinary
2. **Analyze** → User submits job description → AI performs initial gap analysis → Returns "Before" score
3. **Tailor** → User clicks "Optimize" → Job queued in BullMQ → Worker rewrites resume via Groq AI
4. **Result** → Worker saves tailored version → Frontend polls status → Displays "After" score + preview
5. **Export** → User downloads PDF or DOCX → Generated server-side with exact layout fidelity

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (for PostgreSQL + Redis)
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)
- **Cloudinary Account** — Free tier at [cloudinary.com](https://cloudinary.com) (optional, for file storage)

### 1. Clone the Repository

```bash
git clone https://github.com/HumayunImtiaz/ai-resume-tailor.git
cd ai-resume-tailor
```

### 2. Start Infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your keys (see Environment Variables section)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The backend API will be running at **http://localhost:4000**

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be running at **http://localhost:3000**

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser. Create an account and start tailoring!

---

## 🔑 Environment Variables

### Root `.env`

```env
DATABASE_URL="postgresql://resume_tailor:resume_tailor@localhost:5432/resume_tailor?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
JWT_SECRET="replace-with-a-long-random-string"
PORT=4000
```

### Backend `.env`

```env
FRONTEND_URL="http://localhost:3000"
GROQ_API_KEY="your-groq-api-key"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

> **Note:** The Groq API key is required for AI features. Cloudinary is optional — if not configured, file uploads will still work but files won't be stored in the cloud.

---

## 📁 Project Structure

```
ai-resume-tailor/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI pipeline
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (5 models)
│   └── src/
│       ├── config/                # Database, Redis, Cloudinary, Logger, Swagger
│       ├── controllers/           # Request handlers (auth, resume, job)
│       ├── middlewares/           # Auth guard, rate limiter, error handler
│       ├── queues/                # BullMQ queue definitions
│       ├── routes/                # Express route definitions
│       ├── services/              # Business logic
│       │   ├── ai.service.ts      # Groq AI integration (analyze + tailor)
│       │   ├── pdf.service.ts     # PDF generation with pdf-lib
│       │   ├── docx.service.ts    # DOCX generation
│       │   ├── job.service.ts     # Job description & version management
│       │   └── resume.service.ts  # Resume upload & text extraction
│       ├── validators/            # Zod request validation schemas
│       ├── workers/               # BullMQ async worker (tailor processor)
│       ├── app.ts                 # Express app configuration
│       └── server.ts              # Server entry point
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard (job form + analysis)
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── profile/           # Resume & cover letter upload
│   │   │   ├── settings/          # Danger zone (delete all)
│   │   │   └── tailor/
│   │   │       └── result/[versionId]/ # Individual result view
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── DashboardSidebar.tsx   # Responsive sidebar with version history
│   │   ├── TailoredResult.tsx     # WYSIWYG preview + export + ATS cards
│   │   ├── ResumeUploader.tsx     # Drag-and-drop file upload
│   │   ├── TailorProgress.tsx     # Real-time progress indicator
│   │   └── ...
│   └── lib/
│       ├── api.ts                 # API fetch wrapper with auth
│       └── DashboardContext.tsx   # Global dashboard state
├── docker-compose.yml             # PostgreSQL + Redis containers
└── README.md
```

---

## 📖 API Documentation

Once the backend is running, access the **Swagger UI** at:

```
http://localhost:4000/api-docs
```

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create a new account |
| `POST` | `/api/auth/login` | Login and receive JWT cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Get current user info |
| `POST` | `/api/resumes/upload` | Upload resume (PDF/DOCX) |
| `GET` | `/api/resumes` | List all user resumes |
| `DELETE` | `/api/resumes/:id` | Delete a specific resume |
| `POST` | `/api/jobs/analyze` | Run initial ATS gap analysis |
| `POST` | `/api/jobs` | Submit job description for tailoring |
| `GET` | `/api/jobs/status/:jobId` | Poll processing status |
| `GET` | `/api/jobs/versions/:id` | Get tailored version details |
| `DELETE` | `/api/jobs/versions/:id` | Delete a tailored version |
| `GET` | `/api/jobs/:id/pdf` | Download tailored resume as PDF |
| `GET` | `/api/jobs/:id/docx` | Download tailored resume as DOCX |

---

## 🗄 Database Schema

```mermaid
erDiagram
    User ||--o{ Resume : has
    User ||--o{ CoverLetter : has
    User ||--o{ JobDescription : creates
    Resume ||--o{ TailoredVersion : generates
    JobDescription ||--o{ TailoredVersion : targets

    User {
        uuid id PK
        string name
        string email UK
        string passwordHash
        datetime createdAt
    }

    Resume {
        uuid id PK
        uuid userId FK
        string originalFilename
        string fileUrl
        text rawText
        json links
        datetime uploadedAt
    }

    CoverLetter {
        uuid id PK
        uuid userId FK
        string originalFilename
        string fileUrl
        text rawText
        datetime uploadedAt
    }

    JobDescription {
        uuid id PK
        uuid userId FK
        string title
        string company
        text rawText
        datetime createdAt
    }

    TailoredVersion {
        uuid id PK
        uuid resumeId FK
        uuid jobDescriptionId FK
        int matchScore
        json matchedSkills
        json missingSkills
        json atsAnalysis
        text tailoredText
        datetime createdAt
    }
```

---

## 🧪 Development

### Available Scripts

#### Backend

```bash
npm run dev           # Start dev server with hot-reload (tsx watch)
npm run build         # Compile TypeScript to dist/
npm run start         # Run production build
npm run lint          # Run ESLint
npm run test          # Run tests (Vitest)
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run database migrations
```

#### Frontend

```bash
npm run dev           # Start Next.js dev server
npm run build         # Build production bundle
npm run start         # Serve production build
npm run lint          # Run ESLint
```

### CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and pull request:

1. **Setup** — Node.js 20, PostgreSQL, Redis
2. **Backend** — Install deps → Generate Prisma → Lint → Build
3. **Frontend** — Install deps → Lint → Build

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- TypeScript strict mode
- ESLint for linting
- Prisma for database access (no raw SQL)
- Zod for request validation

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/HumayunImtiaz">Humayun Imtiaz</a>
</p>
