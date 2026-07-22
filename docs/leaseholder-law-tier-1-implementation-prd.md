# Leaseholder Law Tier 1 Knowledge Base
## Implementation PRD

**Status:** Draft  
**Scope:** Primary UK legislation from legislation.gov.uk  
**Primary jurisdiction:** England and Wales  
**Platform:** Cloudflare Workers, R2, D1, Queues, Vectorize, Workers AI  
**Consumer:** Leaseholder help and advice chat agent

## 1. Purpose

Build a trustworthy, version-aware legal knowledge base from primary UK legislation.

The system must acquire authoritative XML, preserve original source documents, parse legislation into stable structural units, generate retrieval chunks, create embeddings, support hybrid retrieval, and return answers with accurate statutory citations.

Tier 1 covers legislation only. GOV.UK guidance, LEASE guidance, tribunal decisions, case law, and user leases are later tiers.

## 2. Principles

1. **Authority first:** legislation.gov.uk XML is the source of truth.
2. **Preserve before transforming:** store raw XML unchanged in R2.
3. **Structure-aware retrieval:** chunk by sections, subsections, paragraphs, schedules, and definitions.
4. **Version awareness:** do not assume text is current, commenced, or applicable everywhere.
5. **Citation fidelity:** every chunk must resolve to a human-readable statutory citation.
6. **Deterministic before generative:** parsing, IDs, hierarchy, and citations should not depend on an LLM.
7. **Rebuildable:** all derived data must be reproducible from R2 source XML.

## 3. Initial corpus

Start with a curated list:

- Leasehold Reform Act 1967
- Landlord and Tenant Act 1985
- Landlord and Tenant Act 1987
- Leasehold Reform, Housing and Urban Development Act 1993
- Housing Act 1996
- Commonhold and Leasehold Reform Act 2002
- Leasehold Reform (Ground Rent) Act 2022
- Building Safety Act 2022
- Leasehold and Freehold Reform Act 2024

Add statutory instruments, commencement orders, regulations, and amending Acts after the core pipeline is stable.

Represent the corpus as typed configuration:

```ts
export const legislationCorpus = [
  {
    id: "ukpga-1985-70",
    type: "ukpga",
    year: 1985,
    number: 70,
    title: "Landlord and Tenant Act 1985",
    jurisdiction: ["england", "wales"],
    topics: ["service-charges", "repairs", "section-20"],
  },
] as const;
```

## 4. Target user outcomes

The knowledge base should support questions such as:

- What makes a service charge reasonable?
- What consultation is required before major works?
- What is an administration charge?
- Which provisions govern the right to manage?
- Does the Building Safety Act protect qualifying leaseholders?
- What did a section say on a particular date?
- Is a provision in force?
- Which provisions apply in England but not Wales?

A grounded answer should contain:

1. a plain-English explanation;
2. the relevant statutory provision;
3. an explicit citation;
4. a warning where dates, commencement, or jurisdiction matter;
5. a link to the source.

## 5. Scope

### In scope

- curated legislation acquisition;
- XML download and validation;
- immutable R2 source storage;
- source hashing and change detection;
- D1 document catalogue;
- XML parsing;
- hierarchy reconstruction;
- provision normalization;
- structure-aware chunking;
- lexical search;
- embedding generation;
- Vectorize indexing;
- hybrid retrieval and reranking;
- citation generation;
- evaluation;
- observability and reprocessing.

### Out of scope

- case-law interpretation;
- tribunal decisions;
- user lease interpretation;
- government or LEASE guidance;
- authoritative commencement analysis;
- automated legal conclusions from incomplete facts;
- replacing professional legal advice.

## 6. Architecture

```text
legislation.gov.uk
        |
        v
Ingestion Worker
        |
        +---- raw XML ------------> R2
        +---- source metadata ----> D1
        |
        v
Parse Queue
        |
        v
Parser Worker
        |
        +---- documents ----------> D1
        +---- provisions ---------> D1
        +---- relationships ------> D1
        +---- chunks -------------> D1
        |
        v
Embedding Queue
        |
        v
Embedding Worker
        |
        +---- vectors ------------> Vectorize
        +---- status -------------> D1
        |
        v
Retrieval Worker
        |
        +---- lexical candidates
        +---- semantic candidates
        +---- metadata filters
        +---- reranking
        |
        v
Chat Agent
```

