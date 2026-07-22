# Phase 0 Task 01: Update Existing Worker to Hono

## Goal

Move the existing Worker endpoints to Hono while preserving current spike behaviour.

## Context

The PRD Phase 0 requires Hono-based routing. This repository already has a starter Worker in `src/index.ts` with `GET /`, `GET /legislation`, `POST /sync`, and a scheduled handler. This task converts the request routing layer to Hono without changing the ingestion behaviour.

This should be completed before the monorepo reshaping task so the route migration is easy to verify in the current layout.

## Scope

- Add Hono as the routing framework.
- Route existing endpoints through Hono:
  - `GET /`;
  - `GET /legislation`;
  - `POST /sync`.
- Add a small Hono middleware or helper for shared JSON response behaviour if useful.
- Keep existing `/legislation` and `/sync` spike endpoints working through Hono unless another Phase 0 task deliberately changes them.
- Keep the scheduled handler working.
- Preserve current authorization behaviour for `POST /sync`.
- Preserve current response shapes unless a small Hono-specific adjustment is required.

## Steps

1. Add `hono` as a runtime dependency.
2. Create a typed Hono app module, for example `src/app.ts`.
3. Define the Hono binding type so handlers can access `LEGISLATION_BUCKET` and `SYNC_TOKEN`.
4. Move the root response route into Hono.
5. Move `GET /legislation` into Hono.
6. Move `POST /sync` into Hono and keep bearer-token authorization intact.
7. Export the Hono app through the Worker `fetch` handler in `src/index.ts`.
8. Keep the scheduled handler in `src/index.ts` and reuse the same sync function used by the Hono route.
9. Run typecheck and local route smoke checks.

## Out of Scope

- Monorepo migration.
- Turbo or Just setup.
- Broad script cleanup beyond adding Hono.
- Corpus expansion.
- Parser, chunking, embeddings, retrieval, or answer generation.
- Production data migration beyond empty local D1 setup.

## Acceptance Criteria

- `pnpm install --frozen-lockfile` succeeds from a clean checkout.
- Hono is installed and used by the Worker entrypoint.
- Existing routes are served through Hono.
- The scheduled handler still calls the sync flow.
- `pnpm dev` starts the Worker locally.
- `pnpm typecheck` runs strict TypeScript checks.

## Verification

Run:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm dev
```

Manually confirm the Worker responds locally:

```sh
curl http://localhost:8787/
curl http://localhost:8787/legislation
curl --request POST http://localhost:8787/sync
```

## Dependencies

None.
