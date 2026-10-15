# Raftlabs Food — Order Management

Turborepo monorepo (pnpm 12, Node 24+): a food-ordering feature with menu, cart, checkout and live order tracking.

| Path | What |
| --- | --- |
| `apps/server` | NestJS 12 REST API (`/api/v1`, Swagger at `/api/v1/docs`), Prisma 7 + Postgres, Redis pub/sub, SSE + socket.io, Zod validation. Also runs as a **worker** (outbox relay + Kafka consumers) |
| `apps/app` | Customer app: menu, cart, sign-up/sign-in, checkout, my orders, live order tracking, notification bell (React 19, Vite 8, TanStack Router/Query, Zustand, Tailwind 4) |
| `apps/admin` | Admin dashboard: sign-in, live orders table, status updates, delete (admin accounts only) |
| `packages/ui` | shadcn-based design system + Tailwind theme (`@package/ui/global.css`), lucide icons |
| `packages/query` | TanStack Query client/provider (localStorage persistence) + `useQuery`/`useMutation` wrappers |
| `packages/form` | react-hook-form + Zod wrappers (`FormInput`, `FormTextarea`, ...) |

## Setup

```sh
pnpm install
cp env/.env.example env/.env.development   # adjust if needed
pnpm docker:development:up                 # whole stack in Docker, or:
docker compose --env-file env/.env.development -f docker/docker-compose.development.yml up -d postgres redis kafka
pnpm prisma:deploy && pnpm dev             # run apps on the host
```

Ports: server `8000`, app `3000`, admin `3001`, Postgres `5434`, Redis `6379`, Kafka `9094` (host listener). Host-run server and worker: `pnpm dev:server` and `pnpm dev:worker`.
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
| production | `ALLOW_PRODUCTION_SEED=true pnpm prisma:production:seed` | menu, plus only the accounts whose `ADMIN_*` / `CUSTOMER_*` email **and** password are set. Refuses without the flag and never uses the demo passwords |

Override credentials with `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD`. `pnpm prisma:reset:hard` resets the DB, migrates and seeds. Seeding skips an email that already exists, so a database that already holds `admin@example.com` keeps its old password.

## Auth

- Email + password accounts (`User` table, roles `CUSTOMER` / `ADMIN`). Passwords are hashed with scrypt and a per-password salt.
- Sessions are a signed JWT in an **httpOnly** cookie (`access_token`, 7 days), so page scripts can never read it. Requests are validated by a Passport JWT strategy (`AuthGuard`/`AdminGuard`); the user snapshot is cached in Redis for 60 s (`session:user:{id}`), so deleted or demoted accounts lose access within a minute. New methods (OAuth, API keys, …) plug in as extra strategies without touching the guards.
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
| GET | `/notifications` | user | `{ items, unreadCount }`, newest first (last 50) |
| GET | `/notifications/stream` | user | **SSE**: a `notification` event per new notification, `ping` keep-alive |
| PATCH | `/notifications/:id/read` | owner | 204; 404 for anyone else's |
| POST | `/notifications/read-all` | user | 204 |
| GET | `/orders?status=&limit=` | admin | All orders, newest first |
| PATCH | `/orders/:id/status` | admin | `{ status }`; 409 on an invalid transition |
| DELETE | `/orders/:id` | admin | 204 |

Status flow: `RECEIVED → PREPARING → OUT_FOR_DELIVERY → DELIVERED`; `CANCELLED` is allowed from `RECEIVED`/`PREPARING`.

## How real time works

- An opt-in simulator (`ORDER_SIMULATOR_ENABLED=true`) walks each new order through the statuses every `ORDER_STEP_MS` (default 10 s). Steps are compare-and-set updates, so several server instances or an admin overriding a status never double-advance an order. Unfinished orders resume after a restart. By default the simulator is off and statuses change only through explicit admin actions.
- Every change is published on a Redis channel; each instance forwards it to SSE streams (owners) and the `/admin` socket.io namespace (admins only; the handshake carries the session cookie).

## Caching (Redis, cache-aside)

- Hot reads go to Redis first and fall back to Postgres: session users (`session:user:{id}`, 60 s), the public menu (`menu:list`, 5 min), order details (`order:{id}`, 30 s). All keys/TTLs live in `apps/server/src/redis/constant/redis-keys.ts`.
- Writes invalidate: every menu mutation drops `menu:list`; every order write drops its `order:{id}`. Cache failures never fail a request — the DB stays the authority and the TTL bounds staleness.
- Order lists are deliberately uncached (combinatorial keys, live sockets already keep them fresh).

