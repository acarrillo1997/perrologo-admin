import type { RetrievedArticle } from "../types.js";

export const curatedKnowledgeBase: RetrievedArticle[] = [
  {
    id: "feeding-mango",
    slug: "feeding-mango",
    title: "Frutas seguras y mango",
    category: "feeding",
    tags: ["mango", "fruta", "alimentacion", "seguro"],
    body:
      "El mango puede ofrecerse en pequenas cantidades, sin cascara ni hueso. Si el perro vomita, tiene diarrea o es diabetico, evita nuevas porciones y consulta a un veterinario."
  },
  {
    id: "vomit-basic",
    slug: "vomit-basic",
    title: "Vomito leve en perros",
    category: "health",
    tags: ["vomito", "diarrea", "estomago", "urgencia"],
    body:
      "Uno o dos episodios leves de vomito sin otros sintomas pueden observarse de cerca, con agua fresca y descanso digestivo breve. Si hay sangre, deshidratacion, dolor, decaimiento marcado o vomitos repetidos, hace falta atencion veterinaria."
  },
  {
    id: "itching-basic",
    slug: "itching-basic",
    title: "Picazon y rascado",
    category: "health",
    tags: ["rascado", "picazon", "piel", "pulgas"],
    body:
      "El rascado puede relacionarse con pulgas, alergias, irritacion de piel o infecciones. Revisa pulgas, cambios de alimento y lesiones visibles. Si hay heridas, mal olor, dolor o picazon intensa, consulta al veterinario."
  },
  {
    id: "puppy-biting",
    slug: "puppy-biting",
    title: "Mordidas de cachorro",
    category: "training",
    tags: ["morder", "cachorro", "entrenamiento"],
    body:
      "Cuando el cachorro muerda, corta el juego por unos segundos, ofrece un juguete alternativo y premia la calma. Mantener rutinas cortas y consistentes suele funcionar mejor que castigos."
  },
  {
    id: "exercise-guide",
    slug: "exercise-guide",
    title: "Ejercicio por edad y energia",
    category: "care",
    tags: ["ejercicio", "paseo", "energia", "edad"],
    body:
      "La necesidad de ejercicio depende de raza, edad y energia. Cachorros y razas activas necesitan varias sesiones breves al dia; perros mayores suelen beneficiarse de caminatas suaves y frecuentes."
  },
  {
    id: "vaccines-basics",
    slug: "vaccines-basics",
    title: "Vacunas y controles",
    category: "care",
    tags: ["vacunas", "veterinario", "recordatorio"],
    body:
      "El calendario de vacunas depende de la edad, la region y el criterio veterinario. Guarda fecha, clinica y siguiente control para no perder refuerzos importantes."
  }
];
