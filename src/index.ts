interface Env {
  LEGISLATION_BUCKET: R2Bucket;
  SYNC_TOKEN?: string;
}

type LegislationItem = {
  type: "ukpga" | "uksi";
  year: number;
  number: number;
  title: string;
  topics: string[];
  jurisdiction: "england-wales" | "uk";
};

type SyncStatus = "downloaded" | "unchanged" | "failed";

type SyncResult = {
  id: string;
  title: string;
  sourceUrl: string;
  objectKey: string;
  status: SyncStatus;
  statusCode?: number;
  bytes?: number;
  error?: string;
};

type StoredDocumentMetadata = {
  id: string;
  title: string;
  sourceUrl: string;
  legislationType: string;
  year: string;
  number: string;
  topics: string;
  jurisdiction: string;
  downloadedAt: string;
  sourceEtag?: string;
  sourceLastModified?: string;
};

/**
 * This is deliberately a curated list rather than a search for the word
 * "leasehold". Keyword searches would retrieve many incidental references
 * while potentially missing important amending or procedural legislation.
 */
const LEASEHOLD_LEGISLATION: readonly LegislationItem[] = [
  // {
  //   type: "ukpga",
  //   year: 1967,
  //   number: 88,
  //   title: "Leasehold Reform Act 1967",
  //   topics: ["houses", "enfranchisement", "lease-extension"],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1985,
  //   number: 70,
  //   title: "Landlord and Tenant Act 1985",
  //   topics: [
  //     "service-charges",
  //     "section-20",
  //     "repairs",
  //     "information-rights",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1987,
  //   number: 31,
  //   title: "Landlord and Tenant Act 1987",
  //   topics: [
  //     "right-of-first-refusal",
  //     "management",
  //     "landlord-information",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1993,
  //   number: 28,
  //   title: "Leasehold Reform, Housing and Urban Development Act 1993",
  //   topics: [
  //     "collective-enfranchisement",
  //     "lease-extension",
  //     "valuation",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  // {
  //   type: "ukpga",
  //   year: 1996,
  //   number: 52,
  //   title: "Housing Act 1996",
  //   topics: [
  //     "service-charges",
  //     "leasehold-valuation-tribunal",
  //     "administration",
  //   ],
  //   jurisdiction: "england-wales",
  // },
  {
    type: "ukpga",
    year: 2002,
    number: 15,
    title: "Commonhold and Leasehold Reform Act 2002",
    topics: [
      "right-to-manage",
      "administration-charges",
      "service-charges",
      "commonhold",
    ],
    jurisdiction: "england-wales",
  },
  {
    type: "ukpga",
    year: 2022,
    number: 1,
    title: "Leasehold Reform (Ground Rent) Act 2022",
    topics: ["ground-rent", "regulated-leases"],
    jurisdiction: "england-wales",
  },
  {
    type: "ukpga",
    year: 2022,
    number: 30,
    title: "Building Safety Act 2022",
    topics: [
      "building-safety",
      "remediation",
      "service-charges",
      "qualifying-leases",
    ],
    jurisdiction: "uk",
  },
  {
    type: "ukpga",
    year: 2024,
    number: 22,
    title: "Leasehold and Freehold Reform Act 2024",
    topics: [
      "leasehold-reform",
      "enfranchisement",
      "service-charges",
      "estate-management",
    ],
    jurisdiction: "england-wales",
  },
];

const LEGISLATION_ORIGIN = "https://www.legislation.gov.uk";

const createId = (item: LegislationItem): string =>
  `${item.type}-${item.year}-${item.number}`;

const createSourceUrl = (item: LegislationItem): string =>
  `${LEGISLATION_ORIGIN}/${item.type}/${item.year}/${item.number}/data.xml`;

const createObjectKey = (item: LegislationItem): string =>
  [
    "legislation",
    item.type,
    item.year.toString(),
    item.number.toString(),
    "data.xml",
  ].join("/");

const isXmlResponse = (response: Response): boolean => {
  const contentType = response.headers.get("content-type")?.toLowerCase();

  return (
    contentType?.includes("application/xml") === true ||
    contentType?.includes("text/xml") === true
  );
};

