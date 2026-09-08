# Phase 0 status and project alignment

**Assessment date:** 8 September 2026  
**Source of truth:** [Leaseholder Law Tier 1 implementation PRD](./leaseholder-law-tier-1-implementation-prd.md), especially section 19

## Executive summary

Phase 0 is **partially complete and should not yet be considered exited**.

The repository has a sound start to the intended foundation: it is a pnpm/Turbo monorepo, the Worker uses Hono, TypeScript is strict, Wrangler types include R2 and D1, a Drizzle schema and migration exist, and Biome, Lefthook, and Vitest are installed. Local Wrangler startup sees both storage bindings, the existing D1 migration applies locally, and the current type, lint, and unit-test checks pass.

The remaining gaps are operational rather than architectural:

- development and production Cloudflare resources are not separately configured;
- there is no Worker-level D1 smoke check or database helper, so the D1 binding has not been proved through the application;
- there is no general CI workflow for pull requests and pushes;
- the deployment workflow refers to scripts and directories that do not exist;
- a successful deployment and deployed R2/D1 smoke test have not been demonstrated.

There has also been some drift into Phase 1. The Worker already contains a partial corpus and R2 download flow, but it does not yet meet the Phase 1 design: most of the curated corpus is disabled, content is not hashed, source versions are not immutable, D1 is not updated, ingestion runs are not tracked, and scheduled ingestion is disabled. This work should be treated as an incomplete spike, not as evidence that Phase 1 has been delivered.

The immediate goal should be to close Phase 0 deliberately, reconcile the task documents with the repository, and only then continue the ingestion pipeline.

## What Phase 0 was intended to establish

The PRD defines Phase 0 as the minimum dependable platform on which ingestion can be built:

- a Worker or monorepo foundation;
- Hono routing;
- pnpm;
- strict TypeScript and Wrangler-generated types;
- Drizzle schema and reproducible D1 migrations;
- Biome, Lefthook, and Vitest;
- working local R2 and D1;
- CI checks;
- separate development and production bindings;
- a working deployment.

The important boundary is that Phase 0 proves the development, storage, migration, quality, CI, and deployment paths. Corpus acquisition, hashing, version storage, catalogue updates, ingestion tracking, schedules, and retries belong to Phase 1.

## Current position against the Phase 0 deliverables

| Deliverable | Status | Evidence and gap |
| --- | --- | --- |
| Monorepo foundation | Implemented | `apps/ingestion-worker` and `packages/shared` are pnpm workspaces orchestrated by Turbo. |
| Hono routing | Implemented, with task drift | The active routes are `GET /health`, `GET /api/v1/legislation/`, `POST /api/v1/legislation/sync`, and `POST /api/v1/legislation/sync/:id`. The completed Task 01 still describes the older `/`, `/legislation`, and `/sync` contract and says a scheduled handler is preserved; neither is true now. This is a documentation/decision mismatch rather than a failure to use Hono. |
| pnpm | Implemented | The lockfile and workspace configuration are present. The README's package-targeted example uses `@leasehold/ingestion-worker`, while the actual package is `@apps/ingestion-worker`. |
| Turbo and Just | Partial against the task notes | Turbo is configured. The completed Tasks 01b and 01c require and document a root `justfile`, but none exists. Just is not a PRD Phase 0 requirement, so the team should either restore it or explicitly remove it from those task commitments. |
| Strict TypeScript | Implemented | The shared base config enables strict checking and both workspace TypeScript projects currently typecheck. |
| Wrangler-generated types | Implemented | `CloudflareBindings` contains `LEGISLATION_BUCKET`, `LEGISLATION_DB`, and `SYNC_TOKEN`. |
| Drizzle schema and migrations | Partially implemented | A schema, Drizzle configuration, and generated SQL migration exist, and Wrangler reports the local migration as applied. The schema already models Phase 1 catalogue concepts rather than the small Phase 0 smoke table suggested by Task 05; that is acceptable only if it is reconciled with the PRD before Phase 1 proceeds. |
| D1 through Worker code | Missing | There is no Drizzle client/database helper, no application query using `LEGISLATION_DB`, and no D1 health or smoke route/test. The binding and migration work, but the complete application path is unproved. |
| Biome | Implemented | The current repository passes `biome check`. |
| Lefthook | Implemented | Pre-commit Biome and pre-push quality hooks are configured. |
| Vitest | Implemented but shallow | The single health-route test passes. There is no binding, authentication, R2, D1, migration, or route-composition coverage. Phase 0 does not need a large suite, but it does need a meaningful storage smoke check. |
| Local R2 and D1 | Partially proved | Wrangler starts locally and exposes both bindings. D1 migrations apply locally. The health route returns `200` and the legislation route returns `401` without a token. No Worker route currently proves an R2 operation or a D1 query. |
| Separate development and production bindings | Missing | `wrangler.jsonc` has one R2 bucket and one D1 database, with no Wrangler `env` sections. Local emulation is isolated from remote storage, but there are no separately named/configured remote development and production resources as required by Task 04 and the PRD. |
| CI checks | Missing | There is no pull-request/push quality workflow. Turbo declares a `ci` task, but the root package has no `ci` script. The deployment workflow is not a substitute for CI. |
| Deployment | Not proved; workflow is broken | The tag-triggered deployment workflow calls a nonexistent package script (`check`) and deploys from nonexistent `apps/api`. Correcting its D1 database name alone does not make the workflow runnable. No deployed binding smoke test or rollback guidance is recorded. |

