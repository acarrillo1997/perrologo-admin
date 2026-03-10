import type { AnswerContext } from "../types.js";

export function buildGroundedPrompt(message: string, context: AnswerContext) {
  const dogSummary = context.dog
    ? `Perro: ${context.dog.name}, raza ${context.dog.breed}, edad ${context.dog.age}, peso ${context.dog.weight}.`
    : "No hay perfil de perro completo todavia.";

  const articleSummary =
    context.articles.length > 0
      ? context.articles
          .map(
            (article, index) =>
              `[${index + 1}] ${article.title}: ${article.body}`
          )
          .join("\n")
      : "No hay articulos recuperados.";

  const conversationSummary =
    context.recentMessages.length > 0
      ? context.recentMessages.join("\n")
      : "Sin historial relevante.";

  return `
Eres Perrologo, un asistente de cuidado canino en WhatsApp.
Responde siempre en espanol claro y corto.
No digas que eres veterinario ni diagnostiques enfermedades.
Si el usuario menciona sintomas graves, prioriza recomendar atencion veterinaria.
Da una respuesta con este formato:
1. respuesta corta
2. pasos concretos
3. cuando buscar veterinario

${dogSummary}

Historial reciente:
${conversationSummary}

Conocimiento confiable:
${articleSummary}

Mensaje del usuario:
${message}
`.trim();
}

export function buildFallbackAnswer(message: string, context: AnswerContext) {
  const intro = context.dog
    ? `Para ${context.dog.name}, te recomiendo esto:`
    : "Te recomiendo esto:";

  if (context.articles.length === 0) {
    return [
      intro,
      "1. Observa el sintoma o conducta con calma.",
      "2. Evita cambios bruscos de comida o castigos mientras entiendes mejor que pasa.",
      "3. Si notas empeoramiento, dolor fuerte o decaimiento, busca veterinario."
    ].join(" ");
  }

  const article = context.articles[0];

  if (!article) {
    return [
      intro,
      "1. Observa el sintoma o conducta con calma.",
      "2. Manten agua fresca, rutina estable y evita tratamientos caseros agresivos.",
      "3. Si notas empeoramiento, sangre, mucha debilidad o dificultad para respirar, busca veterinario."
    ].join(" ");
  }

  return [
    intro,
    article.body,
    "Si notas empeoramiento, sangre, mucha debilidad o dificultad para respirar, busca veterinario."
  ].join(" ");
}
