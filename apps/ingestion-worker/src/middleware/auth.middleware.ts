import { bearerAuth } from "hono/bearer-auth";
import type { AppEnv } from "#/shared/types/app-env";

export const bearerAuthMiddleware = bearerAuth<AppEnv>({
  verifyToken: (token, c) => token === c.env.SYNC_TOKEN,

  noAuthenticationHeader: {
    message: {
      code: "AUTH_HEADER_MISSING",
      message: "Bearer token is required",
    },
  },

  invalidAuthenticationHeader: {
    message: {
      code: "AUTH_HEADER_INVALID",
      message: "Authorization header must use the Bearer scheme",
    },
  },

  invalidToken: {
    message: {
      code: "TOKEN_INVALID",
      message: "Bearer token is invalid",
    },
  },
});
