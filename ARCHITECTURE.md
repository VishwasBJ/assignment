# Architecture Overview

## System Diagram

```
Browser (Next.js 16)
        │  HTTPS / JSON
        ▼
 ┌─────────────────┐
 │  NestJS 10 API  │  :3001
 │  (REST + Swagger)│
 └────────┬────────┘
          │ Prisma 5 ORM
          ▼
   PostgreSQL 15
          │
          │ (AI review / chat)
          ▼
  OpenAI-compatible LLM
  (OpenAI / LM Studio / Ollama / OpenRouter / Custom)
```

---

## Frontend Architecture (Next.js 16 App Router)

### Routing

Uses the App Router with the `src/app/` directory:

```
src/app/
  page.tsx                    → Landing page (public)
  login/page.tsx              → Login (public)
  register/page.tsx           → Register (public)
  dashboard/
    layout.tsx                → Protected shell: AuthProvider + RequireAuth + DashboardNav
    page.tsx                  → Project list
    settings/page.tsx         → AI provider management
    projects/[id]/page.tsx    → Project detail (files / reviews / chat tabs)
```

`params` in `[id]/page.tsx` is consumed via React's `use()` because Next.js 16 makes `params` a **Promise** (breaking change from v15).

### Route Protection

- `src/proxy.ts` — replaces the deprecated `middleware.ts` (renamed in Next.js 16). Redirects unauthenticated requests to `/login` for `/dashboard/**` routes.
- `RequireAuth` client component — secondary guard that checks Zustand store; redirects immediately if token is absent after hydration.

### State Management

- Zustand (`src/store/auth.ts`) — single store for `user`, `token`, and auth actions. Persisted to `localStorage` and re-hydrated on mount via `AuthProvider`.

### API Layer

- `src/lib/api.ts` — Axios instance with:
  - Request interceptor: attaches `Authorization: Bearer <token>` from `localStorage`.
  - Response interceptor: clears token and redirects to `/login` on `401`.

### Component Library

All shared UI lives in `src/components/ui/`:

| Component | Purpose |
|---|---|
| `GlassCard` | Frosted-glass panel with optional hover-lift |
| `GlassButton` | Primary / ghost / danger variants with loading spinner |
| `GlassModal` | Accessible overlay (Escape to close, backdrop click to close) |
| `GlassInput` / `GlassTextarea` | Form controls with label and error display |
| `SeverityBadge` | Colour-coded CRITICAL / HIGH / MEDIUM / LOW chip |
| `LoadingSpinner` / `FullPageSpinner` | Consistent loading state |

---

## Backend Architecture (NestJS 10)

### Module Structure

```
AppModule
  ├── PrismaModule (global)   → PrismaService used everywhere
  ├── AuthModule              → JWT + Passport + bcrypt
  ├── UsersModule             → User CRUD (internal use only)
  ├── ProjectsModule          → Project CRUD
  ├── FilesModule             → Upload, tree building, file content
  ├── ReviewsModule           → Review engine orchestration
  ├── AiProvidersModule       → Provider config + adapter
  └── ChatModule              → Chat sessions and messages
```

### Auth Flow

```
POST /auth/register
  → bcrypt.hash(password, 12)
  → prisma.user.create()
  → jwtService.sign({ sub, email, username })
  → { accessToken, user }

POST /auth/login
  → bcrypt.compare()
  → jwtService.sign()
  → { accessToken, user }

Protected routes → JwtAuthGuard → JwtStrategy.validate()
  → loads user from DB, attaches to req.user
```

### File Upload

Files are stored as text content directly in PostgreSQL (no filesystem dependency), making the app stateless and easy to deploy. Binary files are silently skipped — only text/code extensions are accepted. The upload endpoint accepts `multipart/form-data` with up to 100 files, each up to 10 MB.

The file tree is built server-side by splitting each file's `path` field on `/` and assembling a nested object, then serialised as a recursive `TreeNode` structure for the frontend.

