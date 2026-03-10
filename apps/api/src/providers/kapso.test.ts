import crypto from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { KapsoMessagingProvider } from "./kapso.js";

describe("KapsoMessagingProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const provider = new KapsoMessagingProvider({
    apiKey: "kapso-key",
    phoneNumberId: "123",
    apiBaseUrl: "https://api.kapso.ai",
    webhookSecret: "secret"
  });

  it("verifies the documented X-Webhook-Signature header", () => {
    const rawBody = JSON.stringify({ event: "whatsapp.message.received" });
    const signature = crypto
      .createHmac("sha256", "secret")
      .update(rawBody)
      .digest("hex");

    expect(
      provider.verifyWebhook({
        rawBody,
        headers: {
          "X-Webhook-Signature": signature
        }
      })
    ).toBe(true);
  });

  it("parses Kapso v2 payloads that carry the phone number on the conversation", () => {
    expect(
      provider.parseInboundMessage({
        event: "whatsapp.message.received",
        message: {
          id: "wamid.123",
          timestamp: "1730092800",
          text: {
            body: "Mi perro no quiere comer"
          }
        },
        conversation: {
          phone_number: "+573001112233"
        }
      })
    ).toEqual({
      eventId: "wamid.123",
      eventType: "whatsapp.message.received",
      messageId: "wamid.123",
      phoneNumber: "+573001112233",
      raw: {
        event: "whatsapp.message.received",
        message: {
          id: "wamid.123",
          timestamp: "1730092800",
          text: {
            body: "Mi perro no quiere comer"
          }
        },
        conversation: {
          phone_number: "+573001112233"
        }
      },
      text: "Mi perro no quiere comer",
      timestamp: "1730092800"
    });
  });

  it("parses raw Meta-style webhook payloads", () => {
    expect(
      provider.parseInboundMessage({
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "wamid.456",
                      from: "573009998877",
                      timestamp: "1730092801",
                      text: {
                        body: "Hola"
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      })
    ).toEqual({
      eventId: "wamid.456",
      eventType: "message.received",
      messageId: "wamid.456",
      phoneNumber: "573009998877",
      raw: {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: "wamid.456",
                      from: "573009998877",
                      timestamp: "1730092801",
                      text: {
                        body: "Hola"
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      text: "Hola",
      timestamp: "1730092801"
    });
  });

  it("sends replies with the documented API key header and messages path", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        messages: [{ id: "wamid.reply" }]
      })
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      provider.sendTextReply({
        to: "573009998877",
        body: "Hola"
      })
    ).resolves.toEqual({
      externalMessageId: "wamid.reply"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.kapso.ai/meta/whatsapp/v24.0/123/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-API-Key": "kapso-key"
        })
      })
    );
  });
});