Recommended service responsibilities:

- **R2:** original XML and immutable source versions;
- **D1:** documents, provisions, chunks, relationships, versions, jobs;
- **Queues:** ingestion-to-parse and parse-to-embed boundaries;
- **Vectorize:** semantic retrieval;
- **Workers AI:** embeddings and optionally reranking or answer generation;
- **Cron Triggers:** scheduled source checks;
- **Workflows:** optional later for resumable corpus reprocessing.

## 7. Data model

### `documents`

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  legislation_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  jurisdiction_json TEXT NOT NULL,
  source_etag TEXT,
  source_last_modified TEXT,
  source_sha256 TEXT NOT NULL,
  source_retrieved_at TEXT NOT NULL,
  source_version_date TEXT,
  parser_version TEXT,
  parse_status TEXT NOT NULL,
  embedding_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### `provisions`

```sql
CREATE TABLE provisions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  parent_id TEXT,
  provision_type TEXT NOT NULL,
  citation TEXT NOT NULL,
  number TEXT,
  heading TEXT,
  text_plain TEXT NOT NULL,
  text_xml TEXT,
  path TEXT NOT NULL,
  depth INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  extent_json TEXT,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  source_anchor TEXT,
  content_sha256 TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (parent_id) REFERENCES provisions(id)
);
```

Provision types include part, chapter, cross-heading, section, subsection, paragraph, subparagraph, schedule, schedule-paragraph, definition, table, and note.

### `chunks`

```sql
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  provision_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  citation TEXT NOT NULL,
  heading_path TEXT NOT NULL,
  text TEXT NOT NULL,
  token_count INTEGER,
  topics_json TEXT,
  jurisdiction_json TEXT,
  start_date TEXT,
  end_date TEXT,
  content_sha256 TEXT NOT NULL,
  embedding_model TEXT,
  embedding_version TEXT,
  vector_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (provision_id) REFERENCES provisions(id)
);
```

### `relationships`

```sql
CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  source_provision_id TEXT NOT NULL,
  target_reference TEXT NOT NULL,
  target_provision_id TEXT,
  relationship_type TEXT NOT NULL,
  source_text TEXT,
  FOREIGN KEY (source_provision_id) REFERENCES provisions(id)
);
```

Potential relationship types:

- refers-to;
- defines;
- amended-by;
- modifies;
- applies-to;
- disapplies;
- commenced-by;
- repealed-by.

### `ingestion_runs`

```sql
CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL,
  documents_checked INTEGER NOT NULL DEFAULT 0,
  documents_changed INTEGER NOT NULL DEFAULT 0,
  documents_failed INTEGER NOT NULL DEFAULT 0,
  error_json TEXT
);
```

## 8. Stable identifiers

Document:

```text
ukpga-1985-70
```

Provision:

```text
ukpga-1985-70/section/19/subsection/1
```

Chunk:

```text
sha256(document-id + provision-id + chunk-index + chunk-content-hash)
```

Stable identifiers enable idempotent reprocessing, vector replacement, source tracing, diffing, and repeatable evaluation.

## 9. Ingestion

For each configured title:

1. construct the `data.xml` URL;
2. send conditional headers when available;
3. validate the response;
4. buffer the response when required for R2 upload;
5. calculate SHA-256;
6. compare with the latest stored hash;
7. store changed XML;
8. update the D1 catalogue;
9. enqueue parsing.

Recommended R2 keys:

```text
sources/current/ukpga/1985/70/data.xml
sources/versions/ukpga/1985/70/{sha256}.xml
```

If the hash is unchanged, update the last-checked timestamp but do not parse or embed again.

Failures should use bounded retries and must not block other documents.

## 10. XML parsing

The parser must extract:

