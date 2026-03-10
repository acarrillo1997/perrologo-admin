import type { IncomingHttpHeaders } from "node:http";

import { getRuntime } from "./runtime.js";

type HeaderValue = string | string[] | undefined;

function normalizeHeaders(headers: Headers | IncomingHttpHeaders) {
  const normalized: Record<string, HeaderValue> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  for (const [key, value] of Object.entries(headers)) {
    normalized[key] = value;
  }

  return normalized;
}

export function healthPayload() {
  return {
    ok: true
  };
}

export async function processKapsoWebhook(input: {
  body: Record<string, unknown>;
  rawBody?: string;
  headers: Headers | IncomingHttpHeaders;
}) {
  const runtime = getRuntime();
  const rawBody = input.rawBody ?? JSON.stringify(input.body ?? {});
  const verified = runtime.messagingProvider.verifyWebhook({
    rawBody,
    headers: normalizeHeaders(input.headers)
  });

  if (!verified) {
    return {
      statusCode: 401,
      body: {
        error: "invalid_signature"
      }
    };
  }

  const inboundMessage = runtime.messagingProvider.parseInboundMessage(input.body);

  if (!inboundMessage) {
    return {
      statusCode: 202,
      body: {
        ignored: true
      }
    };
  }

  const result = await runtime.perrologoService.handleIncomingMessage(inboundMessage);

  return {
    statusCode: 200,
    body: result
  };
}
