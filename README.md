# AI Code Review Assistant

A production-oriented, full-stack AI code review tool. Upload your code, run security, performance, or code-quality reviews powered by any OpenAI-compatible LLM, and chat with an AI that understands your codebase.

![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%7C%20NestJS%2010%20%7C%20PostgreSQL-indigo)

---

## Features

| Feature | Details |
|---|---|
| **Auth** | Register / login / logout, JWT sessions, bcrypt password hashing |
| **Project management** | Create, view, delete projects with name & description |
| **Code upload** | Drag-and-drop multi-file upload; text/code files stored per project |
| **Code explorer** | Folder-hierarchy file tree, line-numbered file preview |
| **AI review engine** | Security · Performance · Code Quality templates; structured JSON output (summary, issues, recommendations, severity) |
| **Review history** | Store, list, search, expand past reviews |
| **AI chat** | Q&A grounded in uploaded code via keyword-relevance file retrieval |
| **Multi-provider AI** | OpenAI, LM Studio, Ollama, OpenRouter, or any custom OpenAI-compatible endpoint — configurable at runtime per user, never hardcoded |
| **Glassmorphism UI** | Frosted-glass design system: GlassCard, GlassButton, GlassModal, GlassInput, SeverityBadge |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| Backend | NestJS 10 · TypeScript |
| Database | PostgreSQL · Prisma 5 ORM |
| Auth | JWT · bcrypt · Passport.js |
| AI | Pluggable OpenAI-compatible adapter (strategy pattern) |
| Deployment | Docker · docker-compose |

---

## Quick Start (Local)

### Prerequisites

- Node.js ≥ 20
- PostgreSQL 15+ running locally (or Docker)
- An AI provider — OpenAI API key, or a local [LM Studio](https://lmstudio.ai/) / [Ollama](https://ollama.com/) instance

### 1 — Clone

```bash
git clone https://github.com/VishwasBJ/assignment.git
cd assignment
```

### 2 — Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init   # creates all tables
npm run start:dev
# → http://localhost:3001
# → Swagger UI: http://localhost:3001/api/docs
```

### 3 — Frontend

```bash
cd ../frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev
# → http://localhost:3000
```

### 4 — Add an AI Provider

After registering an account, go to **Settings → Add Provider** and fill in:

| Field | Example (OpenAI) | Example (LM Studio) |
|---|---|---|
| Provider Type | OPENAI | LM_STUDIO |
| Base URL | `https://api.openai.com/v1` | `http://localhost:1234/v1` |
| API Key | `sk-…` | *(leave empty)* |
| Model Name | `gpt-4o-mini` | `local-model` |

---

## Docker (One-command start)

```bash
cp backend/.env.example backend/.env   # set JWT_SECRET at minimum
docker-compose up --build
```

Services:
- `http://localhost:3000` — frontend
- `http://localhost:3001/api` — backend API
- `http://localhost:3001/api/docs` — Swagger

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret used to sign JWTs — use a long random string in production |
| `JWT_EXPIRES_IN` | — | Token lifetime (default `7d`) |
| `PORT` | — | Backend port (default `3001`) |
| `FRONTEND_URL` | — | CORS origin (default `http://localhost:3000`) |
| `MAX_FILE_SIZE_MB` | — | Max upload size per file (default `10`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |

---

## Database Setup

Prisma manages the schema at `backend/prisma/schema.prisma`.

```bash
# Apply migrations (creates tables)
cd backend && npx prisma migrate dev

# View data in browser
npx prisma studio
```

Tables: `users`, `projects`, `files`, `reviews`, `ai_providers`, `chat_sessions`, `messages`.

---

## Project Structure

```
assignment/
├── frontend/          # Next.js 16 App Router
│   └── src/
│       ├── app/       # Pages (route segments)
│       ├── components/# Reusable UI + feature components
│       ├── lib/       # API client, types, utils
│       └── store/     # Zustand state (auth)
├── backend/           # NestJS 10
│   └── src/
│       ├── auth/      # JWT auth module
│       ├── users/     # User service
│       ├── projects/  # Project CRUD
│       ├── files/     # Upload + file tree
│       ├── reviews/   # AI review engine
│       ├── ai-providers/  # Provider adapter (strategy pattern)
│       ├── chat/      # Chat sessions + messages
│       └── prisma/    # PrismaService (global)
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
└── AI_USAGE.md
```

---

## API Documentation

Swagger UI is auto-generated at `http://localhost:3001/api/docs` when the backend is running.

Key endpoints:

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
DELETE /api/projects/:id

POST   /api/projects/:id/files/upload
GET    /api/projects/:id/files/tree
GET    /api/projects/:id/files/:fileId

POST   /api/projects/:id/reviews
GET    /api/projects/:id/reviews?search=
GET    /api/projects/:id/reviews/:reviewId

GET    /api/ai-providers
POST   /api/ai-providers
PUT    /api/ai-providers/:id
DELETE /api/ai-providers/:id

POST   /api/projects/:id/chat/sessions
POST   /api/projects/:id/chat/sessions/:sid/messages
GET    /api/projects/:id/chat/sessions/:sid/messages
```
