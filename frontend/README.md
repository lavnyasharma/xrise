# Mini Helpdesk — Frontend

React + TypeScript + Vite frontend for the Mini Helpdesk system.

- Public users can **submit tickets** and **check ticket status**
- **Agents** view and manage their assigned tickets
- **Admins** manage all tickets and reassign them

---

## Tech Stack

- **React 18** + **TypeScript 5** + **Vite**
- **React Router v6** — client-side routing
- **TanStack Query v5** — server state, caching, refetching
- **React Hook Form** + **Zod** — form validation
- **Axios** — HTTP client with auth interceptor
- **jwt-decode** — reading JWT claims client-side

---

## Folder Structure

```
src/
  api/           # axios instance + typed API calls (auth, tickets)
  components/    # shared UI components + layout
  context/       # AuthContext (token, user, login/logout)
  hooks/         # custom hooks
  pages/         # route-level components
    Login.tsx
    Dashboard.tsx
    TicketDetail.tsx
    TicketSubmission.tsx
    TicketStatus.tsx
  types/         # shared TS types
  utils/         # helpers
  App.tsx        # router + QueryClientProvider
  main.tsx       # entry point
public/          # static assets
```

---

## Setup

```bash
npm install
cp .env.example .env       # set VITE_API_BASE_URL
npm run dev                # starts dev server on http://localhost:5173
```

### Environment (`.env`)

| Name                 | Required | Default                       | Description              |
|----------------------|----------|-------------------------------|--------------------------|
| `VITE_API_BASE_URL`  | yes      | `http://localhost:4000/api`   | Backend API base URL     |

### Scripts

- `npm run dev`     — start Vite dev server (HMR)
- `npm run build`   — type-check + compile to `dist/`
- `npm run preview` — preview production build locally
- `npm run lint`    — TypeScript typecheck

---

## Pages

| Route                | Access   | Description                                     |
|----------------------|----------|-------------------------------------------------|
| `/login`             | Public   | Agent / Admin login                             |
| `/submit`            | Public   | Submit a new support ticket                     |
| `/status`            | Public   | Check ticket status by ID + email               |
| `/dashboard`         | Agent+   | List of assigned (agent) or all (admin) tickets |
| `/tickets/:id`       | Agent+   | Ticket detail, reply, status change, reassign   |

---

## Auth Flow

- On login, the JWT is stored in `AuthContext` (in-memory + localStorage).
- The Axios instance reads the token from context and attaches `Authorization: Bearer <token>` on every request.
- `ProtectedRoute` redirects unauthenticated users to `/login`.
- Token expiry is checked via `jwt-decode`; expired tokens are cleared automatically.
