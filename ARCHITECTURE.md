# Architecture — Mini Helpdesk

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Clients                                                                │
│                                                                         │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  End-Customer     │    │  Agent (browser)  │    │  Admin (browser)  │  │
│  │  (no auth)        │    │  JWT Bearer       │    │  JWT Bearer       │  │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘   │
└───────────┼──────────────────────┼──────────────────────┼───────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend — React + Vite (SPA)                                          │
│  Port 3000 (dev) / static build (prod)                                  │
│                                                                         │
│  • React Router v6 — client-side routing                                │
│  • React Query — server-state cache, optimistic updates                 │
│  • Zod + React Hook Form — client-side validation                       │
│  • Axios — HTTP client with JWT interceptor                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │  REST / JSON
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend — Node.js + Express + TypeScript                               │
│  Port 4000                                                              │
│                                                                         │
│  Middleware stack (in order):                                            │
│    Helmet → CORS → JSON parser → Request Logger (Pino)                  │
│                                                                         │
│  Route groups:                                                          │
│    /api/auth     — POST /login (public, rate-limited)                   │
│    /api/tickets  — public: POST /, POST /status (rate-limited)          │
│                    protected: GET /, GET /:id, POST /:id/reply,         │
│                    PATCH /:id/status, PATCH /:id/assign (admin only)    │
│    /api/users    — GET /agents (admin only)                             │
│                                                                         │
│  Global error handler → consistent { success, error } envelope          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │  Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  MongoDB Atlas (cloud) / MongoDB (Docker for local)                     │
│  Database: helpdesk                                                     │
│  Collections: users, tickets, ticketevents                              │
└─────────────────────────────────────────────────────────────────────────┘

