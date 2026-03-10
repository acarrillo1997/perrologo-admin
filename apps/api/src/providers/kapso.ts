import crypto from "node:crypto";

import { z } from "zod";

import type { MessagingProvider, NormalizedInboundMessage } from "../types.js";

const candidateMessageSchema = z
  .object({
    id: z.string().optional(),
    from: z.string().optional(),
    timestamp: z.string().optional(),
    text: z
      .union([
        z.string(),
        z.object({
          body: z.string().optional()
        })
      ])
      .optional(),
    body: z.string().optional(),
    content: z
      .object({
        body: z.string().optional()
      })
      .optional()
  })
  .passthrough();

function extractText(message: z.infer<typeof candidateMessageSchema>) {
  if (typeof message.text === "string") {
    return message.text;
  }

  if (message.text?.body) {
    return message.text.body;
  }

  if (message.content?.body) {
    return message.content.body;
  }

  return message.body ?? "";
}

function extractHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
) {
  const direct = headers[name];

  if (direct) {
    return Array.isArray(direct) ? direct[0] : direct;
  }

  const key = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name.toLowerCase()
  );

  if (!key) {
    return undefined;
  }

  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSignature(signature: string) {
  return signature.startsWith("sha256=") ? signature.slice(7) : signature;
}

function buildMessagesUrl(apiBaseUrl: string, phoneNumberId: string) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");

  if (baseUrl.includes("/meta/whatsapp/v")) {
    return `${baseUrl}/${phoneNumberId}/messages`;
  }

  if (baseUrl.endsWith("/meta/whatsapp")) {
    return `${baseUrl}/v24.0/${phoneNumberId}/messages`;
  }

  return `${baseUrl}/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
}

export class KapsoMessagingProvider implements MessagingProvider {
  constructor(
    private readonly config: {
      apiKey: string;
      phoneNumberId: string;
      apiBaseUrl: string;
      webhookSecret?: string;
    }
  ) {}

  verifyWebhook(input: {
    rawBody: string;
    headers: Record<string, string | string[] | undefined>;
  }) {
    if (!this.config.webhookSecret) {
      return true;
    }

    const signature =
      extractHeader(input.headers, "x-webhook-signature") ??
      extractHeader(input.headers, "x-kapso-signature");

    if (!signature) {
      return false;
    }

    const digest = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(input.rawBody)
      .digest("hex");

    const expected = normalizeSignature(signature);

    if (digest.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(expected, "utf8")
    );
  }

  parseInboundMessage(payload: Record<string, unknown>): NormalizedInboundMessage | null {
    const rawPayload = payload as {
      id?: string;
      event?: string;
      type?: string;
      message?: unknown;
      data?: { message?: unknown };
      payload?: { message?: unknown };
      conversation?: {
        phone_number?: string;
      };
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: unknown[];
          };
        }>;
      }>;
    };

    const candidate =
      rawPayload.message ??
      rawPayload.data?.message ??
      rawPayload.payload?.message ??
      rawPayload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!candidate) {
      return null;
    }

    const message = candidateMessageSchema.safeParse(candidate);

    if (!message.success) {
      return null;
    }

    const text = extractText(message.data).trim();
    const from = message.data.from?.trim() ?? rawPayload.conversation?.phone_number?.trim();
    const messageId = message.data.id?.trim() ?? rawPayload.id?.trim();

    if (!text || !from || !messageId) {
      return null;
    }

    return {
      eventId: rawPayload.id?.trim() ?? messageId,
      eventType: rawPayload.event?.trim() ?? rawPayload.type?.trim() ?? "message.received",
      messageId,
      phoneNumber: from,
      text,
      timestamp: message.data.timestamp,
      raw: payload
    };
  }

  async sendTextReply(input: { to: string; body: string }) {
    const response = await fetch(
      buildMessagesUrl(this.config.apiBaseUrl, this.config.phoneNumberId),
      {
        method: "POST",
        headers: {
          "X-API-Key": this.config.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to,
          type: "text",
          text: {
            body: input.body
          }
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Kapso send failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as { messages?: Array<{ id?: string }> };

    return {
      externalMessageId: payload.messages?.[0]?.id
    };
  }
}
