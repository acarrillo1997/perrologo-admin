import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  image: text("image"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const owners = pgTable("owners", {
  id: uuid("id").defaultRandom().primaryKey(),
  phoneNumber: varchar("phone_number", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  language: varchar("language", { length: 8 }).notNull().default("es"),
  blocked: boolean("blocked").notNull().default(false),
  needsFollowUp: boolean("needs_follow_up").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const dogs = pgTable("dogs", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => owners.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }).notNull(),
  age: varchar("age", { length: 128 }).notNull(),
  weight: varchar("weight", { length: 128 }).notNull(),
  sex: varchar("sex", { length: 32 }),
  neutered: boolean("neutered"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => owners.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 32 }).notNull().default("whatsapp"),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  state: varchar("state", { length: 64 })
    .notNull()
    .default("new_user_onboarding"),
  pendingField: varchar("pending_field", { length: 64 }).default("dog_name"),
  activeDogId: uuid("active_dog_id").references(() => dogs.id, {
    onDelete: "set null"
  }),
  profileDraft: jsonb("profile_draft").$type<Record<string, unknown> | null>(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  ownerId: uuid("owner_id").references(() => owners.id, { onDelete: "set null" }),
  externalMessageId: varchar("external_message_id", { length: 255 }).unique(),
  direction: varchar("direction", { length: 16 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const knowledgeArticles = pgTable("knowledge_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  language: varchar("language", { length: 8 }).notNull().default("es"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const processedEvents = pgTable("processed_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 64 }).notNull(),
  externalEventId: varchar("external_event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export const safetyEvents = pgTable("safety_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  severity: varchar("severity", { length: 32 }).notNull(),
  matchedSignals: text("matched_signals").array().notNull().default([]),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow()
});

export type AdminRecord = typeof admins.$inferSelect;
export type OwnerRecord = typeof owners.$inferSelect;
export type DogRecord = typeof dogs.$inferSelect;
export type ConversationRecord = typeof conversations.$inferSelect;
export type MessageRecord = typeof messages.$inferSelect;
export type KnowledgeArticleRecord = typeof knowledgeArticles.$inferSelect;
export type SafetyEventRecord = typeof safetyEvents.$inferSelect;