## Events and notifications (Kafka)

```
API ── tx: order + outbox row ──▶ Postgres
                                    │  worker: outbox relay (one active, advisory lock)
                                    ▼
                         Kafka  orders.events.v1  (key = orderId, N partitions)
                                    │  consumer group "notifications" (scale to N workers)
                                    ▼
              Notification row (unique eventId) ─▶ Redis ─▶ API instance ─▶ SSE ─▶ bell + toast
                                    ╰─ poison / exhausted retries ─▶ orders.events.v1.dlq
```

- **Outbox, not dual writes.** Creating an order or changing its status writes the state *and* an `OutboxEvent` row in one transaction (`order.placed`, `order.status_changed`). Nothing is lost if Kafka is down, and no event exists for a change that rolled back. The API never talks to Kafka, so it stays up when the broker is down.
- **Worker process** (`apps/server/src/worker.ts`, `WorkerModule`): the outbox relay publishes rows in insertion order and deletes them; consumers run here too. It is the same image as the API with another command, so it scales on its own: `docker compose ... up -d --scale worker=3`.
- **Ordering.** The Kafka key is the order id, so one order's events stay in order. The relay holds a Postgres advisory lock per batch, so exactly one relay publishes at a time (others are hot spares) and cross-relay reordering cannot happen.
- **Delivery is at-least-once, handlers are idempotent.** A crash between send and commit re-sends a batch, and Kafka may redeliver. `Notification.eventId` is unique, so a repeat is a no-op and the customer is notified once. The producer is idempotent with `acks=all`; offsets are committed only after the handler (or the dead-letter write) finished.
- **Failures.** Transient errors retry with exponential backoff (5 attempts). Malformed messages, or known event types with an invalid payload, go straight to `orders.events.v1.dlq` with the error, source partition/offset and attempt count in headers. Event types a newer producer adds are skipped, not dead-lettered, so rolling deploys are safe. If even the dead-letter write fails the worker exits and the orchestrator restarts it; the message is redelivered.
- **Scaling.** Parallelism per consumer group is bounded by the partition count (`KAFKA_PARTITIONS`, default 3, fixed when the topic is created; raise it with `kafka-topics.sh --alter` later). A new consumer group (analytics, email, ...) subscribes to the same topic without touching the producer: add a handler next to `NotificationsConsumer`.
- **Contract.** Events are versioned zod schemas in `apps/server/src/events/order-events.ts`; a breaking change becomes `orders.events.v2` with both versions served while consumers migrate.
- **Delivery to the browser.** The consumer stores the notification, then publishes it on Redis; the API instance that holds the user's SSE stream forwards it. Missed pushes are covered by `GET /notifications` on load.

Operate it: inspect the dead-letter topic with `kafka-console-consumer.sh --topic orders.events.v1.dlq --from-beginning --property print.headers=true` inside the `kafka` container, and lag with `kafka-consumer-groups.sh --describe --group notifications`. The compose broker is a single node for development and small deployments; point `KAFKA_BROKERS` at a managed or multi-broker cluster (and raise `KAFKA_REPLICATION_FACTOR`) for real production traffic.

## Commands

`pnpm dev | build | test | check-types | check` · `pnpm --filter server test:e2e` · `pnpm prisma:migrate | deploy | studio` · `pnpm docker:<development|production>:<build|up|start|down|logs>`

## Tests (Vitest everywhere)

- Server: unit tests (order rules, service + outbox, simulator, auth, passwords, cookies, menu, retry/dead-letter policy, outbox relay, notifications service and consumer) and HTTP e2e tests (validation, CRUD, sessions, ownership and roles, status rules, SSE, admin websocket, and the whole order → outbox → Kafka → notification path) run against in-memory Prisma/Redis/Kafka fakes in `apps/server/test/`. No database or broker needed.
- Apps: Testing Library + jsdom (menu, cart store, login/register/checkout validation, redirect safety, order tracker + SSE hook, notification feed + hook, admin table, admin login).

## Notes

- TypeScript 7 ships `tsc` only (no compiler API) so the Nest CLI cannot build/watch. Server builds with `tsc`, dev uses `tsc --watch` + `node --watch`. `nest generate` still works (`pnpm --filter server resource`). Revisit when TS 7.1 restores the API.
- Prisma pinned to 7.x: the npm `latest` tag is currently 8.0.0-rc.
- `nestjs-zod@5.5` does not declare Nest 12 in its peer range yet; it works (covered by the e2e tests).
