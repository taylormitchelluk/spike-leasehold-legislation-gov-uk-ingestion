# Phase 0 Task 01c: Project Foundation Remainder

## Goal

Finish the remaining foundation cleanup after the Hono migration and monorepo reshaping are complete.

## Context

The PRD Phase 0 requires a clear, repeatable Cloudflare Workers foundation that can support later ingestion, parsing, embeddings, and retrieval workers. Hono routing is handled by Task 01, and the monorepo/Turbo/Just move is handled by Task 01b.

This task captures the remaining foundation work that does not belong specifically to routing or repository reshaping.

## Scope

- Confirm the final Phase 0 project layout is documented:
  - `apps/ingestion-worker/` for the current Worker;
  - `packages/` for future shared packages;
  - `docs/tasks/` for implementation tasks;
  - Drizzle schema, migration, and local resource files in conventional package locations.
- Ensure pnpm remains the documented package manager and lockfile source of truth.
- Add or update scripts that developers need for foundation work:
  - `dev`;
  - `typecheck`;
  - `test`;
  - `lint`;
  - `format`;
  - `ci`;
  - `deploy`.
- Ensure root `just` recipes and package scripts stay aligned.
- Update `README.md` with the minimum local setup path.
- Confirm the spike endpoints remain working after the foundation changes.

## Out of Scope

- Hono route migration.
- Monorepo migration with Turbo and Just.
- Corpus expansion.
- Parser, chunking, embeddings, retrieval, or answer generation.
- Production data migration beyond empty local D1 setup.

## Acceptance Criteria

- `pnpm install --frozen-lockfile` succeeds from a clean checkout.
- The project has a documented package/workspace shape.
- Root scripts and `justfile` recipes cover Phase 0 developer workflows.
- `just dev` starts the Worker locally.
- `just typecheck` runs strict TypeScript checks.
- `just ci` exists and runs the Phase 0 quality gates once later Phase 0 quality tasks are complete.
- README setup instructions match the actual commands.

## Verification

Run:

```sh
pnpm install --frozen-lockfile
just typecheck
just ci
just dev
```

Manually confirm the Worker responds locally:

```sh
curl http://localhost:8787/
curl http://localhost:8787/legislation
curl --request POST http://localhost:8787/sync
```

## Dependencies

- Phase 0 Task 01: Update Existing Worker to Hono.
- Phase 0 Task 01b: Monorepo with Turbo and Just.
