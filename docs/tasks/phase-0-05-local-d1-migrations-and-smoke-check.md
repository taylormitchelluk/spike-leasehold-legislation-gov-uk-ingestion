# Phase 0 Task 05: Drizzle D1 Migrations and Smoke Check

## Goal

Add the minimal Drizzle-managed local D1 migration and smoke-check path needed to prove D1 works before Phase 1.

## Context

Phase 0 exits when local development, Hono routing, R2, D1, Drizzle-managed migrations, and CI work. The full PRD schema arrives in later tasks, but Phase 0 still needs an operational local D1 database and a repeatable migration command.

## Scope

- Add Drizzle and Drizzle Kit.
- Add a Drizzle configuration file for D1 migrations.
- Add a schema directory if one does not exist.
- Define a minimal foundation table in Drizzle, such as `schema_metadata` or `health_checks`.
- Generate the initial SQL migration through Drizzle Kit.
- Add scripts or README commands for generating and applying local D1 migrations.
- Add a tiny typed database helper that initializes Drizzle from the Worker D1 binding.
- Add a small D1 smoke check:
  - endpoint, test, or documented command;
  - proves the Hono Worker can query the local D1 binding through Drizzle.
- Ensure the smoke check does not depend on remote Cloudflare resources.

## Out of Scope

- Implementing the complete `documents`, `provisions`, `chunks`, `relationships`, or `ingestion_runs` schema.
- Adding production seed data.
- Building a data access layer for later phases.

## Acceptance Criteria

- Local D1 migrations are generated from Drizzle schema.
- Local D1 migrations can be applied with a documented command.
- A developer can verify local D1 from `pnpm dev` through a Hono route or equivalent smoke check.
- Worker code queries D1 through Drizzle for the smoke check.
- The D1 smoke check is covered by either an automated test or clear manual verification.
- CI does not require remote D1 credentials.

## Verification

Run the documented Drizzle migration generation command, for example:

```sh
pnpm drizzle-kit generate
```

Then run the documented D1 migration command, for example:

```sh
pnpm wrangler d1 migrations apply <database-binding-or-name> --local
```

Then start the Worker:

```sh
pnpm dev
```

Confirm the D1 smoke check succeeds.

## Dependencies

- Phase 0 Task 04: R2, D1, and Environment Bindings.
