# Raftlabs Food — Order Management

Turborepo monorepo (pnpm 12, Node 24+): a food-ordering feature with menu, cart, checkout and live order tracking.

| Path | What |
| --- | --- |
| `apps/server` | NestJS 12 REST API (`/api/v1`, Swagger at `/api/v1/docs`), Prisma 7 + Postgres, Redis pub/sub, SSE + socket.io, Zod validation |
| `apps/app` | Customer app: menu, cart, checkout, live order tracking (React 19, Vite 8, TanStack Router/Query, Zustand, Tailwind 4) |
| `apps/admin` | Admin dashboard: live orders table, status updates, delete (key-protected) |
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
Admin sign-in key: `ADMIN_API_KEY` in the env file (default `dev-admin-key-change-me`; change it outside dev).
The menu is seeded automatically on first start when the table is empty.

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/menu` | – | Available items (name, description, price in cents, image, category) |
| POST | `/orders` | – | `{ customerName, address, phone, items: [{ menuItemId, quantity }] }`. Prices come from the DB, never the client. 400 invalid input, 422 unknown/unavailable item |
| GET | `/orders/:id` | – | Order by id (unguessable UUID acts as the tracking link) |
| GET | `/orders/:id/events` | – | **SSE**: `order` events with the full order, `ping` keep-alive; completes on `DELIVERED`/`CANCELLED` |
| GET | `/orders?status=&limit=` | admin | Newest first |
| PATCH | `/orders/:id/status` | admin | `{ status }`; 409 on an invalid transition |
| DELETE | `/orders/:id` | admin | 204 |

Admin auth = `x-admin-key` header (constant-time compare; no key configured means everything is denied).
Status flow: `RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`; `CANCELLED` is allowed from `RECEIVED`/`PREPARING`.

## How real time works

- A simulator walks each new order through the statuses every `ORDER_STEP_MS` (default 10 s). Steps are compare-and-set updates, so several server instances or an admin overriding a status never double-advance an order. Unfinished orders resume after a restart.
- Every change is published on a Redis channel; each instance forwards it to SSE streams (customers) and the `/admin` socket.io namespace (admin dashboard).

## Commands

`pnpm dev | build | test | check-types | check` · `pnpm --filter server test:e2e` · `pnpm prisma:migrate | deploy | studio` · `pnpm docker:<development|production>:<build|up|start|down|logs>`

## Tests (Vitest everywhere)

- Server: unit tests (order rules, service, simulator, guard, menu) and HTTP e2e tests (validation, CRUD, auth, status rules, SSE) run against in-memory Prisma/Redis fakes in `apps/server/test/fakes.ts`. No database needed.
- Apps: Testing Library + jsdom (menu, cart store, checkout validation, order tracker + SSE hook, admin table, login).

## Notes

- TypeScript 7 ships `tsc` only (no compiler API) so the Nest CLI cannot build/watch. Server builds with `tsc`, dev uses `tsc --watch` + `node --watch`. `nest generate` still works (`pnpm --filter server resource`). Revisit when TS 7.1 restores the API.
- Prisma pinned to 7.x: the npm `latest` tag is currently 8.0.0-rc.
- `nestjs-zod@5.5` does not declare Nest 12 in its peer range yet; it works (covered by the e2e tests).
