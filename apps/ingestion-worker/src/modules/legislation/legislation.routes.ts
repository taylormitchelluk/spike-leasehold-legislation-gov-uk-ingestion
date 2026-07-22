import { Hono } from "hono";
import { bearerAuthMiddleware } from "#/middleware/auth.middleware";
import type { AppEnv } from "#/shared/types/app-env";
import { list, sync, syncById } from "./legislation.handler";

export const legislationRoutes = new Hono<AppEnv>();

legislationRoutes.use("*", bearerAuthMiddleware);
legislationRoutes.use("/sync/*", async (c, next) => {
  c.header("Cache-Control", "no-store");

  await next();
});

legislationRoutes.get("/", list);
legislationRoutes.post("/sync", sync);
legislationRoutes.post("/sync/:id", syncById);
