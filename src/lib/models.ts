// Modellnivåer per PLAN.md seksjon 1.
export const MODEL_TIERS = {
  haiku: {
    id: "claude-haiku-4-5",
    label: "Haiku",
    description: "Gratis, rask",
    paid: false,
    maxTokens: 4096,
  },
  opus: {
    id: "claude-opus-4-8",
    label: "Opus",
    description: "Best kvalitet, krever kreditt",
    paid: true,
    maxTokens: 8192,
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

export function isModelTier(value: unknown): value is ModelTier {
  return value === "haiku" || value === "opus";
}
