import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { timing } from 'hono/timing';

import { errorHandler } from "#/middleware/error.middleware";
import { requestIdMiddleware } from "#/middleware/request-id.middleware";
import { loggerMiddleware } from "#/middleware/logger.middleware";
import { legislationRoutes } from "#/modules/legislation/legislation.routes";

import type { AppEnv } from "./shared/types/app-env";

export const app = new Hono<AppEnv>();

app.use("*", timing())
app.use("*", secureHeaders());
app.use("*", loggerMiddleware);
app.use("*", requestIdMiddleware);


app.get("/health", (c) => {
  return c.json({
    status: "ok",
    requestId: c.get("requestId"),
  });
});

const api = new Hono<AppEnv>();

api.route("/legislation", legislationRoutes);
app.route("/api/v1", api);

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404,
  );
});

app.onError(errorHandler);
