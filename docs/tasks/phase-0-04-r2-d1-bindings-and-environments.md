# Phase 0 Task 04: R2, D1, and Environment Bindings

## Goal

Configure separate development and production Cloudflare bindings for R2 and D1.

## Context

The PRD Phase 0 exit criteria require local R2 and D1, deployment, and separate development and production bindings. The current `wrangler.jsonc` includes a single `LEGISLATION_BUCKET` R2 binding and no D1 binding.

## Scope

- Add a D1 database binding for the foundation catalogue database.
- Ensure the D1 binding can be used by Drizzle in Worker code.
- Configure development and production environments in `wrangler.jsonc`.
- Ensure development and production R2 buckets are separate.
- Ensure development and production D1 databases are separate.
- Keep binding names stable for application code:
  - `LEGISLATION_BUCKET`;
  - a clear D1 binding name such as `LEGISLATION_DB`.
- Regenerate Wrangler types after binding changes.
- Update README with resource creation commands.

## Out of Scope

- Full PRD schema for documents, provisions, chunks, and relationships.
- Production data loading.
- Queue, Vectorize, or Workers AI bindings, unless required by the chosen foundation shape.

## Acceptance Criteria

- `wrangler.jsonc` has explicit development and production resource configuration.
- Local development can use local R2 and D1 through Wrangler.
- Production deployment is configured to use production resource names/IDs.
- Generated types include both R2 and D1 bindings.
- Drizzle can be initialized from the generated D1 binding without unsafe casts.
- Binding names do not need to change between environments in source code.

## Verification

Run:

```sh
pnpm types
pnpm typecheck
pnpm dev
```

Verify local bindings through Worker startup logs and a simple endpoint or smoke test.

For remote resources, verify commands are documented, for example:

```sh
pnpm wrangler r2 bucket create <development-bucket-name>
pnpm wrangler r2 bucket create <production-bucket-name>
pnpm wrangler d1 create <development-database-name>
pnpm wrangler d1 create <production-database-name>
```

## Dependencies

- Phase 0 Task 01: Update Existing Worker to Hono.
- Phase 0 Task 01b: Monorepo with Turbo and Just.
- Phase 0 Task 01c: Project Foundation Remainder.
- Phase 0 Task 02: Strict TypeScript and Wrangler Types.
