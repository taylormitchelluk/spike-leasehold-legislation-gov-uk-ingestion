# Phase 0 Task 06: CI Checks

## Goal

Add CI that proves the Phase 0 foundation remains healthy on every change.

## Context

The PRD requires CI checks before exiting Phase 0. CI should validate the project without depending on remote Cloudflare credentials or mutable external services.

## Scope

- Add a GitHub Actions workflow or the repository's chosen CI equivalent.
- Use pnpm with lockfile enforcement.
- Run the Phase 0 quality gates:
  - install;
  - Drizzle migration generation or migration consistency check;
  - type generation if supported in CI;
  - typecheck;
  - lint;
  - tests.
- Cache dependencies if appropriate.
- Ensure CI does not deploy by default.
- Document required CI secrets only if any are needed.

## Out of Scope

- Production deployment automation.
- Scheduled ingestion jobs.
- Remote integration tests that require Cloudflare credentials.

## Acceptance Criteria

- CI configuration is committed under the conventional path, such as `.github/workflows/ci.yml`.
- CI uses `pnpm install --frozen-lockfile`.
- CI runs `pnpm ci` or equivalent individual commands.
- CI verifies committed Drizzle migrations are consistent with the schema.
- CI can pass without Cloudflare account secrets.
- README mentions the local command equivalent for CI.

## Verification

Run locally:

```sh
pnpm install --frozen-lockfile
pnpm ci
```

If GitHub Actions is used, confirm the workflow is valid YAML and runs on pull requests and pushes.

## Dependencies

- Phase 0 Task 03: Biome, Lefthook, and Vitest.
- Phase 0 Task 04: R2, D1, and Environment Bindings.
- Phase 0 Task 05: Drizzle D1 Migrations and Smoke Check.
