import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("openai/gpt-4.1-mini"),
  KAPSO_API_KEY: z.string().min(1),
  KAPSO_PHONE_NUMBER_ID: z.string().min(1),
  KAPSO_WEBHOOK_SECRET: z.string().optional(),
  KAPSO_API_BASE_URL: z.string().url().default("https://api.kapso.ai"),
  PORT: z.coerce.number().default(3000)
});

export function getEnv() {
  return envSchema.parse(process.env);
}
