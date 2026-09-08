# Phase 0 Task 04a: Reconcile Completed Foundation Tasks

## Goal

Bring the repository and the Phase 0 tasks already filed under `docs/tasks/completed/` back into agreement before completing the remaining Phase 0 infrastructure work.

## Context

The Phase 0 status review found that Tasks 01, 01b, 01c, 02, and 03 are recorded as completed, but some of their documented outcomes no longer match the repository.

The main mismatches are:

- Task 01 documents the original `/`, `/legislation`, and `/sync` routes, while the Worker now exposes `/health` and versioned `/api/v1/legislation` routes;
- Task 01 says the scheduled handler was preserved, but the active Worker export has no scheduled handler;
- Tasks 01b and 01c describe Just as delivered, but the repository has no `justfile`;
- Task 01b says root scripts delegate to Turbo, but some current root scripts run tools directly;
- Tasks 01c and 03 require a root `ci` command, but none exists;
- the README contains an incorrect ingestion-worker package name and does not fully match the active route and command structure.

Task 02 appears to match the current code: strict TypeScript is enabled, generated Wrangler types are used, and the generated bindings include R2, D1, and the sync token. It still needs to be included in final verification so that its completed status is evidence-backed.

This reconciliation must follow the Phase 0 scope in the PRD. In particular, scheduled ingestion is a Phase 1 deliverable and should not be reintroduced solely to satisfy a stale Phase 0 task statement.

## Resolution principles

1. [ ] Treat the PRD Phase 0 deliverables and exit criteria as the source of truth.
2. [ ] Prefer documenting an intentional replacement over restoring obsolete behavior that Phase 0 does not require.
3. [ ] Do not mark a checklist item complete until the repository, README, and relevant completed task say the same thing.
4. [ ] Preserve a short note in an amended completed task when an original acceptance criterion has been superseded, rather than silently rewriting project history.
5. [ ] Keep incomplete Tasks 04–07 and Phase 1 ingestion work outside this reconciliation task.

## Numbered implementation checklist

### 1. Reconcile Task 01: Hono routing

**Decision 1:** Retain the versioned API as the canonical route contract. Do not add compatibility aliases for the obsolete `/`, `/legislation`, and `/sync` routes. Standardize the legislation collection route without a trailing slash in documentation and tests.

**Decision 2:** Defer the scheduled handler and scheduled ingestion to Phase 1. Amend completed Task 01 to record that its scheduled-handler preservation criterion was superseded by the phased delivery boundary in the PRD.

**Decision 3:** Keep every `/api/v1/legislation` route protected by bearer authentication during development because these endpoints may expose incomplete or incorrect data. Keep only `GET /health` public.

**Decision 4:** Cover the canonical routes and authentication boundary with focused tests. Use the read-only legislation list for the authenticated success case, and verify that unauthenticated sync requests are rejected before any upstream request or storage write.

**Decision 5:** Keep manual Phase 0 route verification local and side-effect free. Verify health, authenticated and unauthenticated list access, and unauthenticated rejection by both sync routes. Do not call an authenticated sync as part of this foundation check because it contacts legislation.gov.uk and writes to R2; verify that behavior in Phase 1.

1. [x] Confirm the current versioned API as the canonical route contract, or explicitly decide that compatibility routes are still required.
2. [ ] Make the chosen route contract consistent across Worker code, tests, README examples, and Task 01.
3. [ ] If the current contract is retained, amend Task 01 to record these routes:
   1. [ ] `GET /health`;
   2. [ ] `GET /api/v1/legislation/`;
   3. [ ] `POST /api/v1/legislation/sync`;
   4. [ ] `POST /api/v1/legislation/sync/:id`.
4. [ ] Amend Task 01's scheduled-handler criterion to record that scheduled ingestion is deferred to Phase 1.
5. [ ] Document the intentional authentication boundary: `GET /health` is public and every `/api/v1/legislation` route is bearer-protected during development.
6. [ ] Add focused route tests for the agreed contract:
   1. [ ] `GET /health` returns `200` with a request ID;
   2. [ ] an unknown route returns the standard `404` response envelope;
   3. [ ] `GET /api/v1/legislation` returns `401` without a bearer token;
   4. [ ] `GET /api/v1/legislation` returns `401` with an invalid bearer token;
   5. [ ] `GET /api/v1/legislation` succeeds with the configured test token;
   6. [ ] both sync routes reject unauthenticated requests without contacting legislation.gov.uk or writing to storage.
