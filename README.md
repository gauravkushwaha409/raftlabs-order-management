# Raftlabs Food — Order Management

Turborepo monorepo (pnpm 12, Node 24+).

| Path | What |
| --- | --- |
| `apps/server` | NestJS 12 API (`/api/v1`, Swagger at `/api/v1/docs`), Prisma 7 + Postgres, Redis, Zod validation |
| `apps/app` | Customer app: React 19, Vite 8, TanStack Router/Query, Zustand, Tailwind 4 |
| `apps/admin` | Admin app (same stack minus Zustand) |
| `packages/ui` | shadcn-based design system + Tailwind theme (`@package/ui/global.css`) |

## Setup

```sh
pnpm install
cp env/.env.example env/.env.development   # adjust if needed
pnpm docker:development:up                 # full stack in Docker, or:
docker compose --env-file env/.env.development -f docker/docker-compose.development.yml up -d postgres redis
pnpm prisma:generate && pnpm dev           # run apps on the host
```

Ports: server `8000`, app `3000`, admin `3001`, Postgres `5434`, Redis `6379`.

## Commands

`pnpm dev | build | test | check-types | check` · `pnpm --filter server test:e2e` · `pnpm prisma:migrate | deploy | studio` · `pnpm docker:<development|production>:<build|up|start|down|logs>`

## Notes

- TypeScript 7 ships `tsc` only (no compiler API) so the Nest CLI cannot build/watch. Server builds with `tsc`, dev uses `tsc --watch` + `node --watch`. `nest generate` still works (`pnpm --filter server resource`). Revisit when TS 7.1 restores the API.
- Prisma pinned to 7.x: the npm `latest` tag is currently 8.0.0-rc.
- Vitest everywhere. Server tests use Nest's `Test` module; web tests use Testing Library + jsdom.
