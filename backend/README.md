# Mini Helpdesk — Backend

Production-grade Node.js + Express + TypeScript + MongoDB (Mongoose) backend for a small helpdesk system.

- Public users can **create tickets** and **check status**
- **Agents** manage tickets assigned to them
- **Admins** manage all tickets and reassign them

---

## Tech Stack

- **Node.js** + **Express 4** + **TypeScript 5**
- **MongoDB** with **Mongoose 8**
- **JWT** auth, **bcrypt** password hashing
- **Zod** request validation
- **pino** + **pino-http** logging
- **helmet**, **cors**, **express-rate-limit**
- **Jest** + **supertest** + **mongodb-memory-server** for tests

---

## Folder Structure

```
src/
  config/          # env, logger, db connection
  controllers/     # request handlers + Zod schemas
  middleware/      # auth, role, error, rateLimit, validate, requestLogger
  models/          # Mongoose models (User, Ticket, TicketEvent)
  routes/          # express routers
  services/        # business logic
  scripts/         # seed script
  types/           # shared TS types
  utils/           # ApiError, response, jwt, password
  app.ts           # express app factory
  index.ts         # server entrypoint
tests/
  setup.ts         # in-memory mongo bootstrap
  helpers.ts       # test helpers
  auth.test.ts
  ticket.test.ts
```

---

## Setup

```bash
npm install
cp .env.example .env            # fill MONGO_URI + JWT_SECRET
npm run seed                    # creates agent1@xriseai.com + admin@xriseai.com
npm run dev                     # starts server on $PORT (default 4000)
```

Seeded credentials (defaults — override via env):

| Email                   | Role  | Password (default)   |
|------------------------|-------|----------------------|
| agent1@xriseai.com     | agent | `Agent@12345`        |
| admin@xriseai.com      | admin | `Admin@12345`        |

### Scripts

- `npm run dev`   — start with hot reload (ts-node-dev)
- `npm run build` — compile TS → `dist/`
- `npm start`     — run compiled server
- `npm run seed`  — seed agent + admin users
- `npm test`      — run Jest test suite
- `npm run lint`  — TypeScript typecheck

---

## Environment (`.env`)

| Name                    | Required | Default                        | Description                        |
|-------------------------|----------|--------------------------------|------------------------------------|
| `PORT`                  | no       | `4000`                         | HTTP port                          |
| `NODE_ENV`              | no       | `development`                  | `development` / `test` / `production` |
| `MONGO_URI`             | **yes**  | —                              | MongoDB connection string          |
| `JWT_SECRET`            | **yes**  | —                              | JWT signing secret (≥16 chars)     |
| `JWT_EXPIRES_IN`        | no       | `1d`                           | JWT lifetime                       |
| `CORS_ORIGINS`          | no       | `*`                            | Comma-separated origins            |
| `RATE_LIMIT_WINDOW_MS`  | no       | `60000`                        | Public route rate-limit window     |
| `RATE_LIMIT_MAX`        | no       | `30`                           | Max public requests / window       |
| `LOG_LEVEL`             | no       | `info`                         | pino log level                     |
| `SEED_AGENT_PASSWORD`   | no       | `Agent@12345`                  | Password for seeded agent          |
| `SEED_ADMIN_PASSWORD`   | no       | `Admin@12345`                  | Password for seeded admin          |

---

## API

All responses follow the shape:

```jsonc
// success
{ "success": true, "data": {...} }

// error
{ "success": false, "error": { "message": "..." } }
```

Base URL: `http://localhost:4000/api`

### Health

```http
GET /api/health
```

### Auth

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@xriseai.com", "password": "Admin@12345" }
```

Returns `{ token, user }`. Use `Authorization: Bearer <token>` for protected routes.

### Public (rate limited)

```http
POST /api/tickets
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "Can't log in",
  "body": "Getting 500 error on login",
  "priority": "high"   // optional: low | medium | high
}
```

```http
POST /api/tickets/status
{ "ticketId": "<id>", "email": "jane@example.com" }
```

### Protected — Agent + Admin

```http
GET /api/tickets?page=1&limit=20&status=open&priority=high&assignee=<userId|unassigned>&search=login
Authorization: Bearer <token>
```

- `page` (default `1`), `limit` (default `20`, max `100`)
- Filters: `status`, `priority`, `assignee` (user id or `unassigned`)
- `search` — MongoDB text search on `subject + body` (sorted by relevance)
- Agents always see only their own assigned tickets (assignee filter is ignored for agents)
- Admin sees all tickets

```http
GET /api/tickets/:id
POST /api/tickets/:id/reply         { "message": "..." }
PATCH /api/tickets/:id/status       { "status": "open|in_progress|closed" }
```

### Admin only

```http
PATCH /api/tickets/:id/assign
{ "assigneeId": "<userId>" }
```

---

## Data Model

**User** — email (unique, indexed), password (bcrypt, hidden by default), role (`agent | admin`), timestamps.

**Ticket** — name, email (indexed), subject, body, priority (indexed), status (indexed), assignee ref User (indexed), timestamps.
Text index on `subject + body` (weights 5/1) for relevance search.

**TicketEvent** — ticketId (indexed), type (`created | reply | status_change | reassigned`), message, createdBy ref User (nullable), createdAt (indexed).
Compound index `{ ticketId, createdAt }` for efficient timeline queries.

> **Design note:** events live in a separate collection rather than embedded in tickets to avoid unbounded document growth and to keep the timeline scalable.

---

## Security

- Passwords hashed with **bcrypt** (10 rounds)
- JWT signed with `JWT_SECRET`, verified on every protected route
- **helmet** security headers, **CORS** restricted by allow-list
- **express-rate-limit** on public routes (`POST /tickets`, `POST /tickets/status`)
- No stack traces leak to clients — `errorHandler` emits sanitized responses
- Zod validation on all inputs; Mongoose cast/validation errors mapped to 400
- Role-based guards: agents can only access their own tickets, only admin can reassign

---

## Testing

```bash
npm test
```

Tests spin up an in-memory MongoDB via `mongodb-memory-server`. Coverage includes:

- Auth: valid login, bad password, malformed input
- Public ticket creation + status lookup (incl. wrong-email 404)
- Role access: agents see only their tickets, admins see all
- Admin-only reassignment, agent 403 on reassign, agent 403 on unassigned ticket access
