import {
  assessSafety,
  nextConversationState,
  nextOnboardingField,
  onboardingQuestions,
  onboardingWelcome,
  retrieveRelevantArticles,
  urgentReply,
  type OnboardingField
} from "@perrologo/domain";
import type { Repositories } from "@perrologo/db";

import type { MessagingProvider, NormalizedInboundMessage } from "../types.js";
import { AnswerService } from "./answer-service.js";

type ServiceResult = {
  duplicate: boolean;
  replied: boolean;
  reply?: string;
};

function parseNeutered(input: string) {
  const normalized = input.toLowerCase();

  if (["si", "sí", "yes"].some((token) => normalized.includes(token))) {
    return true;
  }

  if (["no"].some((token) => normalized.includes(token))) {
    return false;
  }

  return null;
}

export class PerrologoService {
  constructor(
    private readonly repositories: Repositories,
    private readonly messagingProvider: MessagingProvider,
    private readonly answerService: AnswerService
  ) {}

  async handleIncomingMessage(message: NormalizedInboundMessage): Promise<ServiceResult> {
    if (await this.repositories.processedEvents.exists(message.eventId)) {
      return { duplicate: true, replied: false };
    }

    const owner = await this.repositories.owners.findOrCreateByPhone(message.phoneNumber);
    const conversation = await this.repositories.conversations.getOrCreateForOwner(owner.id);

    const inboundMessage = await this.repositories.messages.create({
      conversationId: conversation.id,
      ownerId: owner.id,
      externalMessageId: message.messageId,
      direction: "inbound",
      role: "user",
      body: message.text,
      metadata: {
        provider: "kapso",
        raw: message.raw
      }
    });

    await this.repositories.conversations.touch(conversation.id);
    await this.repositories.processedEvents.create({
      provider: "kapso",
      externalEventId: message.eventId,
      eventType: message.eventType
    });

    if (owner.blocked) {
      return { duplicate: false, replied: false };
    }

    const recentMessages = await this.repositories.messages.recentForConversation(
      conversation.id
    );
    const activeDog =
      (conversation.activeDogId
        ? await this.repositories.dogs.findById(conversation.activeDogId)
        : null) ?? (await this.repositories.dogs.findFirstByOwner(owner.id));

    let reply: string;

    if (conversation.state !== "active_chat") {
      reply = await this.handleOnboarding({
        ownerId: owner.id,
        conversationId: conversation.id,
        activeDogId: activeDog?.id ?? null,
        pendingField: (conversation.pendingField as OnboardingField) ?? "dog_name",
        inboundText: message.text,
        priorMessages: recentMessages.length - 1
      });
    } else {
      const safetyDecision = assessSafety(message.text);

      if (safetyDecision.isUrgent) {
        await this.repositories.safetyEvents.create({
          conversationId: conversation.id,
          messageId: inboundMessage.id,
          severity: safetyDecision.severity,
          matchedSignals: safetyDecision.matchedSignals,
          summary: safetyDecision.summary
        });

        await this.repositories.owners.updateFlags(owner.id, {
          needsFollowUp: true
        });

        reply = urgentReply();
      } else {
        const articles = retrieveRelevantArticles(
          message.text,
          await this.repositories.knowledge.all()
        );

        reply = await this.answerService.answer(message.text, {
          owner: {
            id: owner.id,
            phoneNumber: owner.phoneNumber,
            name: owner.name,
            blocked: owner.blocked,
            needsFollowUp: owner.needsFollowUp
          },
          dog: activeDog
            ? {
                id: activeDog.id,
                name: activeDog.name,
                breed: activeDog.breed,
                age: activeDog.age,
                weight: activeDog.weight,
                sex: activeDog.sex,
                neutered: activeDog.neutered
              }
            : null,
          articles: articles.map((article) => ({
            id: article.id,
            slug: article.slug,
            title: article.title,
            body: article.body,
            category: article.category,
            tags: article.tags
          })),
          recentMessages: recentMessages
            .slice(-6)
            .map((entry) => `${entry.role}: ${entry.body}`)
        });
      }
    }

    const outbound = await this.messagingProvider.sendTextReply({
      to: message.phoneNumber,
      body: reply
    });

    await this.repositories.messages.create({
      conversationId: conversation.id,
      ownerId: owner.id,
      externalMessageId: outbound.externalMessageId,
      direction: "outbound",
      role: "assistant",
      body: reply,
      metadata: {
        provider: "kapso"
      }
    });

    await this.repositories.conversations.touch(conversation.id);

    return {
      duplicate: false,
      replied: true,
      reply
    };
  }

  private async handleOnboarding(input: {
    ownerId: string;
    conversationId: string;
    activeDogId: string | null;
    pendingField: OnboardingField;
    inboundText: string;
    priorMessages: number;
  }) {
    if (input.priorMessages <= 0 && input.pendingField === "dog_name") {
      return onboardingWelcome();
    }

    const conversation = await this.repositories.conversations.findById(
      input.conversationId
    );

    if (!conversation) {
      throw new Error("Conversation not found during onboarding");
    }
    const draft = (conversation.profileDraft ?? {}) as Record<string, unknown>;
    const currentField = input.pendingField ?? "dog_name";

    draft[currentField] =
      currentField === "neutered"
        ? parseNeutered(input.inboundText)
        : input.inboundText.trim();

    const nextField = nextOnboardingField(currentField);

    if (nextField === null) {
      const createdDog = await this.repositories.dogs.create(input.ownerId, {
        name: String(draft.dog_name ?? "Perro"),
        breed: String(draft.breed ?? "Mestizo"),
        age: String(draft.age ?? "No especificada"),
        weight: String(draft.weight ?? "No especificado"),
        sex: typeof draft.sex === "string" ? draft.sex : null,
        neutered: typeof draft.neutered === "boolean" ? draft.neutered : null
      });

      await this.repositories.conversations.updateState(input.conversationId, {
        state: "active_chat",
        pendingField: null,
        activeDogId: createdDog.id,
        profileDraft: null
      });

      return [
        `Perfecto. Ya guarde el perfil de ${createdDog.name}.`,
        "Ahora puedes preguntarme sobre alimentacion, comportamiento, cuidados o sintomas no urgentes.",
        "Recuerda que si ves senales graves, debes buscar veterinario."
      ].join(" ");
    }

    await this.repositories.conversations.updateState(input.conversationId, {
      state: nextConversationState(nextField),
      pendingField: nextField,
      activeDogId: input.activeDogId,
      profileDraft: draft
    });

    return onboardingQuestions[nextField];
  }
}
