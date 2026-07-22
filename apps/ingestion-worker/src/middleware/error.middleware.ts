import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "#/shared/types/app-env";

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  // TODO: use logger
  console.log(error);

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  return c.json(
    {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    500,
  );
};
