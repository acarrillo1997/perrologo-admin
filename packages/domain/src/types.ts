export type DogProfile = {
  id?: string;
  name: string;
  breed: string;
  age: string;
  weight: string;
  sex?: string | null;
  neutered?: boolean | null;
};

export type OwnerContext = {
  id?: string;
  phoneNumber: string;
  name?: string | null;
  blocked?: boolean;
  needsFollowUp?: boolean;
};

export type ConversationState =
  | "new_user_onboarding"
  | "active_chat"
  | "profile_update";

export type OnboardingField =
  | "dog_name"
  | "breed"
  | "age"
  | "weight"
  | "sex"
  | "neutered"
  | null;

export type SafetyDecision = {
  isUrgent: boolean;
  severity: "low" | "medium" | "high";
  matchedSignals: string[];
  summary: string;
};

export type RetrievedArticle = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
};

export type AnswerContext = {
  owner: OwnerContext;
  dog?: DogProfile | null;
  articles: RetrievedArticle[];
  recentMessages: string[];
};
