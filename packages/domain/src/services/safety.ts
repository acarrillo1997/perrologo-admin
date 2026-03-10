import type { SafetyDecision } from "../types.js";

const urgentPatterns = [
  "no respira",
  "dificultad para respirar",
  "se convulsiona",
  "convulsion",
  "convulsiones",
  "envenen",
  "sangrado abundante",
  "se desmaya",
  "desmayado",
  "no se mueve",
  "vomita sangre",
  "diarrea con sangre",
  "muy decaido",
  "no puede levantarse"
];

export function assessSafety(message: string): SafetyDecision {
  const normalized = message.toLowerCase();
  const matchedSignals = urgentPatterns.filter((pattern) =>
    normalized.includes(pattern)
  );

  if (matchedSignals.length > 0) {
    return {
      isUrgent: true,
      severity: "high",
      matchedSignals,
      summary: "Se detectaron sintomas de alarma que requieren atencion veterinaria."
    };
  }

  const mediumRiskSignals = ["vomito", "diarrea", "rasca", "cojea"].filter(
    (pattern) => normalized.includes(pattern)
  );

  return {
    isUrgent: false,
    severity: mediumRiskSignals.length > 0 ? "medium" : "low",
    matchedSignals: mediumRiskSignals,
    summary:
      mediumRiskSignals.length > 0
        ? "Hay sintomas que requieren orientacion cuidadosa y limites claros."
        : "No se detectaron senales urgentes."
  };
}

export function urgentReply(): string {
  return [
    "Esto puede ser urgente.",
    "No puedo reemplazar a un veterinario en este caso.",
    "Lleva a tu perro a una clinica veterinaria o servicio de urgencias ahora mismo.",
    "Si quieres, te ayudo a resumir los sintomas para explicarlos rapido al veterinario."
  ].join(" ");
}