- document metadata;
- legal hierarchy;
- provision numbers and headings;
- body text;
- schedules;
- definitions;
- extent or jurisdiction markers;
- temporal markers;
- source anchors;
- cross-references;
- useful annotations.

Use a Workers-compatible parser with namespace and mixed-content support.

Suggested internal representation:

```ts
type ProvisionNode = {
  id: string;
  type: ProvisionType;
  number?: string;
  heading?: string;
  text: string;
  sourceAnchor?: string;
  attributes: Record<string, string>;
  children: ProvisionNode[];
};
```

Mixed XML content must preserve reading order. Deterministic relationships should be extracted where possible.

Store a parser version, for example:

```text
legislation-parser@0.1.0
```

A parser change must allow the corpus to be rebuilt from R2 without redownloading.

## 11. Chunking

### Default

Use one section or schedule paragraph per chunk when reasonably sized.

Each chunk should include:

- Act title;
- heading path;
- full citation;
- provision heading;
- statutory text;
- required parent context.

Example:

```text
Landlord and Tenant Act 1985
Part II — Service charges
Section 19 — Limitation of service charges: reasonableness

(1) Relevant costs shall be taken into account...
```

### Small provisions

Group related subsections when the legal context is shared and the result remains readable.

### Large provisions

Split by subsection or paragraph. Repeat the Act, heading path, and parent citation in every split chunk.

Never split mid-sentence or mid-list-item.

### Definitions

Create both:

1. the normal source-section chunk;
2. individually retrievable definition chunks.

### Initial size target

- preferred: 250–700 tokens;
- soft maximum: 1,000 tokens;
- hard maximum: embedding-model limit.

Do not pad short provisions.

## 12. Metadata and topics

Deterministic metadata:

- Act title;
- year and chapter;
- citation;
- provision type;
- heading path;
- jurisdiction or extent;
- encoded dates and status;
- source URL and anchor;
- content hash;
- cross-references.

Initial controlled topic taxonomy:

- service-charges;
- major-works;
- section-20;
- administration-charges;
- ground-rent;
- right-to-manage;
- enfranchisement;
- lease-extension;
- right-of-first-refusal;
- repairs;
- insurance;
- building-safety;
- remediation;
- qualifying-lease;
- forfeiture;
- tribunal;
- consultation;
- information-rights.

Assign topics initially through corpus configuration, headings, exact terms, and reviewed rules. LLM classification can be added later but must remain auditable.

## 13. Embeddings

Embed a retrieval-oriented representation rather than raw XML:

```text
Act: Landlord and Tenant Act 1985
Citation: section 19(1)
Heading path: Part II > Service charges > Limitation of service charges: reasonableness
Topics: service charges, reasonableness

Text:
Relevant costs shall be taken into account...
```

Associate each vector with:

- chunk ID;
- document ID;
- provision ID;
- citation;
- topics;
- jurisdiction;
- date bounds;
- content hash;
- embedding model;
- embedding version.

Re-embed only when the content, model, template, or embedding version changes.

Queue jobs should be idempotent:

```ts
type EmbedChunkJob = {
  chunkId: string;
  contentHash: string;
  embeddingVersion: string;
};
```

Discard stale jobs whose hash no longer matches the current chunk.

## 14. Retrieval

Use hybrid retrieval:

- exact citation matching;
- lexical or full-text search;
- vector search;
- metadata filters;
- reranking.

Embeddings must not be the only retrieval mechanism.

Query understanding should detect:

- Act names and aliases;
- section references;
- legal phrases;
- topic;
- jurisdiction;
- relevant date;
- current versus historical intent.

Initial candidate strategy:

- 10 lexical candidates;
- 10 semantic candidates;
- merge and deduplicate;
- rerank the top 10;
- provide 3–6 chunks to the answer model.

Reranking should favour:

- exact citation matches;
- exact statutory phrases;
- matching topic;
- matching jurisdiction;
- applicable date;
- primary provisions over incidental references;
- semantic relevance.

Context assembly should group provisions by Act and section, remove duplicates, preserve legal order, and include citations before text.

## 15. Answer requirements

Every answer based on Tier 1 data should:

- distinguish statutory wording from explanation;
- provide primary-law citations;
- link to source provisions;
- avoid saying a provision is in force unless verified;
- identify relevant jurisdiction and date;
- state when legislation alone is insufficient;
- avoid presenting summaries as direct quotations;
- include an appropriate legal-information disclaimer.

Suggested answer shape:

```text
Summary

What the Act says

How it may apply

Important limitations

Sources
```

## 16. Retrieval API

```http
POST /retrieve
Content-Type: application/json
```

```json
{
  "query": "What makes a service charge reasonable?",
  "jurisdiction": "england",
  "asOfDate": "2026-07-21",
  "limit": 6
}
```

```json
{
  "results": [
    {
      "chunkId": "...",
      "citation": "Landlord and Tenant Act 1985, section 19(1)",
      "text": "...",
      "score": 0.91,
      "sourceUrl": "...",
      "applicability": {
        "jurisdiction": ["england", "wales"],
        "status": "unverified"
      }
    }
  ]
}
```

## 17. Evaluation

Create a human-reviewed evaluation set before the chat layer.

Include:

- exact citations;
- paraphrased legal questions;
- ambiguous terminology;
- similar provisions across Acts;
- definition queries;
- schedules;
- jurisdiction-sensitive queries;
- date-sensitive queries;
- questions not answerable from Tier 1.

Metrics:

- recall@5;
- recall@10;
- mean reciprocal rank;
- correct Act;
- correct section;
- citation accuracy;
- jurisdiction filter accuracy;
- temporal warning accuracy;
- unsupported-answer rate.

Initial release gates:

- 95% exact-section retrieval for citation queries;
- 85% recall@5 for reviewed natural-language questions;
- 100% valid source links;
- zero fabricated citations;
- zero unsupported legal claims presented as sourced law.

## 18. Observability and security

Log:

- ingestion runs;
- source changes;
- source hashes;
- parser counts;
- chunk counts;
- embedding jobs;
- vector writes and deletes;
- retrieval latency;
- candidate counts;
- cited chunk IDs.

Do not log full user legal narratives by default.

Operational requirements:

- protect internal endpoints;
- use secrets;
- isolate development and production resources;
- cap XML sizes;
- reject malformed XML safely;
- disable external entity processing;
- use request timeouts;
- limit upstream concurrency;
- use idempotency keys;
- retain source and parser audit history.

## 19. Delivery phases

### Phase 0 — Foundation

Deliver:

- Worker or monorepo setup;
- pnpm;
- strict TypeScript;
- Wrangler-generated types;
- Biome;
- Lefthook;
- Vitest;
- local R2 and D1;
- CI checks;
- separate development and production bindings.

Exit when local development, deployment, R2, D1, and CI all work.

### Phase 1 — Ingestion

Deliver:

- corpus configuration;
- conditional downloads;
- hashing;
- immutable R2 versions;
- current-source key;
- D1 catalogue;
- ingestion run tracking;
- manual and scheduled sync;
- retries and logs.

Exit when all curated Acts are stored, unchanged sources are skipped, changed sources create versions, and failures are retryable.

### Phase 2 — Parser

Deliver:

- XML parser selection;
- namespace support;
- mixed-content handling;
- internal AST;
- hierarchy reconstruction;
- stable provision IDs;
- citations;
- provision persistence;
- parser fixtures and versioning.

Exit when representative Acts parse deterministically with correct sections, subsections, schedules, and citations.

### Phase 3 — Chunking

Deliver:

- structure-aware chunker;
- large-provision splitting;
- heading context;
- definition chunks;
- token estimation;
- content hashes;
- chunk review export.

Exit when every chunk has a citation, maps to a source provision, and reads coherently in isolation.

### Phase 4 — Lexical retrieval

Deliver:

- exact citation parser;
- Act aliases;
- full-text search;
- topic and jurisdiction filters;
- retrieval API;
- evaluation fixtures.

Exit when statutory citations and key leasehold terms reliably retrieve the correct provisions.

### Phase 5 — Embeddings and hybrid retrieval

Deliver:

