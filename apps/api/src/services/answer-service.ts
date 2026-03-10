import { generateText } from "ai";

import {
  buildFallbackAnswer,
  buildGroundedPrompt,
  type AnswerContext
} from "@perrologo/domain";

export class AnswerService {
  constructor(
    private readonly config: {
      apiKey?: string;
      model: string;
    }
  ) {}

  async answer(message: string, context: AnswerContext) {
    if (!this.config.apiKey && !process.env.VERCEL_OIDC_TOKEN) {
      return buildFallbackAnswer(message, context);
    }

    const response = await generateText({
      model: this.config.model,
      prompt: buildGroundedPrompt(message, context)
    });

    const output = response.text?.trim();

    return output || buildFallbackAnswer(message, context);
  }
}
