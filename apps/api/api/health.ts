export const runtime = "nodejs";

export default async function handler() {
  try {
    const { healthPayload } = await import("../src/http-handlers.js");
    return Response.json(healthPayload());
  } catch (error) {
    console.error("health_handler_error", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "unknown_error"
      },
      {
        status: 500
      }
    );
  }
}