- embedding queue;
- Workers AI embeddings;
- Vectorize;
- vector metadata;
- stale-vector replacement;
- lexical/vector merge;
- reranking;
- embedding versioning.

Exit when natural-language recall meets the evaluation target without weakening exact citation search.

### Phase 6 — Agent grounding

Deliver:

- context assembler;
- answer prompt;
- citations and source links;
- applicability warnings;
- uncertainty behaviour;
- response trace metadata;
- disclaimer.

Exit when every statutory claim maps to retrieved text and fabricated citations are prevented.

### Phase 7 — Temporal awareness

Deliver:

- version-aware model;
- provision status;
- as-of-date retrieval;
- amendment annotations;
- commencement warnings;
- historical source selection where available.

Exit when the system can distinguish verified applicability from uncertainty and can reproduce stored historical versions.

### Phase 8 — Production hardening

Deliver:

- rate limits;
- caching;
- alerts and dashboards;
- dead-letter handling;
- reprocessing commands;
- backup/export;
- cost monitoring;
- deployment and rollback runbooks;
- privacy and legal-content review.

Exit when the corpus is recoverable, failures are operationally manageable, and performance is observable.

## 20. Codex work packages

1. **Project foundation:** pnpm, Wrangler, strict TypeScript, generated types, Biome, Lefthook, Vitest, R2, and D1.
2. **Corpus configuration:** typed list of Acts, canonical IDs, URLs, jurisdictions, and topics.
3. **D1 schema:** migrations and typed access for documents, provisions, chunks, relationships, and runs.
4. **Source downloader:** conditional requests, validation, buffering, hashing, upload, and errors.
5. **Immutable versioning:** content-addressed R2 source versions and current-source records.
6. **Parse dispatch:** queue parsing only when a source hash changes.
7. **XML parser spike:** compare Workers-compatible parsers using real fixtures.
8. **Provision AST:** support sections, subsections, schedules, headings, and mixed content.
9. **Stable citations:** deterministic IDs and human-readable legal citations.
10. **Provision persistence:** idempotent replacement of derived records.
11. **Chunker:** structure-aware chunks and definition extraction.
12. **Chunk review tooling:** export or endpoint for human review.
13. **Exact citation search:** parse variants such as `s19 LTA 1985`.
14. **Lexical search:** rank citations, headings, and statutory text.
15. **Embedding pipeline:** queue, model integration, and Vectorize upserts.
16. **Hybrid retrieval:** merge, deduplicate, filter, and rerank candidates.
17. **Evaluation:** fixtures, expected matches, metrics, and CI command.
18. **Agent grounding:** context assembly, sources, applicability, and warnings.
19. **Temporal metadata:** extent, status, amendment, and date extraction.
20. **Operations:** scheduling, dead letters, alerts, reprocessing, and runbooks.

## 21. First vertical slice

Implement one Act first:

> Landlord and Tenant Act 1985

The slice should:

1. download and store its XML;
2. create a D1 document record;
3. parse sections 18–30;
4. create provision records;
5. generate chunks;
6. support exact and lexical retrieval;
7. embed the chunks;
8. answer five reviewed service-charge questions with citations.

Complete this before processing the full corpus.

## 22. First-release definition of done

The Tier 1 release is usable when:

- curated Acts are stored and versioned;
- parsing is deterministic;
- every chunk maps to a source provision;
- exact and natural-language retrieval work;
- every result includes a citation and source link;
- source, parser, chunk, and embedding versions are stored;
- temporal and jurisdictional uncertainty is surfaced;
- the corpus can be rebuilt entirely from R2;
- evaluation thresholds are met;
- the agent does not invent statutory claims or citations.

## 23. Recommended implementation decisions

- Keep source XML in R2 and searchable structures in D1.
- Use queues between ingestion, parsing, and embedding.
- Implement lexical retrieval before embeddings.
- Use hybrid retrieval in production.
- Start with a vertical slice of the Landlord and Tenant Act 1985.
- Store immutable source versions.
- Version every transformation.
- Treat commencement and historical applicability as a distinct later capability.
- Keep legal interpretation out of ingestion and parsing.
