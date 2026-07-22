# Phase 0 Task 07: Deployment Smoke Test

## Goal

Prove the Worker can be deployed with the Phase 0 bindings and smoke-tested safely.

## Context

Phase 0 exits when local development, deployment, Hono routing, R2, D1, Drizzle-managed migrations, and CI all work. This task verifies the deployed Worker configuration without implementing Phase 1 ingestion completeness.

## Scope

- Confirm the deploy command runs typecheck before deployment.
- Document development and production deployment commands.
- Document required Cloudflare resources and secrets:
  - R2 bucket;
  - D1 database;
  - `SYNC_TOKEN` or equivalent internal endpoint secret.
- Add or document a deployed smoke test for:
  - root endpoint;
  - `/legislation`;
  - Hono route dispatch;
  - R2 binding availability;
  - D1 binding availability through Drizzle.
- Keep internal mutation endpoints protected.

## Out of Scope

- Automatic production deployment from CI.
- Full corpus ingestion.
- Scheduled sync validation.

## Acceptance Criteria

- `pnpm deploy` is the documented deployment command.
- Deployment uses the production bindings.
- A deployed root request returns a successful JSON response.
- A deployed binding smoke check proves R2 and D1 are available.
- The deployed D1 smoke check uses the same Drizzle schema path as local development.
- Protected endpoints return `401` without the required token.
- README has a concise deployment and rollback note.

## Verification

Run:

```sh
pnpm deploy
```

Then smoke test the deployed URL:

```sh
curl https://<worker-url>/
curl https://<worker-url>/legislation
curl --request POST https://<worker-url>/sync
curl --request POST --header "Authorization: Bearer $SYNC_TOKEN" https://<worker-url>/sync
```

The authorized `/sync` call only needs to prove the deployed endpoint and bindings work for Phase 0; corpus completeness is covered by Phase 1.

## Dependencies

- Phase 0 Task 04: R2, D1, and Environment Bindings.
- Phase 0 Task 05: Drizzle D1 Migrations and Smoke Check.
- Phase 0 Task 06: CI Checks.
