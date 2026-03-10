import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

import type { OnboardingField } from "@perrologo/domain";

import type { DbClient } from "./client.js";
import {
  admins,
  conversations,
  dogs,
  knowledgeArticles,
  messages,
  owners,
  processedEvents,
  safetyEvents
} from "./schema.js";

function requireRow<T>(row: T | undefined, message: string): T {
  if (!row) {
    throw new Error(message);
  }

  return row;
}

type ConversationStateInput = {
  state: string;
  pendingField: OnboardingField;
  activeDogId?: string | null;
  profileDraft?: Record<string, unknown> | null;
};

export function createRepositories(db: DbClient) {
  return {
    admins: {
      async findByEmail(email: string) {
        return db.query.admins.findFirst({
          where: eq(admins.email, email)
        });
      },
      async upsert(email: string, data?: { name?: string | null; image?: string | null }) {
        const existing = await db.query.admins.findFirst({
          where: eq(admins.email, email)
        });

        if (existing) {
          const [updated] = await db
            .update(admins)
            .set({
              name: data?.name ?? existing.name,
              image: data?.image ?? existing.image,
              lastLoginAt: new Date()
            })
            .where(eq(admins.id, existing.id))
            .returning();
          return requireRow(updated, "Failed to update admin");
        }

        const [created] = await db
          .insert(admins)
          .values({
            email,
            name: data?.name,
            image: data?.image,
            lastLoginAt: new Date()
          })
          .returning();

        return requireRow(created, "Failed to create admin");
      }
    },
    owners: {
      async findOrCreateByPhone(phoneNumber: string) {
        const existing = await db.query.owners.findFirst({
          where: eq(owners.phoneNumber, phoneNumber)
        });

        if (existing) {
          return existing;
        }

        const [created] = await db
          .insert(owners)
          .values({
            phoneNumber
          })
          .returning();

        return requireRow(created, "Failed to create owner");
      },
      async list(search?: string) {
        return db.query.owners.findMany({
          where: search
            ? or(
                ilike(owners.phoneNumber, `%${search}%`),
                ilike(owners.name, `%${search}%`)
              )
            : undefined,
          orderBy: [desc(owners.updatedAt)]
        });
      },
      async detail(ownerId: string) {
        const owner = await db.query.owners.findFirst({
          where: eq(owners.id, ownerId)
        });

        if (!owner) {
          return null;
        }

        const ownerDogs = await db.query.dogs.findMany({
          where: eq(dogs.ownerId, ownerId),
          orderBy: [asc(dogs.createdAt)]
        });

        const ownerConversations = await db.query.conversations.findMany({
          where: eq(conversations.ownerId, ownerId),
          orderBy: [desc(conversations.lastMessageAt)]
        });

        const conversationIds = ownerConversations.map((conversation) => conversation.id);
        const ownerMessages =
          conversationIds.length > 0
            ? await db.query.messages.findMany({
                where: or(
                  ...conversationIds.map((conversationId) =>
                    eq(messages.conversationId, conversationId)
                  )
                ),
                orderBy: [asc(messages.createdAt)]
              })
            : [];

        const ownerSafetyEvents =
          conversationIds.length > 0
            ? await db.query.safetyEvents.findMany({
                where: or(
                  ...conversationIds.map((conversationId) =>
                    eq(safetyEvents.conversationId, conversationId)
                  )
                ),
                orderBy: [desc(safetyEvents.createdAt)]
              })
            : [];

        return {
          owner,
          dogs: ownerDogs,
          conversations: ownerConversations,
          messages: ownerMessages,
          safetyEvents: ownerSafetyEvents
        };
      },
      async updateFlags(ownerId: string, flags: { blocked?: boolean; needsFollowUp?: boolean }) {
        const [updated] = await db
          .update(owners)
          .set({
            ...flags,
            updatedAt: new Date()
          })
          .where(eq(owners.id, ownerId))
          .returning();

        return requireRow(updated, "Failed to update owner flags");
      }
    },
    dogs: {
      async findById(dogId: string) {
        return db.query.dogs.findFirst({
          where: eq(dogs.id, dogId)
        });
      },
      async findFirstByOwner(ownerId: string) {
        return db.query.dogs.findFirst({
          where: eq(dogs.ownerId, ownerId),
          orderBy: [asc(dogs.createdAt)]
        });
      },
      async create(ownerId: string, data: Omit<typeof dogs.$inferInsert, "ownerId">) {
        const [created] = await db
          .insert(dogs)
          .values({
            ownerId,
            ...data
          })
          .returning();

        return requireRow(created, "Failed to create dog");
      },
      async update(dogId: string, data: Partial<typeof dogs.$inferInsert>) {
        const [updated] = await db
          .update(dogs)
          .set({
            ...data,
            updatedAt: new Date()
          })
          .where(eq(dogs.id, dogId))
          .returning();

        return requireRow(updated, "Failed to update dog");
      }
    },
    conversations: {
      async findById(conversationId: string) {
        return db.query.conversations.findFirst({
          where: eq(conversations.id, conversationId)
        });
      },
      async getOrCreateForOwner(ownerId: string) {
        const existing = await db.query.conversations.findFirst({
          where: and(eq(conversations.ownerId, ownerId), eq(conversations.status, "open")),
          orderBy: [desc(conversations.updatedAt)]
        });

        if (existing) {
          return existing;
        }

        const [created] = await db
          .insert(conversations)
          .values({
            ownerId
          })
          .returning();

        return requireRow(created, "Failed to create conversation");
      },
      async updateState(conversationId: string, input: ConversationStateInput) {
        const [updated] = await db
          .update(conversations)
          .set({
            state: input.state,
            pendingField: input.pendingField,
            activeDogId: input.activeDogId ?? null,
            profileDraft:
              input.profileDraft === undefined ? undefined : input.profileDraft,
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId))
          .returning();

        return requireRow(updated, "Failed to update conversation state");
      },
      async touch(conversationId: string) {
        const [updated] = await db
          .update(conversations)
          .set({
            lastMessageAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(conversations.id, conversationId))
          .returning();

        return requireRow(updated, "Failed to touch conversation");
      },
      async list(search?: string) {
        const rows = await db.query.conversations.findMany({
          orderBy: [desc(conversations.lastMessageAt)]
        });

        if (!search) {
          return rows;
        }

        const ownersById = new Map(
          (
            await db.query.owners.findMany({
              where: or(
                ilike(owners.phoneNumber, `%${search}%`),
                ilike(owners.name, `%${search}%`)
              )
            })
          ).map((owner) => [owner.id, owner])
        );

        const dogsByOwner = await db.query.dogs.findMany({
          where: ilike(dogs.name, `%${search}%`)
        });

        const ownerIds = new Set<string>();
        for (const ownerId of ownersById.keys()) {
          ownerIds.add(ownerId);
        }
        for (const dog of dogsByOwner) {
          ownerIds.add(dog.ownerId);
        }

        return rows.filter((row) => ownerIds.has(row.ownerId));
      }
    },
    messages: {
      async create(data: typeof messages.$inferInsert) {
        const [created] = await db.insert(messages).values(data).returning();
        return requireRow(created, "Failed to create message");
      },
      async recentForConversation(conversationId: string, limit = 8) {
        const rows = await db.query.messages.findMany({
          where: eq(messages.conversationId, conversationId),
          orderBy: [desc(messages.createdAt)],
          limit
        });

        return rows.reverse();
      }
    },
    knowledge: {
      async all() {
        return db.query.knowledgeArticles.findMany({
          orderBy: [asc(knowledgeArticles.title)]
        });
      },
      async upsertMany(
        articles: Array<{
          slug: string;
          title: string;
          body: string;
          category: string;
          language?: string;
          tags: string[];
        }>
      ) {
        for (const article of articles) {
          const existing = await db.query.knowledgeArticles.findFirst({
            where: eq(knowledgeArticles.slug, article.slug)
          });

          if (existing) {
            await db
              .update(knowledgeArticles)
              .set({
                ...article,
                language: article.language ?? "es",
                updatedAt: new Date()
              })
              .where(eq(knowledgeArticles.id, existing.id));
          } else {
            await db.insert(knowledgeArticles).values({
              ...article,
              language: article.language ?? "es"
            });
          }
        }
      }
    },
    processedEvents: {
      async exists(externalEventId: string) {
        const row = await db.query.processedEvents.findFirst({
          where: eq(processedEvents.externalEventId, externalEventId)
        });

        return Boolean(row);
      },
      async create(data: typeof processedEvents.$inferInsert) {
        const [created] = await db.insert(processedEvents).values(data).returning();
        return requireRow(created, "Failed to create processed event");
      }
    },
    safetyEvents: {
      async create(data: typeof safetyEvents.$inferInsert) {
        const [created] = await db.insert(safetyEvents).values(data).returning();
        return requireRow(created, "Failed to create safety event");
      }
    }
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
