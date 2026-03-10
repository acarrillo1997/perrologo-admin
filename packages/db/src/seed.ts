import "dotenv/config";

import { curatedKnowledgeBase } from "@perrologo/domain";

import { getDb } from "./client.js";
import { createRepositories } from "./repositories.js";

async function main() {
  const db = getDb();
  const repositories = createRepositories(db);

  await repositories.knowledge.upsertMany(
    curatedKnowledgeBase.map((article) => ({
      slug: article.slug,
      title: article.title,
      body: article.body,
      category: article.category,
      tags: article.tags,
      language: "es"
    }))
  );

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  for (const email of adminEmails) {
    await repositories.admins.upsert(email);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
