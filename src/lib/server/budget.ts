// Globalt dagsbudsjett for gratisnivået (PLAN.md seksjon 1: «ubegrenset innen
// rimelighetens grenser»). Beskytter Anthropic-regningen mot vedvarende
// misbruk og IP-rotasjon, som rate limit per IP ikke fanger.
//
// Telleren ligger KUN i minnet, som rate limiteren. Den nullstilles ved
// omstart og teller ikke noe personkoblet, bare et samlet antall.

const DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 5000);
const WINDOW_MS = 24 * 60 * 60 * 1000;

let count = 0;
let resetAt = Date.now() + WINDOW_MS;

/**
 * Registrerer ett gratis svar mot dagsbudsjettet. Returnerer true hvis det er
 * innenfor grensen. Kall kun for gratisnivået; betalte svar finansierer seg
 * selv og skal ikke telle.
 */
export function consumeFreeAnswer(): boolean {
  const now = Date.now();
  if (now >= resetAt) {
    count = 0;
    resetAt = now + WINDOW_MS;
  }
  if (count >= DAILY_LIMIT) return false;
  count += 1;
  return true;
}
