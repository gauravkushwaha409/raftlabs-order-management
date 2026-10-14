# Raftlabs Food — Order Management

Turborepo monorepo (pnpm 12, Node 24+): a food-ordering feature with menu, cart, checkout and live order tracking.

| Path | What |
| --- | --- |
| `apps/server` | NestJS 12 REST API (`/api/v1`, Swagger at `/api/v1/docs`), Prisma 7 + Postgres, Redis pub/sub, SSE + socket.io, Zod validation |
| `apps/app` | Customer app: menu, cart, sign-up/sign-in, checkout, my orders, live order tracking (React 19, Vite 8, TanStack Router/Query, Zustand, Tailwind 4) |
| `apps/admin` | Admin dashboard: sign-in, live orders table, status updates, delete (admin accounts only) |
| `packages/ui` | shadcn-based design system + Tailwind theme (`@package/ui/global.css`), lucide icons |
| `packages/query` | TanStack Query client/provider (localStorage persistence) + `useQuery`/`useMutation` wrappers |
| `packages/form` | react-hook-form + Zod wrappers (`FormInput`, `FormTextarea`, ...) |

## Setup

```sh
pnpm install
cp env/.env.example env/.env.development   # adjust if needed
pnpm docker:development:up                 # whole stack in Docker, or:
docker compose --env-file env/.env.development -f docker/docker-compose.development.yml up -d postgres redis
pnpm prisma:deploy && pnpm dev             # run apps on the host
```

Ports: server `8000`, app `3000`, admin `3001`, Postgres `5434`, Redis `6379`.
## Seed data

`pnpm prisma:seed` (script: `apps/server/prisma/seed.ts`, compiled with `tsconfig.seed.json`) fills demo data and is safe to rerun: existing rows are never changed. The dev Docker stack runs it automatically after migrating.

| Role | Email | Password | Where |
| --- | --- | --- | --- |
| Customer | `customer@example.com` | `Customer@12345` | app (`:3000`) |
| Admin | `admin@example.com` | `Admin@12345` | admin (`:3001`) |

`SEED_MODE` picks the env file and what is seeded:

| Mode | Command | Seeds |
| --- | --- | --- |
| development (default) | `pnpm prisma:development:seed` | menu, both accounts, 2 past orders for the customer |
| staging | `pnpm prisma:staging:seed` | menu, both accounts |
| production | `ALLOW_PRODUCTION_SEED=true pnpm prisma:production:seed` | menu, plus only the accounts whose `ADMIN_*` / `CUSTOMER_*` email **and** password are set. Refuses without the flag and never uses the demo passwords |

Override credentials with `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD`. `pnpm prisma:reset:hard` resets the DB, migrates and seeds. Seeding skips an email that already exists, so a database that already holds `admin@example.com` keeps its old password.

## Auth

- Email + password accounts (`User` table, roles `CUSTOMER` / `ADMIN`). Passwords are hashed with scrypt and a per-password salt.
- Sessions are a signed JWT in an **httpOnly** cookie (`access_token`, 7 days), so page scripts can never read it. The user is re-read from the DB on every request, so deleted or demoted accounts lose access immediately.
- Apps on a different site than the API: set `COOKIE_SAME_SITE=none` (forces `Secure`) and list the app origins in `VITE_APP_URL` / `VITE_ADMIN_URL` / `CORS_ORIGINS`. All API bodies are JSON, so cross-origin writes need a CORS preflight, which only allow-listed origins pass.
- Login and register are limited to 10 requests/min per IP, everything else to 100/min. Behind a reverse proxy set `TRUST_PROXY=1`.
- Customers must be signed in to order and can only see their own orders (anyone else gets a 404, also on the SSE stream). Admins see everything. The admin app only accepts `ADMIN` accounts.

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | – | `{ name, email, password }` → user + session cookie. 409 if the email exists |
| POST | `/auth/login` | – | `{ email, password }` → user + session cookie. 401 with one generic message for wrong password or unknown email |
| POST | `/auth/logout` | – | Clears the cookie |
| GET | `/auth/me` | user | Current user |
| GET | `/menu` | – | Available items (name, description, price in cents, image, category) |
| POST | `/orders` | user | `{ customerName, address, phone, items: [{ menuItemId, quantity }] }`. Prices come from the DB, never the client. 400 invalid input, 422 unknown/unavailable item |
| GET | `/orders/mine` | user | The caller's orders, newest first |
| GET | `/orders/:id` | owner or admin | 404 for anyone else |
| GET | `/orders/:id/events` | owner or admin | **SSE**: `order` events with the full order, `ping` keep-alive; completes on `DELIVERED`/`CANCELLED` |
| GET | `/orders?status=&limit=` | admin | All orders, newest first |
| PATCH | `/orders/:id/status` | admin | `{ status }`; 409 on an invalid transition |
| DELETE | `/orders/:id` | admin | 204 |

Status flow: `RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`; `CANCELLED` is allowed from `RECEIVED`/`PREPARING`.

## How real time works

- A simulator walks each new order through the statuses every `ORDER_STEP_MS` (default 10 s). Steps are compare-and-set updates, so several server instances or an admin overriding a status never double-advance an order. Unfinished orders resume after a restart.
- Every change is published on a Redis channel; each instance forwards it to SSE streams (owners) and the `/admin` socket.io namespace (admins only; the handshake carries the session cookie).

## Commands

`pnpm dev | build | test | check-types | check` · `pnpm --filter server test:e2e` · `pnpm prisma:migrate | deploy | studio` · `pnpm docker:<development|production>:<build|up|start|down|logs>`

## Tests (Vitest everywhere)

- Server: unit tests (order rules, service, simulator, auth, passwords, cookies, menu) and HTTP e2e tests (validation, CRUD, sessions, ownership and roles, status rules, SSE, admin websocket) run against in-memory Prisma/Redis fakes in `apps/server/test/fakes.ts`. No database needed.
- Apps: Testing Library + jsdom (menu, cart store, login/register/checkout validation, redirect safety, order tracker + SSE hook, admin table, admin login).

## Notes

- TypeScript 7 ships `tsc` only (no compiler API) so the Nest CLI cannot build/watch. Server builds with `tsc`, dev uses `tsc --watch` + `node --watch`. `nest generate` still works (`pnpm --filter server resource`). Revisit when TS 7.1 restores the API.
- Prisma pinned to 7.x: the npm `latest` tag is currently 8.0.0-rc.
- `nestjs-zod@5.5` does not declare Nest 12 in its peer range yet; it works (covered by the e2e tests).
