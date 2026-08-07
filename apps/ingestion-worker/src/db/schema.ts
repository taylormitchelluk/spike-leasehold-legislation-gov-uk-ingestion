import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import { createEntityId } from "#/shared/id";

export const documents = sqliteTable("documents", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createEntityId()),
  version: text().notNull(),
  title: text().notNull(),
  type: text().notNull(),
  year: text().notNull(),
  sourceUrl: text("source_url").notNull(),
  etag: text(),
  sha256: text().notNull(),

  status: text(),
  last_modified: text().notNull(),
  downloaded_at: text().notNull(),
});

export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const jurisdictions = sqliteTable("jurisdictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const documentTopics = sqliteTable(
  "document_topics",
  {
    document: text("document")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
      }),

    topic: integer("topic")
      .notNull()
      .references(() => topics.id, {
        onDelete: "restrict",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.document, table.topic],
    }),

    index("document_topics_topic_slug_idx").on(table.topic),
  ],
);

export const documentJurisdictions = sqliteTable(
  "document_jurisdictions",
  {
    document: text("document")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
      }),

    jurisdiction: integer("jurisdiction")
      .notNull()
      .references(() => jurisdictions.id, {
        onDelete: "restrict",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.document, table.jurisdiction],
    }),

    index("document_jurisdiction_topic_slug_idx").on(table.jurisdiction),
  ],
);
