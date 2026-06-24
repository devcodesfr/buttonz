# Buttonz

<p align="center">
  <img src="./client/public/buttonz-icon.png" alt="Buttonz logo" width="120" />
</p>

Buttonz is the standalone communication app for the GameForgeStudio ecosystem. It gives GameForgeStudio users a focused place to join shared channels, create chats, send messages, and keep community/team communication separate from the main platform hub.

This project is framed as professional progress: the current app demonstrates the core communication architecture, identity handoff, session flow, database-backed chat model, and full-stack implementation. It is intentionally kept separate from GameForgeStudio so it can evolve as its own product while still using GFS as the identity and navigation layer.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, TanStack Query |
| UI | Tailwind CSS, Radix UI primitives, Lucide icons |
| Backend | Node.js, Express 5, TypeScript, Express sessions |
| Data | PostgreSQL, Drizzle ORM, postgres.js |
| Validation | Zod, drizzle-zod, shared TypeScript schemas |
| Build | Vite client build, tsx server runtime |

## Features

### Communication Experience

- Main GameForge channel created automatically for verified users.
- User-created group chats with membership checks.
- Message creation, editing, deletion, and paginated message reads.
- Chat list ordered by recent activity.
- User directory view for GameForgeStudio identities.

### GameForgeStudio Identity Flow

- Direct Buttonz login is disabled by design.
- Users are expected to sign in through GameForgeStudio first.
- Buttonz verifies a GFS session through `GAMEFORGE_URL` and creates a local Buttonz session.
- Client requests use `credentials: "include"` so session cookies are included with API calls.
- The UI includes return-to-GameForgeStudio behavior through `VITE_GFS_URL`.

### Product Direction

Buttonz is not embedded inside GFS. It is a separate app that GFS launches externally, which keeps communication concerns isolated from the main platform while still preserving ecosystem continuity.

## Architecture

Buttonz uses a focused full-stack TypeScript structure:

```text
client/          React app, Buttonz UI, hooks, query client, public logo assets
server/          Express server, auth/session flow, routes, storage layer, Vite integration
shared/          Drizzle table definitions, Zod insert schemas, shared app types
```

### Frontend

- React renders a single Buttonz app surface from `client/src/pages/buttonz.tsx`.
- TanStack Query manages server state for the current user, chats, messages, and users.
- Vite serves the frontend locally on port `5175` and proxies `/api` requests to the Buttonz backend.
- Tailwind and Radix-based components provide a compact chat UI with accessible primitives.

### Backend

- Express owns authentication handoff, session creation, chat routes, message routes, and user lookup.
- `POST /api/auth/gfs-session` verifies the active GameForgeStudio session before creating a Buttonz session.
- Protected routes require a Buttonz session and chat membership where appropriate.
- Errors are returned through JSON responses with HTTP status codes.

### Data Model

- `users` stores GameForgeStudio-compatible identity/profile data used by Buttonz.
- `chats` stores main and user-created chat channels.
- `chatMembers` connects users to chats and stores chat roles.
- `messages` stores text messages, timestamps, edit state, and optional replies.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in values for your local database and GameForgeStudio app.

```bash
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
SESSION_SECRET=replace-with-a-long-random-secret
PORT=5001
GAMEFORGE_URL=http://localhost:5000
VITE_GFS_URL=http://localhost:5174
USE_VITE_MIDDLEWARE=false
```

### 3. Prepare the database

Buttonz expects a PostgreSQL database with the schema defined in `shared/schema.ts`. It also expects user records compatible with GameForgeStudio identities so GFS session verification can map to a Buttonz user.

### 4. Run the app locally

For the most predictable development setup, run the backend and frontend separately:

```bash
npm run dev:server
npm run dev:client
```

The Vite dev server runs on `http://localhost:5175` and proxies API traffic to the backend on `http://127.0.0.1:5001`.

### 5. Run checks and build

```bash
npm run check
npm run build
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Buttonz backend with `tsx`. |
| `npm run dev:server` | Start the backend server directly. |
| `npm run dev:client` | Start the Vite frontend dev server. |
| `npm run check` | Run TypeScript type checking. |
| `npm run build` | Build the frontend into `dist/public`. |
| `npm run start` | Start the backend with `tsx`. |

## Current Status

Buttonz is active and in progress. The app currently demonstrates the standalone communication model, GFS session handoff, protected chat APIs, database-backed storage, and a dedicated chat-focused interface.

The next phase is focused on making the app more production-shaped: clearer deployment flow, stronger cross-app authentication strategy, more complete chat UX, and cleaner operational boundaries between Buttonz and GameForgeStudio.

## Roadmap

### Short Term

- Keep Buttonz launched externally from GameForgeStudio.
- Improve local setup documentation around shared identity and database requirements.
- Tighten the GameForgeStudio session verification flow.
- Polish empty, loading, and failed-auth states.

### Mid Term

- Add richer chat management flows for members, roles, and direct messages.
- Improve message interactions such as editing affordances, deletion UX, and reply threading.
- Document the shared identity contract between GFS and Buttonz.

### Long Term

- Keep Buttonz as a separately deployable ecosystem app.
- Build a stronger production authentication handoff between GFS and Buttonz.
- Add deployment, observability, authorization hardening, and migration workflows.
- Expand Buttonz into the communication layer for the broader GameForgeStudio product suite.

## Related Project

- [devcodesfr/gameforgestudio-platform](https://github.com/devcodesfr/gameforgestudio-platform) - central GameForgeStudio platform hub.

## Resume Notes

This project highlights full-stack TypeScript development, standalone product architecture, cross-app identity integration, REST API design, session authentication, PostgreSQL data modeling, and focused product separation inside a larger ecosystem.
