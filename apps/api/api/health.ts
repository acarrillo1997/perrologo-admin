import { healthPayload } from "../src/http-handlers.js";

export const runtime = "nodejs";

export default async function handler() {
  return Response.json(healthPayload());
}