Future additions (dashed):
- ┄ Redis for session cache / rate-limit store
- ┄ S3-compatible object store for file attachments
- ┄ WebSocket gateway (Socket.IO) for real-time ticket updates
- ┄ AI service (Gemini / Groq) for reply drafting & auto-classification
```

---

## Data Model, Indexes & Schema Tradeoff

### Collections

| Collection     | Key Fields                                                        | Purpose                        |
|----------------|-------------------------------------------------------------------|--------------------------------|
| **users**      | `email` (unique, indexed), `password` (select: false), `role`     | Agent & admin accounts         |
| **tickets**    | `name`, `email`, `subject`, `body`, `priority`, `status`, `assignee` (ref → User) | Support tickets         |
| **ticketevents** | `ticketId` (ref → Ticket), `type`, `message`, `createdBy` (ref → User), `createdAt` | Immutable event log  |

### Indexes

| Collection       | Index                              | Rationale                                                |
|------------------|------------------------------------|----------------------------------------------------------|
| `users`          | `{ email: 1 }` unique             | Login lookup by email.                                   |
| `tickets`        | `{ subject: "text", body: "text" }` (weights: subject 5, body 1) | Full-text search with subject boosted.     |
| `tickets`        | `{ status: 1, createdAt: -1 }`    | Dashboard listing filtered by status, sorted by newest.  |
| `tickets`        | `{ assignee: 1 }`                 | Agent-scoped queries ("my tickets").                     |
| `tickets`        | `{ email: 1 }`                    | Public status-check lookup.                              |
| `tickets`        | `{ priority: 1 }`                 | Filter by priority.                                      |
| `ticketevents`   | `{ ticketId: 1, createdAt: 1 }`   | Efficiently load a ticket's timeline in order.           |

### Schema Tradeoff: Separate Events Collection vs. Embedded Array

We store ticket events in a **separate `ticketevents` collection** rather than embedding them as a sub-array inside each `ticket` document.

**Why:** MongoDB documents have a 16 MB size limit. A long-running ticket with hundreds of replies and status changes could approach that cap if events were embedded. A separate collection also makes it cheap to query across events (e.g., "all replies by agent X this week") and append new events without rewriting the parent document. The tradeoff is an extra query to load the timeline on the detail view, but we mitigate this with a compound index `{ ticketId: 1, createdAt: 1 }` that keeps timeline reads fast.

---

## Auth & Authorization Model

### Authentication

1. An agent or admin sends `POST /api/auth/login` with email + password.
2. The password is verified against a **bcrypt** hash stored in MongoDB (passwords are never stored in plain text and are excluded from queries by default via `select: false`).
3. On success, a **JWT** is signed with the user's `{ id, email, role }` payload using `jsonwebtoken`. The token expires after 1 day (configurable via `JWT_EXPIRES_IN`).
4. The frontend stores the token in memory (React context) and attaches it as a `Bearer` token on every protected request via an Axios interceptor.

### Authorization

Every protected route passes through two middleware layers:

- **`authMiddleware`** — Extracts and verifies the JWT from the `Authorization` header. Attaches `req.user` or rejects with `401 Unauthorized`.
- **`requireRole(...roles)`** — Checks `req.user.role` against the allowed roles for that endpoint. Rejects with `403 Forbidden` on mismatch.

### Cross-Agent Data Isolation

- When an **agent** fetches tickets (`GET /api/tickets`), the service layer forces the filter `{ assignee: <their ObjectId> }`, ignoring any `assignee` query param they pass. Agents can never see another agent's tickets.
- On detail, reply, and status-change endpoints, the `ensureAccess()` helper verifies the caller is either the assigned agent or an admin before proceeding.
- **Admins** bypass all assignee restrictions and can view, reply to, and reassign any ticket.

---

## Scaling

### 1,000 Tenants / 1M Tickets

The first bottleneck is **MongoDB**. A single replica set handles 1M documents comfortably, but full-text search degrades as the `$text` index grows. We would migrate search to a dedicated engine (Elasticsearch or MongoDB Atlas Search) for relevance-ranked, faceted results. Pagination already uses `skip/limit`, but at deep offsets this is slow; switching to **cursor-based pagination** (keyset on `_id` or `createdAt`) would eliminate the O(n) skip cost. The event-sourced timeline table grows linearly with activity — partitioning or TTL indexes on closed-ticket events would cap storage. Finally, the single-process Express server would be replaced with a **horizontally scaled cluster** behind a load balancer, with rate-limit state moved from in-memory to **Redis**.

### 100 Concurrent Agents

The bottleneck shifts to **real-time contention**. Multiple agents viewing or replying to the same ticket without coordination leads to stale reads and conflicting status changes. We would add **WebSocket channels** (Socket.IO or SSE) that broadcast ticket mutations to all subscribed agents, eliminating polling and enabling live-typing indicators. Optimistic locking (via a `version` field on tickets) would prevent silent overwrites. JWT verification on every request is CPU-bound — at 100 agents with frequent polling, we would introduce a **Redis-backed session cache** to avoid repeated cryptographic verification.

### What We'd Change

In both scenarios, the priority changes are: (1) Redis for shared rate-limit and session state, (2) WebSocket layer for real-time updates, and (3) dedicated search infrastructure to offload full-text queries from MongoDB.

---

## Observability

### Logging

All request/response cycles are logged via **Pino** (structured JSON in production, pretty-printed in development). Each log entry includes method, URL, status code, and response time. Auth failures and validation errors are logged at `WARN` level. Unhandled exceptions are logged at `ERROR` with full stack traces (never exposed to the client — the API returns a generic `"Internal server error"` message).

### Metrics to Measure

- **Request latency** (p50, p95, p99) per endpoint — detect slow queries.
- **Error rate** (4xx / 5xx) per endpoint — detect regressions.
- **Ticket throughput** — tickets created/hour, replies/hour.
- **MongoDB operation time** — slow queries via the `explain` profiler.
- **JWT verification failures** — detect token expiry spikes or brute-force attempts.
- **Rate-limit hits** — detect abuse or misconfigured limits.

### Alerts

- **5xx rate > 1%** over 5 minutes → page on-call.
- **Avg response time > 2s** → investigate DB or downstream.
- **MongoDB connection pool exhaustion** → scale or optimize queries.
- **Rate-limit 429 spike** → possible abuse; review source IPs.
- **Zero successful logins in 15 minutes** (during business hours) → auth system may be down.

---

## Top 3 Items for Week 2–3

1. **AI-Powered Reply Drafting** — Integrate a free-tier LLM (Google Gemini or Groq) to generate a suggested reply based on the ticket's body and conversation history. The agent reviews and edits before sending. This dramatically reduces average response time for common queries.

2. **Real-Time Updates via WebSockets** — Replace polling with a Socket.IO layer that pushes ticket mutations (new reply, status change, reassignment) to all connected agents viewing the affected ticket. This eliminates stale data and improves collaboration when multiple agents are online.

3. **File Attachments** — Allow customers to attach screenshots or documents when submitting tickets, and agents to attach files in replies. Files would be stored in S3-compatible storage (e.g., Cloudflare R2 free tier) with signed URLs for secure access. The `TicketEvent` schema gains an optional `attachments` array with `{ filename, url, sizeBytes, mimeType }`.
