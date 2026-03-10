import type { ConversationState, OnboardingField } from "../types.js";

export const onboardingQuestions: Record<
  Exclude<OnboardingField, null>,
  string
> = {
  dog_name: "Como se llama tu perro?",
  breed: "Que raza es? Si no sabes, dime mestizo o una descripcion.",
  age: "Que edad tiene?",
  weight: "Cuanto pesa aproximadamente?",
  sex: "Es macho o hembra?",
  neutered: "Esta esterilizado? Responde si, no o no se."
};

export function nextOnboardingField(
  current: OnboardingField
): OnboardingField {
  switch (current) {
    case null:
      return "dog_name";
    case "dog_name":
      return "breed";
    case "breed":
      return "age";
    case "age":
      return "weight";
    case "weight":
      return "sex";
    case "sex":
      return "neutered";
    case "neutered":
      return null;
  }
}

export function nextConversationState(
  pendingField: OnboardingField
): ConversationState {
  return pendingField === null ? "active_chat" : "new_user_onboarding";
}

export function onboardingWelcome() {
  return [
    "Hola, soy Perrologo.",
    "Te ayudo con salud general, alimentacion, entrenamiento y cuidados de tu perro.",
    "Primero quiero conocerlo mejor.",
    onboardingQuestions.dog_name
  ].join(" ");
}
