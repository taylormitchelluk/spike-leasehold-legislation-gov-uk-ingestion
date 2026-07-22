

# spike-leasehold-legislation-gov-uk-ingestion

download data from legislation.gov.uk and save to r2

## Layout

```text
apps/
  ingestion-worker/    Cloudflare Worker and Hono routes
packages/
  shared/              Shared workspace package placeholder
docs/
  tasks/               Implementation task notes
```

This repository is a pnpm workspace orchestrated with Turbo.

## Dev

Install dependencies

```
pnpm install
```

Add a token to `apps/ingestion-worker/.dev.vars`

```
SYNC_TOKEN=local-development-token
```

Generate cloudflare types

```
pnpm types
```


run dev

```
pnpm dev
```


```
curl \
  --request POST \
  --header "Authorization: Bearer local-development-token" \
  http://localhost:8787/api/v1/legislation/sync
```

go to http://localhost:8787/cdn-cgi/explorer to see ingested data

Useful package-targeted commands:

```
pnpm turbo run typecheck
pnpm --filter @leasehold/ingestion-worker dev
```

## Quality

```
pnpm typecheck
pnpm lint
pnpm test
pnpm ready
```

`lint` runs Biome, `test` runs Vitest through Turbo, and `format` applies Biome formatting. `ready` runs all three.

## Deploy

Create the r2 bucket

```
pnpm wrangler r2 bucket list

pnpm wrangler r2 bucket create spike-leasehold-legislation

# don't let wrangler add to wrangler.json (it's already there)
```


Add a sync token

```
# maybe generate a token...
openssl rand -hex 32

pnpm wrangler secret put SYNC_TOKEN

# helpfully...
export SYNC_TOKEN="...the generated token"

```

Deploy

```
pnpm deploy
```

Test

```
curl \
  --request POST \
  --header "Authorization: Bearer $SYNC_TOKEN" \
  "https://spike-leasehold-legislation-gov-uk-ingestion.<subdomain>.workers.dev/api/v1/legislation/sync"
```
