import { createRepositories, getDb } from "@perrologo/db";

import { getEnv } from "./env.js";
import { KapsoMessagingProvider } from "./providers/kapso.js";
import { AnswerService } from "./services/answer-service.js";
import { PerrologoService } from "./services/perrologo-service.js";

let cachedRuntime: ReturnType<typeof buildRuntime> | null = null;

function buildRuntime() {
  const env = getEnv();
  const repositories = createRepositories(getDb());
  const messagingProvider = new KapsoMessagingProvider({
    apiKey: env.KAPSO_API_KEY,
    phoneNumberId: env.KAPSO_PHONE_NUMBER_ID,
    apiBaseUrl: env.KAPSO_API_BASE_URL,
    webhookSecret: env.KAPSO_WEBHOOK_SECRET
  });
  const perrologoService = new PerrologoService(
    repositories,
    messagingProvider,
    new AnswerService({
      apiKey: env.AI_GATEWAY_API_KEY,
      model: env.AI_MODEL
    })
  );

  return {
    env,
    repositories,
    messagingProvider,
    perrologoService
  };
}

export function getRuntime() {
  if (!cachedRuntime) {
    cachedRuntime = buildRuntime();
  }

  return cachedRuntime;
}
