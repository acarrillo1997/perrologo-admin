import type { RetrievedArticle } from "../types.js";

function scoreArticle(article: RetrievedArticle, normalizedMessage: string) {
  let score = 0;

  for (const tag of article.tags) {
    if (normalizedMessage.includes(tag.toLowerCase())) {
      score += 4;
    }
  }

  for (const token of article.title.toLowerCase().split(/\s+/)) {
    if (token.length > 3 && normalizedMessage.includes(token)) {
      score += 2;
    }
  }

  for (const token of article.body.toLowerCase().split(/\s+/)) {
    if (token.length > 4 && normalizedMessage.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export function retrieveRelevantArticles(
  message: string,
  articles: RetrievedArticle[],
  limit = 3
) {
  const normalizedMessage = message.toLowerCase();

  return [...articles]
    .map((article) => ({
      article,
      score: scoreArticle(article, normalizedMessage)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.article);
}
