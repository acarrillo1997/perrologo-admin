import { processKapsoWebhook } from "../../src/http-handlers.js";

export const runtime = "nodejs";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return Response.json(
      {
        error: "method_not_allowed"
      },
      {
        status: 405
      }
    );
  }

  const rawBody = await request.text();
  let body: Record<string, unknown>;

  try {
    body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return Response.json(
      {
        error: "invalid_json"
      },
      {
        status: 400
      }
    );
  }

  const result = await processKapsoWebhook({
    body,
    rawBody,
    headers: request.headers
  });

  return Response.json(result.body, {
    status: result.statusCode
  });
}
