# Mini Helpdesk

Full-stack helpdesk system with a Node.js/Express backend and a React frontend.

- Public users can **submit tickets** and **check ticket status**
- **Agents** manage tickets assigned to them
- **Admins** manage all tickets and reassign them

---

## Monorepo Structure

```
xrise/
  backend/     # Node.js + Express + TypeScript + MongoDB API
  frontend/    # React + TypeScript + Vite SPA
```

Each folder is a self-contained project with its own `package.json`, dependencies, and README.

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # fill MONGO_URI + JWT_SECRET
npm run seed               # seed agent + admin accounts
npm run dev                # API on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_BASE_URL=http://localhost:4000/api
npm run dev                # UI on http://localhost:5173
```

---

## Seeded Accounts

| Email                 | Role  | Password (default) |
|-----------------------|-------|--------------------|
| agent1@xriseai.com   | agent | `Agent@12345`      |
| admin@xriseai.com    | admin | `Admin@12345`      |

---

## Docs

- [Backend README](backend/README.md) — API reference, environment variables, data model, testing
- [Frontend README](frontend/README.md) — pages, auth flow, environment variables