7. [ ] Update Task 01's verification commands so that they exercise the actual routes without external requests or storage writes:
   1. [ ] start the Worker locally;
   2. [ ] verify `GET /health` returns `200`;
   3. [ ] verify `GET /api/v1/legislation` returns `401` without a token;
   4. [ ] verify `GET /api/v1/legislation` returns `200` with the local token;
   5. [ ] verify `POST /api/v1/legislation/sync` returns `401` without a token;
   6. [ ] verify `POST /api/v1/legislation/sync/:id` returns `401` without a token;
   7. [ ] do not invoke either sync route with valid authentication in this Phase 0 verification.

### 2. Reconcile Tasks 01b and 01c: Turbo and Just

1. [ ] Confirm Turbo-only orchestration as the current foundation decision, unless there is a concrete need to add Just.
2. [ ] If Turbo-only is confirmed, amend Task 01b to:
   1. [ ] remove Just from the title and delivered scope;
   2. [ ] replace `just` verification commands with their pnpm/Turbo equivalents;
   3. [ ] note that the proposed Just layer was not adopted and is not required by the PRD.
3. [ ] If Just is retained instead, add the missing root `justfile` with working recipes for every command claimed by Tasks 01b and 01c.
4. [ ] Amend Task 01c to use the selected command interface consistently.
5. [ ] Verify that the documented monorepo layout matches the actual `apps/ingestion-worker` and `packages/shared` workspaces.
6. [ ] Record whether root linting and formatting intentionally run Biome directly or should be delegated through Turbo.
7. [ ] Make Task 01b's root-script acceptance criterion match that decision.

### 3. Restore the missing root command contract

1. [ ] Add a root `ci` script that runs the repository's Phase 0 quality checks through the chosen orchestration path.
2. [ ] Ensure the root command set contains working commands for:
   1. [ ] `dev`;
   2. [ ] `types`;
   3. [ ] `typecheck`;
   4. [ ] `lint`;
   5. [ ] `format` or `format:check`;
   6. [ ] `test`;
   7. [ ] `ci`;
   8. [ ] `deploy`.
3. [ ] Decide whether `ready` remains an alias for the same checks as `ci`, or remove the duplication and document one canonical command.
4. [ ] Make formatting command names unambiguous:
   1. [ ] a check command must not modify files;
   2. [ ] a fix command must clearly state that it writes changes.
5. [ ] Confirm each Turbo task has a corresponding workspace script wherever Turbo expects one.
6. [ ] Update Tasks 01b, 01c, and 03 with the final command names.

### 4. Correct the README foundation instructions

1. [ ] Replace the incorrect `@leasehold/ingestion-worker` package filter with the actual package name, `@apps/ingestion-worker`.
2. [ ] Document the canonical local start command.
3. [ ] Document the canonical type generation, typecheck, lint, test, and CI commands.
4. [ ] Document the active health and legislation routes selected in checklist 1.
5. [ ] Ensure every curl example uses the current URL and authentication requirements.
6. [ ] Remove or replace references to Just according to the decision in checklist 2.
7. [ ] Check that the described workspace layout and package names match the repository.
8. [ ] Leave detailed R2/D1 environment provisioning, migration smoke checks, CI automation, and deployment guidance to Tasks 04–07; do not imply they are complete here.

### 5. Revalidate Task 02: strict TypeScript and Wrangler types

1. [ ] Run Wrangler type generation from the documented root command.
2. [ ] Confirm the generated `CloudflareBindings` interface contains:
   1. [ ] `LEGISLATION_BUCKET: R2Bucket`;
   2. [ ] `LEGISLATION_DB: D1Database`;
   3. [ ] `SYNC_TOKEN: string`.
