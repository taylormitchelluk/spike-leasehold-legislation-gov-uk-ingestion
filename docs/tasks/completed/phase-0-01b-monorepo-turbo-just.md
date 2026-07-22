# Phase 0 Task 01b: Monorepo with Turbo and Just

## Goal

Reshape the project into a pnpm monorepo orchestrated by Turbo

## Context

The PRD Phase 0 allows Worker or monorepo setup. The chosen direction is a monorepo so later ingestion, parsing, shared schema, retrieval, and evaluation code can grow without overloading a single package.

Use Turbo for package task orchestration.

## Scope

- Introduce a minimal monorepo layout.
- Keep the current Worker as the first application package.
- Add Turbo configuration for shared scripts.
- Keep pnpm as the package manager and lockfile source of truth.
- Update paths in Wrangler, TypeScript, and package scripts after moving files.
- Update README with the new command style.

## Suggested Layout

```text
apps/
  ingestion-worker/
    src/
    wrangler.jsonc
    package.json
packages/
  shared/
    src/
docs/
  tasks/
package.json
pnpm-workspace.yaml
turbo.json
justfile
```

The `packages/shared` package can stay minimal or empty if there is no immediate shared code, but the workspace should be ready for it.

## Steps

1. Add `turbo` as a root development dependency.
2. Create or update `turbo.json` with tasks for:
   - `dev`;
   - `typecheck`;
   - `test`;
   - `lint`;
   - `format`;
   - `ci`;
   - `deploy`.
3. Update `pnpm-workspace.yaml` to include `apps/*` and `packages/*`.
4. Move the existing Worker files into `apps/ingestion-worker/`:
   - `src/`;
   - `wrangler.jsonc`;
   - `tsconfig.json` or a package-specific extension;
   - `worker-configuration.d.ts`;
   - package scripts needed by the Worker.
5. Create `apps/ingestion-worker/package.json` with package-local scripts.
6. Keep a root `package.json` for workspace-level scripts that delegate to Turbo.
7. Add a shared root TypeScript base config if it reduces duplication, for example `tsconfig.base.json`.
8. Update import paths, Wrangler config paths, and generated-type paths after the move.
9. Add a root `justfile` with recipes such as:
   - `install`;
   - `dev`;
   - `typecheck`;
   - `test`;
   - `lint`;
   - `format`;
   - `ci`;
   - `deploy`;
   - `types`;
   - `d1-migrate-local` once D1 exists.
10. Confirm existing Hono routes still work from the new app path.

## Out of Scope

- Adding new application packages beyond the ingestion Worker unless required by the move.
- Implementing parser, chunker, retrieval, or embedding packages.
- Reworking database schema or migrations beyond preserving paths for later Drizzle work.

## Acceptance Criteria

- The repository uses `apps/*` and `packages/*` workspaces.
- The existing Worker lives under `apps/ingestion-worker/`.
- `turbo.json` defines the Phase 0 task pipeline.
- Root package scripts delegate to Turbo.
- Existing Hono routes still respond locally.
- README documents the monorepo layout and Just commands.

## Verification

Run:

```sh
pnpm install --frozen-lockfile
just typecheck
just dev
```

Manually confirm the Worker responds locally:

```sh
curl http://localhost:8787/
curl http://localhost:8787/legislation
curl --request POST http://localhost:8787/sync
```

Also verify Turbo can run the package task directly:

```sh
pnpm turbo run typecheck
```

## Dependencies

- Phase 0 Task 01: Update Existing Worker to Hono.