const parseContentLength = (response: Response): number | undefined => {
  const value = response.headers.get("content-length");

  if (value === null) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const getConditionalHeaders = (
  existing: R2Object | null,
): Record<string, string> => {
  if (existing === null) {
    return {};
  }

  const etag = existing.customMetadata?.sourceEtag;
  const lastModified = existing.customMetadata?.sourceLastModified;

  return {
    ...(etag === undefined ? {} : { "If-None-Match": etag }),
    ...(lastModified === undefined
      ? {}
      : { "If-Modified-Since": lastModified }),
  };
};

const createStoredMetadata = (
  item: LegislationItem,
  sourceUrl: string,
  response: Response,
  downloadedAt: string,
): StoredDocumentMetadata => {
  const sourceEtag = response.headers.get("etag") ?? undefined;
  const sourceLastModified =
    response.headers.get("last-modified") ?? undefined;

  return {
    id: createId(item),
    title: item.title,
    sourceUrl,
    legislationType: item.type,
    year: item.year.toString(),
    number: item.number.toString(),
    topics: item.topics.join(","),
    jurisdiction: item.jurisdiction,
    downloadedAt,
    ...(sourceEtag === undefined ? {} : { sourceEtag }),
    ...(sourceLastModified === undefined ? {} : { sourceLastModified }),
  };
};

const syncLegislationItem = async (
  env: Env,
  item: LegislationItem,
): Promise<SyncResult> => {
  const id = createId(item);
  const sourceUrl = createSourceUrl(item);
  const objectKey = createObjectKey(item);

  try {
    const existing = await env.LEGISLATION_BUCKET.head(objectKey);

    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "application/xml",
        "User-Agent":
          "leasehold-law-rag/0.1 (+https://example.com/legal-data-contact)",
        ...getConditionalHeaders(existing),
      },
      redirect: "follow",
    });

    if (response.status === 304) {
      return {
        id,
        title: item.title,
        sourceUrl,
        objectKey,
        status: "unchanged",
        statusCode: response.status,
      };
    }

    if (!response.ok) {
      const errorBody = await response.text();

      return {
        id,
        title: item.title,
        sourceUrl,
        objectKey,
        status: "failed",
        statusCode: response.status,
        error: errorBody.slice(0, 500),
      };
    }

    if (!isXmlResponse(response)) {
      const contentType =
        response.headers.get("content-type") ?? "unknown";

      return {
        id,
        title: item.title,
        sourceUrl,
        objectKey,
        status: "failed",
        statusCode: response.status,
        error: `Expected XML but received ${contentType}`,
      };
    }

    if (response.body === null) {
      return {
        id,
        title: item.title,
        sourceUrl,
        objectKey,
        status: "failed",
        statusCode: response.status,
        error: "The source response did not contain a body",
      };
    }

    const downloadedAt = new Date().toISOString();
    const metadata = createStoredMetadata(
      item,
      sourceUrl,
      response,
      downloadedAt,
    );

    // const all = Object.fromEntries(response.headers.entries());
    // console.log(all);

    const contentType =
      response.headers.get("content-type") ??
      "application/xml; charset=utf-8";

    // legislation.gov.uk doesn't provide a content-length!
    const xml = await response.arrayBuffer();

    await env.LEGISLATION_BUCKET.put(objectKey, xml, {
      httpMetadata: {
        contentType,
      },
      customMetadata: metadata,
    });

    return {
      id,
      title: item.title,
      sourceUrl,
      objectKey,
      status: "downloaded",
      statusCode: response.status,
      bytes: parseContentLength(response),
    };
  } catch (error) {
    return {
      id,
      title: item.title,
      sourceUrl,
      objectKey,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Runs promises in small batches so that the source is not hit with every
 * request simultaneously.
 */
const mapInBatches = async <Input, Output>(
  inputs: readonly Input[],
  batchSize: number,
  callback: (input: Input) => Promise<Output>,
): Promise<Output[]> => {
  const results: Output[] = [];

  for (let index = 0; index < inputs.length; index += batchSize) {
    const batch = inputs.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map(callback));

    results.push(...batchResults);
  }

  return results;
};

const syncAllLegislation = async (env: Env): Promise<SyncResult[]> =>
  mapInBatches(
    LEASEHOLD_LEGISLATION,
    2,
    (item) => syncLegislationItem(env, item),
  );

const jsonResponse = (
  value: unknown,
  init: ResponseInit = {},
): Response =>
  Response.json(value, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });

const isAuthorised = (request: Request, env: Env): boolean => {
  if (env.SYNC_TOKEN === undefined) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${env.SYNC_TOKEN}`;
};

const handleSyncRequest = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  if (!isAuthorised(request, env)) {
    return jsonResponse(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  const startedAt = new Date().toISOString();
  const results = await syncAllLegislation(env);
  const finishedAt = new Date().toISOString();

  const counts = results.reduce(
    (accumulator, result) => ({
      ...accumulator,
      [result.status]: accumulator[result.status] + 1,
    }),
    {
      downloaded: 0,
      unchanged: 0,
      failed: 0,
    } satisfies Record<SyncStatus, number>,
  );

  return jsonResponse({
    startedAt,
    finishedAt,
    counts,
    results,
  });
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/sync") {
      return handleSyncRequest(request, env);
    }

    if (request.method === "GET" && url.pathname === "/legislation") {
      return jsonResponse({
        count: LEASEHOLD_LEGISLATION.length,
        legislation: LEASEHOLD_LEGISLATION.map((item) => ({
          id: createId(item),
          title: item.title,
          sourceUrl: createSourceUrl(item),
          objectKey: createObjectKey(item),
          topics: item.topics,
          jurisdiction: item.jurisdiction,
        })),
      });
    }

    return jsonResponse(
      {
        service: "leasehold-legislation-ingestion",
        endpoints: {
          list: "GET /legislation",
          sync: "POST /sync",
        },
      },
      { status: 200 },
    );
  },

  async scheduled(_controller, env, context): Promise<void> {
    context.waitUntil(
      syncAllLegislation(env).then((results) => {
        console.log(
          JSON.stringify({
            event: "legislation-sync-completed",
            results,
          }),
        );
      }),
    );
  },
} satisfies ExportedHandler<Env>;
