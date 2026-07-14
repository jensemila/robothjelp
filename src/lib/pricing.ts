// Valører (PLAN.md seksjon 3). Klient-trygg.
export const DENOMINATIONS_ORE = [4900, 9900, 19900] as const;

export function isValidDenomination(ore: unknown): ore is number {
  return (
    typeof ore === "number" &&
    (DENOMINATIONS_ORE as readonly number[]).includes(ore)
  );
}
