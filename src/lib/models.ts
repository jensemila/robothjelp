// Modellnivåer og priser. Klient-trygg (ingen Node-avhengigheter).

/**
 * Et Privacy Pass-token er verdt én krone, ikke ett svar. Derfor koster et
 * dyrt svar flere tokens. Poenget er at det finnes ÉN token-type: hadde
 * tokens vært knyttet til hver sin modell, ville et sjeldent token pekt
 * tilbake på deg. Alle tokens ser like ut, uansett hva du bruker dem på.
 */
export const TOKEN_VALUE_ORE = 100;

export const MODEL_TIERS = {
  haiku: {
    id: "claude-haiku-4-5",
    label: "Haiku",
    note: "gratis",
    description: "Rask og kompetent. Ubegrenset, uten registrering.",
    priceOre: 0,
    maxTokens: 4096,
  },
  sonnet: {
    id: "claude-sonnet-5",
    label: "Sonnet",
    note: "rimelig",
    description: "Nær Opus i kvalitet til under halve prisen.",
    priceOre: 100,
    maxTokens: 8192,
  },
  opus: {
    id: "claude-opus-4-8",
    label: "Opus",
    note: "best",
    description: "Markedets beste modell for de fleste oppgaver.",
    priceOre: 200,
    maxTokens: 8192,
  },
  fable: {
    id: "claude-fable-5",
    label: "Fable",
    note: "sterkest",
    description: "Den mest kapable modellen som finnes. Tenker alltid.",
    priceOre: 500,
    maxTokens: 8192,
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export const MODEL_ORDER: readonly ModelTier[] = [
  "haiku",
  "sonnet",
  "opus",
  "fable",
];

export function isModelTier(value: unknown): value is ModelTier {
  return typeof value === "string" && value in MODEL_TIERS;
}

/** Pris for ett svar med denne modellen, i øre. 0 = gratis. */
export function priceOre(tier: ModelTier): number {
  return MODEL_TIERS[tier].priceOre;
}

export function isPaidTier(tier: ModelTier): boolean {
  return MODEL_TIERS[tier].priceOre > 0;
}

/** Antall Privacy Pass-tokens ett svar med denne modellen koster. */
export function tokensFor(tier: ModelTier): number {
  return MODEL_TIERS[tier].priceOre / TOKEN_VALUE_ORE;
}
