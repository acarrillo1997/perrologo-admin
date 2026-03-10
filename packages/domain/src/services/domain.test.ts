import { describe, expect, it } from "vitest";

import { curatedKnowledgeBase } from "../knowledge/base.js";
import { nextOnboardingField, onboardingWelcome } from "./onboarding.js";
import { retrieveRelevantArticles } from "./retrieval.js";
import { assessSafety } from "./safety.js";

describe("domain services", () => {
  it("detects urgent health signals", () => {
    const result = assessSafety("Mi perro no respira bien y esta muy decaido");

    expect(result.isUrgent).toBe(true);
    expect(result.severity).toBe("high");
    expect(result.matchedSignals.length).toBeGreaterThan(0);
  });

  it("retrieves relevant articles for feeding questions", () => {
    const articles = retrieveRelevantArticles(
      "Mi perro puede comer mango?",
      curatedKnowledgeBase
    );

    expect(articles[0]?.slug).toBe("feeding-mango");
  });

  it("advances onboarding until completion", () => {
    expect(onboardingWelcome()).toContain("Perrologo");
    expect(nextOnboardingField("dog_name")).toBe("breed");
    expect(nextOnboardingField("neutered")).toBeNull();
  });
});
