import { createRepositories, getDb } from "@perrologo/db";

export function getRepositories() {
  return createRepositories(getDb());
}
