import type { Handler } from "hono";
import type { AppEnv } from "#/shared/types/app-env";
import {
  createId,
  createObjectKey,
  createSourceUrl,
  createStoredMetadata,
  getConditionalHeaders,
  isXmlResponse,
  mapInBatches,
  parseContentLength,
} from "./legislation.lib";
import type {
  LegislationItem,
  SyncResult,
  SyncStatus,
} from "./legislation.types";
import { LEASEHOLD_LEGISLATION } from "./legislation.types";

// TODO: move to service
const syncLegislationItem = async (
  env: CloudflareBindings,
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
      const contentType = response.headers.get("content-type") ?? "unknown";

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
      response.headers.get("content-type") ?? "application/xml; charset=utf-8";

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

const syncAllLegislation = async (
  env: CloudflareBindings,
): Promise<SyncResult[]> =>
  mapInBatches(LEASEHOLD_LEGISLATION, 2, (item) =>
    syncLegislationItem(env, item),
  );

const countSyncResults = (
  results: readonly SyncResult[],
): Record<SyncStatus, number> => {
  const counts: Record<SyncStatus, number> = {
    downloaded: 0,
    unchanged: 0,
    failed: 0,
  };

  for (const result of results) {
    counts[result.status] += 1;
  }

  return counts;
};

export const list: Handler<AppEnv> = async (c) => {
  // TODO: fetch from db,I want last updated etc.
  return c.json({
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
};

export const sync: Handler<AppEnv> = async (c) => {
  const results = await syncAllLegislation(c.env);

  return c.json({
    counts: countSyncResults(results),
    results,
  });
};

export const syncById: Handler<AppEnv> = async (c) => {
  const item = LEASEHOLD_LEGISLATION.find((thing) => {
    return createId(thing) === c.req.param("id");
  });

  if (!item) {
    return c.json(
      {
        code: "NOT_FOUND",
        resource: c.req.path,
        message: `${c.req.param("id")} not found`,
      },
      404,
    );
  }

  const result = await syncLegislationItem(c.env, item);

  return c.json({
    counts: countSyncResults([result]),
    result,
  });
};
