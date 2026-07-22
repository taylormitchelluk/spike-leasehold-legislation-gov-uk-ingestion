import type { HonoRequest } from "hono";
import type { LegislationItem, StoredDocumentMetadata } from "./legislation.types";
import { LEGISLATION_ORIGIN } from "./legislation.types";

export const createId = (item: LegislationItem): string =>
  `${item.type}-${item.year}-${item.number}`;

export const createSourceUrl = (item: LegislationItem): string =>
  `${LEGISLATION_ORIGIN}/${item.type}/${item.year}/${item.number}/data.xml`;

export const createObjectKey = (item: LegislationItem): string =>
  [
    "legislation",
    item.type,
    item.year.toString(),
    item.number.toString(),
    "data.xml",
  ].join("/");

// TODO: Move shared/http or shared/lib
export const isXmlResponse = (response: Response): boolean => {
  const contentType = response.headers.get("content-type")?.toLowerCase();

  return (
    contentType?.includes("application/xml") === true ||
    contentType?.includes("text/xml") === true
  );
};

// TODO: Move shared/http or shared/lib
export const parseContentLength = (response: Response): number | undefined => {
  const value = response.headers.get("content-length");

  if (value === null) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export const getConditionalHeaders = (
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

export const createStoredMetadata = (
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

/**
 * Runs promises in small batches so that the source is not hit with every
 * request simultaneously.
 */
// TODO: move
export const mapInBatches = async <Input, Output>(
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
