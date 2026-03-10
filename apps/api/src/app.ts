import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import Fastify, { type FastifyInstance } from "fastify";

import { healthPayload, processKapsoWebhook } from "./http-handlers.js";

type AppDeps = {
  healthPayload?: typeof healthPayload;
  processKapsoWebhook?: typeof processKapsoWebhook;
};

export async function createApp(deps: AppDeps = {}) {
  const app = Fastify({
    logger: true
  });

  await app.register(cors);
  await app.register(formbody);

  const resolveHealthPayload = deps.healthPayload ?? healthPayload;
  const resolveKapsoWebhook = deps.processKapsoWebhook ?? processKapsoWebhook;

  app.get("/health", async () => resolveHealthPayload());

  app.post("/webhooks/kapso", async (request, reply) => {
    const result = await resolveKapsoWebhook({
      body: (request.body ?? {}) as Record<string, unknown>,
      headers: request.headers
    });

    return reply.status(result.statusCode).send(result.body);
  });

  return app;
}

export type PerrologoApp = FastifyInstance;
