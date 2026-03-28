# Frontend ↔ API integration

The web app (**`DCSPACE_NEXT_WEB`**, port **3000** by default) talks to **`DCSPACE_NEXT_API`** (port **3001**) only over HTTP. There is **no Prisma or database** in the web app.

## Environment

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL of the API (no trailing slash) |
| `NEXT_PUBLIC_SHOW_LOGIN_HINTS` | `false` | When `true`, `/login` shows a dev link to list user emails from MongoDB (API must run `next dev`; production `next start` returns 403 for hints) |

Copy [`.env.example`](.env.example) to `.env.local` for local development.

### Dev login hints

With `NEXT_PUBLIC_SHOW_LOGIN_HINTS=true`, the login page can call `GET /api/dev/login-hints` via [`lib/dev/loginTestHelper.ts`](lib/dev/loginTestHelper.ts). The route only works when the API process has `NODE_ENV=development`. Plaintext passwords are never stored in MongoDB; the UI shows a dev password line from [`DEV_LOGIN_PASSWORD_HINT` in the API `.env`](../DCSPACE_NEXT_API/.env.example) when set, otherwise a fallback that matches [`dc-space/back-end/prisma/seed.ts`](../dc-space/back-end/prisma/seed.ts) (`Password123!`).

## Auth (JWT)

1. User submits email/password on `/login`.
2. The client calls `POST {NEXT_PUBLIC_API_URL}/api/auth/login`.
3. The API returns `{ token, user }`; the client stores them in `localStorage` (`dc_auth_token`, `dc_auth_user`).
4. Authenticated calls use `Authorization: Bearer <token>` via [`lib/api/client.ts`](lib/api/client.ts).

Protected UI routes under `app/(main)/` are wrapped in [`AuthGate`](components/AuthGate.tsx), which redirects to `/login` if there is no token.

## CORS

The API must allow the web origin (`FRONTEND_ORIGIN` / `CORS_ORIGINS` in the API `.env`). See [DCSPACE_NEXT_API/README.md](../DCSPACE_NEXT_API/README.md).

## Runbook (two terminals)

```bash
# Terminal 1 — API
cd DCSPACE_NEXT_API && npm run dev

# Terminal 2 — Web
cd DCSPACE_NEXT_WEB && npm run dev
```

Ensure MongoDB is reachable and `npx prisma db push` has been run in `DCSPACE_NEXT_API` at least once.

## Admin API

Admin JSON contracts are documented in [README-ADMIN.md](README-ADMIN.md). Call those paths on **`NEXT_PUBLIC_API_URL`**, not on the Next.js web origin.
