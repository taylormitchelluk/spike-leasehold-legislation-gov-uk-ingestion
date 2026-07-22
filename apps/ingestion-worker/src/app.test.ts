import { describe, expect, it } from "vitest";

import { app } from "./app";

describe("app", () => {
  it("returns a healthy response with a request id", async () => {
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      requestId: expect.any(String),
    });
  });
});
