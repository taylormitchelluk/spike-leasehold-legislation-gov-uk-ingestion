# Phase 0 Task 02: Strict TypeScript and Wrangler Types

## Goal

Ensure the Hono-based Worker compiles under strict TypeScript using generated Cloudflare binding types.

## Context

The PRD requires strict TypeScript and Wrangler-generated types. The repository currently has `tsconfig.json`, `worker-configuration.d.ts`, and a `pnpm types` script.

## Scope

- Keep `strict: true` enabled in `tsconfig.json`.
- Ensure TypeScript includes all Worker source files and generated Wrangler types.
- Generate Wrangler types with the configured environment interface.
- Use the generated bindings type consistently in Worker code.
- Type the Hono environment so route handlers can access Cloudflare bindings safely.
- Remove hand-written binding declarations where generated types can safely replace them.
- Ensure the typecheck command fails on type errors.
- Document when developers should regenerate types.

## Out of Scope

- Adding application data models for later phases.
- Introducing runtime validation libraries unless required for type safety in existing Phase 0 code.

## Acceptance Criteria

- `pnpm types` regenerates `worker-configuration.d.ts`.
- `pnpm typecheck` runs Wrangler type generation and `tsc --noEmit`.
- Worker code uses the generated Cloudflare environment type or a narrow extension of it.
- Hono route handlers and middleware have typed bindings.
- No implicit `any` or loosened compiler options are introduced.
- README includes the type generation command.

## Verification

Run:

```sh
pnpm types
pnpm typecheck
```

Confirm generated types include all configured bindings:

- `LEGISLATION_BUCKET`;
- local and production D1 bindings once added;
- any environment-specific binding names introduced in Phase 0.

## Dependencies

- Phase 0 Task 01: Update Existing Worker to Hono.
- Phase 0 Task 01b: Monorepo with Turbo and Just.
- Phase 0 Task 01c: Project Foundation Remainder.
