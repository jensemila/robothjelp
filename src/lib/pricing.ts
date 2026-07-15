// Valører (PLAN.md seksjon 3). Klient-trygg.

export type PaymentMethod = "vipps" | "lightning";

/** Valører som gjelder for alle betalingsmetoder. */
export const DENOMINATIONS_ORE = [4900, 9900, 19900] as const;

/**
 * Lavterskel-valør, kun for Lightning. Vipps har transaksjonsgebyrer som
 * spiser for mye av et så lite beløp, og Lightning-betalinger er billige nok
 * til at 20 kr forsvarer seg.
 */
export const LIGHTNING_ONLY_ORE = [2000] as const;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "vipps" || value === "lightning";
}

/** Valørene som er gyldige for én metode, i stigende rekkefølge. */
export function denominationsFor(method: PaymentMethod): readonly number[] {
  return method === "lightning"
    ? [...LIGHTNING_ONLY_ORE, ...DENOMINATIONS_ORE]
    : DENOMINATIONS_ORE;
}

/** Sjekker at beløpet er en gyldig valør FOR DEN AKTUELLE metoden. */
export function isValidDenomination(
  ore: unknown,
  method: PaymentMethod,
): ore is number {
  return typeof ore === "number" && denominationsFor(method).includes(ore);
}