## Where the project has drifted

### Phase 1 work started before Phase 0 was closed

The legislation module goes beyond foundation work. It has typed corpus entries, conditional HTTP requests, XML response checks, batched downloads, R2 writes, and per-item sync routes. These are useful Phase 1 experiments, but the implemented shape differs materially from the PRD:

- only four of the nine initial Acts are active; the other five are commented out;
- objects are written only to `legislation/{type}/{year}/{number}/data.xml`, rather than immutable version keys plus a current key;
- source bytes are not SHA-256 hashed or compared by content;
- the D1 `documents` table is never written or read by the Worker;
- there is no `ingestion_runs` tracking;
- there is no parse queue boundary;
- scheduled sync is commented out and the Hono export has no scheduled handler;
- failures are returned in a result payload but are not retried;
- the configured source `User-Agent` still contains an example contact URL.

This means the repository is not “between Phase 1 and Phase 2.” It is still in Phase 0, with an early Phase 1 spike present.

### Completed task records no longer fully describe the code

The `docs/tasks/completed` location currently implies more certainty than the repository supports:

- Task 01's old route contract and scheduled-handler acceptance criterion no longer match the Worker;
- Tasks 01b and 01c say Just was delivered, but there is no `justfile`;
- Task 03 says `pnpm run ci` exists, but the root `ci` script is absent.

These do not all need to be restored exactly as written. They do need an explicit decision: either make the code satisfy the recorded task, or amend the task to record the accepted replacement.

### README and automation have fallen out of sync

The README is enough to start the current spike, but not enough to reproduce the Phase 0 platform:

- it documents an R2 bucket name different from `wrangler.jsonc`;
- it does not document D1 creation or local migration application;
- it does not describe development versus production resources;
- one package filter is incorrect;
- it has no deployed health/binding checks or rollback note.

The deployment workflow has similar naming/path drift and currently cannot be the evidence for a successful Phase 0 deployment.

## Recommended route back on track

1. **Freeze the Phase 1 surface temporarily.** Keep the current ingestion code as a spike, but do not expand parsing, queues, or the corpus until Phase 0 exits.
2. **Resolve the foundation contract.** Decide whether to restore the old root routes, scheduled handler, and Just commands or update the completed task records to endorse the current API and tool choices.
3. **Complete Task 04.** Add explicit development and production R2/D1 configuration with stable binding names, regenerate types, and document resource creation.
4. **Complete Task 05.** Add a typed Drizzle initializer and a small protected binding-smoke route or integration test that performs a harmless D1 query and R2 operation. Keep it independent of external services.
5. **Complete Task 06.** Add a normal CI workflow for pull requests and pushes, add a root `ci` command, and run install, migration consistency, typecheck, lint, and tests without Cloudflare credentials.
6. **Complete Task 07.** Repair the deployment workflow paths/scripts, make the production environment explicit, apply migrations, deploy, run health/auth/R2/D1 smoke checks, and document rollback.
7. **Reconcile documentation and task state.** Only move Tasks 04–07 to `completed` after their acceptance criteria have evidence. Correct or annotate Tasks 01/01b/01c/03 where their recorded outcomes changed.
8. **Resume Phase 1 from the PRD.** Rework the spike around the complete typed corpus, SHA-256 change detection, immutable/current R2 keys, D1 catalogue and run tracking, retries, logs, and manual/scheduled triggers.

## Phase 0 exit checklist

Phase 0 can be declared complete when all of the following are reproducible from a clean checkout:

- [ ] install with the frozen pnpm lockfile;
- [x] strict typecheck passes;
- [x] Biome passes;
- [x] Vitest passes;
- [x] Wrangler starts the Hono Worker with local R2 and D1 bindings;
- [x] the committed Drizzle migration applies to local D1;
- [ ] Worker code successfully queries D1 through Drizzle;
- [ ] a safe Worker smoke path proves R2 access;
- [ ] development and production bindings are separately configured;
- [ ] CI runs the same checks on pull requests and pushes without remote credentials;
- [ ] deployment uses the intended production resources and succeeds;
- [ ] deployed health, authorization, R2, and D1 smoke checks pass;
- [ ] the README matches the commands, package names, resource names, and API routes actually in use.

Until the unchecked items are complete, the honest project status is: **Phase 0 in progress, with partial Phase 1 ingestion code already present.**
