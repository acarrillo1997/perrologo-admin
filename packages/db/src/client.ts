import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

let queryClient: postgres.Sql | null = null;

export function getQueryClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (!queryClient) {
    queryClient = postgres(process.env.DATABASE_URL, {
      max: 1
    });
  }

  return queryClient;
}

export function getDb() {
  return drizzle(getQueryClient(), { schema });
}

export type DbClient = ReturnType<typeof getDb>;
