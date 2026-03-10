export const runtime = "nodejs";

export default async function handler(request: Request) {
  try {
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

    const { processKapsoWebhook } = await import("../../src/http-handlers.js");
    const result = await processKapsoWebhook({
      body,
      rawBody,
      headers: request.headers
    });

    return Response.json(result.body, {
      status: result.statusCode
    });
  } catch (error) {
    console.error("kapso_webhook_error", error);

    return Response.json(
      {
        error: "internal_error",
        message: error instanceof Error ? error.message : "unknown_error"
      },
      {
        status: 500
      }
    );
  }
}