### AI Provider Adapter (Strategy Pattern)

```
ReviewEngineService / ChatService
        │ calls
        ▼
AiAdapterService.complete(opts)
        │ resolves provider from DB
        │ builds OpenAI-compatible request
        ▼
axios.post(`${provider.baseUrl}/chat/completions`, { model, messages, … })
```

All five provider types (OpenAI, LM Studio, Ollama, OpenRouter, Custom) share the same OpenAI Chat Completions API shape. Swapping providers requires zero changes to business logic — only the `baseUrl`, `apiKey`, and `modelName` differ. This is the **Strategy pattern**: the adapter selects the correct "strategy" (provider) at runtime based on what the user has configured.

### Review Engine

Each of the three review templates (`SECURITY`, `PERFORMANCE`, `CODE_QUALITY`) has a dedicated system prompt in `review-engine.service.ts`. The prompts instruct the AI to return **only valid JSON** matching a fixed schema:

```json
{
  "summary": "string",
  "issues": [{ "severity", "category", "title", "description", "suggestion", "file", "line" }],
  "recommendations": ["string"],
  "severity": "CRITICAL | HIGH | MEDIUM | LOW"
}
```

The service strips any markdown code fences the AI might add, then parses the JSON. On parse failure it wraps the raw text into a safe fallback object rather than throwing.

### Chat — Code Retrieval

Rather than embeddings, a lightweight keyword-overlap score is used:

1. Tokenise the user's message into words > 3 characters.
2. For each project file, count how many tokens appear in `path + content`.
3. Sort descending; take the top 3.
4. Inject those files as code blocks into the system prompt.

This is intentionally simple — accurate enough for typical Q&A without requiring a vector database.

---

## Database Design

```
users ──< projects ──< files
                  ──< reviews
                  ──< chat_sessions ──< messages
users ──< ai_providers
users ──< chat_sessions
```

Key decisions:
- **Cascade deletes** — deleting a project removes all its files, reviews, and chat sessions automatically.
- **File content in DB** — avoids filesystem/S3 dependency; works fine for text files up to tens of KB each.
- **`fileIds: String[]`** on `Review` — stores which files were reviewed without a join table.
- **`issues` and `recommendations` as `Json`** — the AI output schema may evolve; `Json` avoids migrations for minor changes to issue fields.
- **`AIProvider` per user** — each user configures their own provider; no shared global config.

---

## AI Integration Flow

```
User clicks "Run Review"
  │
  ├─ Frontend: POST /projects/:id/reviews { templateType, fileIds?, providerId? }
  │
  ├─ Backend: ReviewsService.createReview()
  │     ├─ Fetch files from DB
  │     ├─ Create Review record (status=IN_PROGRESS)
  │     ├─ Call ReviewEngineService.reviewFiles(files, template, userId)
  │     │     ├─ Build code block string from files
  │     │     ├─ Select system prompt for template
  │     │     └─ AiAdapterService.complete({ messages })
  │     │           └─ POST to provider's /chat/completions
  │     ├─ Parse JSON response
  │     └─ Update Review (status=COMPLETED, summary, issues, recommendations, severity)
  │
  └─ Frontend: displays expanded review card with issues + recommendations
```

---

## Deployment

Both services are containerised. `docker-compose.yml` provides:

- `postgres` — PostgreSQL 15 with persistent volume
- `backend` — NestJS, runs `prisma migrate deploy` before starting
- `frontend` — Next.js production build

For production deployment on a VPS or PaaS:
1. Set `JWT_SECRET` to a cryptographically random 64-char string.
2. Set `DATABASE_URL` to your managed PostgreSQL instance.
3. Set `FRONTEND_URL` in the backend env to your frontend domain.
4. Set `NEXT_PUBLIC_API_URL` in the frontend env to your backend domain.
5. Use a reverse proxy (nginx / Caddy) with TLS in front of both services.
