# Phase 0 Task 03: Biome, Lefthook, and Vitest

## Goal

Add the Phase 0 developer quality tools: Biome for formatting/linting, Lefthook for local git hooks, and Vitest for unit tests.

## Context

The PRD requires Biome, Lefthook, and Vitest before later ingestion and parsing work. The current `package.json` has TypeScript and Wrangler but does not yet include these tools.

## Scope

- Add Biome configuration.
- Add scripts for:
  - formatting;
  - linting;
  - check/fix workflows if useful.
- Add Lefthook configuration for pre-commit checks.
- Add Vitest configuration appropriate for TypeScript, Hono, and Workers-compatible code.
- Add at least one small unit test for current foundation behaviour, such as Hono route handling, authorization helper behaviour, ID generation, or response shape.
- Refactor existing Worker code only as much as needed to make focused testing possible.

## Out of Scope

- Full integration testing against real Cloudflare services.
- Parser or ingestion test fixtures for later phases.
- Large restructuring of application code.

## Acceptance Criteria

- `pnpm lint` runs Biome.
- `pnpm format` or `pnpm format:check` is available and documented.
- `pnpm test` runs Vitest.
- Lefthook is configured and installable with pnpm.
- `pnpm run ci` includes typecheck, lint, and tests.
- Existing Worker behaviour remains intact after moving routes behind Hono.

## Verification

Run:

```sh
pnpm lint
pnpm test
pnpm run ci
```

Optionally install hooks locally:

```sh
pnpm lefthook install
```

## Dependencies

- Phase 0 Task 01: Update Existing Worker to Hono.
- Phase 0 Task 01b: Monorepo with Turbo and Just.
- Phase 0 Task 01c: Project Foundation Remainder.
- Phase 0 Task 02: Strict TypeScript and Wrangler Types.