3. [ ] Confirm Hono uses the generated bindings through `AppEnv` without duplicate hand-written binding declarations.
4. [ ] Run the strict typecheck for every workspace.
5. [ ] Confirm Task 02 and the README name the command that actually regenerates types.

### 6. Revalidate Task 03: Biome, Lefthook, and Vitest

1. [ ] Run the documented Biome check from the repository root.
2. [ ] Run all Vitest suites from the repository root.
3. [ ] Run the new route tests added in checklist 1.
4. [ ] Confirm Lefthook can be installed without changing the committed configuration unexpectedly.
5. [ ] Confirm the pre-commit hook runs Biome against applicable staged files.
6. [ ] Confirm the pre-push hook calls the selected canonical CI/quality command.
7. [ ] Amend Task 03 so its `pnpm run ci` acceptance criterion names a command that now exists.

### 7. Reconcile the completed task records

1. [ ] Review Task 01 line by line against the final route and scheduling decisions.
2. [ ] Review Task 01b line by line against the final Turbo/Just decision and root scripts.
3. [ ] Review Task 01c line by line against the actual layout, setup instructions, and commands.
4. [ ] Review Task 02 line by line against generated types and strict typechecking.
5. [ ] Review Task 03 line by line against Biome, Lefthook, Vitest, and the root CI command.
6. [ ] Add a dated reconciliation note to every completed task that required correction.
7. [ ] Do not move this Task 04a to `completed` until every remaining acceptance criterion in those five completed tasks is either satisfied or explicitly superseded with a reason.

### 8. Run the final foundation verification

1. [ ] From a clean dependency state, run `pnpm install --frozen-lockfile`.
2. [ ] Run the documented type generation command.
3. [ ] Run the documented strict typecheck command.
4. [ ] Run the documented lint command.
5. [ ] Run the documented test command.
6. [ ] Run the new root CI-equivalent command.
7. [ ] Start the Worker locally using the documented command.
8. [ ] Verify the agreed health route returns `200`.
9. [ ] Verify a protected legislation route returns `401` without a token.
10. [ ] Verify the same protected route succeeds with the configured local token.
11. [ ] Record the commands and results in the completion note for this task.
12. [ ] Confirm `git status` contains only the intended reconciliation changes.

## Out of scope

1. [ ] Do not add separate development and production R2/D1 bindings; that remains Task 04.
2. [ ] Do not add the Drizzle database helper or D1/R2 binding smoke route; that remains Task 05.
3. [ ] Do not create the GitHub Actions quality workflow; that remains Task 06.
4. [ ] Do not repair or execute production deployment; that remains Task 07.
5. [ ] Do not expand the legislation corpus or implement hashing, immutable R2 versions, D1 catalogue writes, ingestion runs, retries, queues, or schedules; those remain Phase 1.

The items above are constraints, not completion work, and should remain unchecked while this task is active.

## Acceptance criteria

1. [ ] The current Hono route contract is intentional, tested, and documented consistently.
2. [ ] The missing scheduled handler is either restored for a stated reason or explicitly recorded as deferred to Phase 1.
3. [ ] The repository and completed task documents agree on whether Just is part of the toolchain.
4. [ ] A working root `ci` command exists.
5. [ ] Root scripts, Turbo tasks, Lefthook, and README commands use a consistent quality-check contract.
6. [ ] The README uses the actual package name and active API routes.
7. [ ] Strict TypeScript and generated Wrangler binding types are reverified.
8. [ ] Biome, Lefthook, Vitest, and the added route tests are reverified.
9. [ ] Tasks 01, 01b, 01c, 02, and 03 accurately describe their final delivered state.
10. [ ] All final verification commands pass from the repository root.

## Dependencies

1. [x] Phase 0 Task 01: Update Existing Worker to Hono.
2. [x] Phase 0 Task 01b: Monorepo with Turbo and Just.
3. [x] Phase 0 Task 01c: Project Foundation Remainder.
4. [x] Phase 0 Task 02: Strict TypeScript and Wrangler Types.
5. [x] Phase 0 Task 03: Biome, Lefthook, and Vitest.

Complete this reconciliation before using Tasks 06 or 07 as evidence that the Phase 0 foundation is healthy.
