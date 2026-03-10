import { afterAll, describe, expect, it, vi } from "vitest";

import { createApp } from "./app.js";

describe("api app", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("returns health status", async () => {
    const app = await createApp({
      healthPayload: () => ({ ok: true })
    });

    await app.ready();
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await app.close();
  });

  it("rejects invalid signatures", async () => {
    const app = await createApp({
      processKapsoWebhook: vi.fn(async () => ({
        statusCode: 401,
        body: { error: "invalid_signature" }
      }))
    });

    await app.ready();
    const response = await app.inject({
      method: "POST",
      url: "/webhooks/kapso",
      payload: { id: "evt-1" }
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it("accepts a valid webhook and dispatches the normalized message", async () => {
    const processKapsoWebhook = vi.fn(async () => ({
      statusCode: 200,
      body: {
        duplicate: false,
        replied: true
      }
    }));

    const app = await createApp({
      processKapsoWebhook
    });

    await app.ready();
    const response = await app.inject({
      method: "POST",
      url: "/webhooks/kapso",
      payload: { id: "evt-1" }
    });

    expect(response.statusCode).toBe(200);
    expect(processKapsoWebhook).toHaveBeenCalledWith({
      body: { id: "evt-1" },
      headers: expect.any(Object)
    });

    await app.close();
  });
});
