import { createHash, randomInt } from "node:crypto";

// Kredittkoder er ihendehaverbevis. Serveren lagrer kun SHA-256-hashen.
// Alfabetet er Crockford base32 uten tvetydige tegn (I, L, O, U).
// 16 tegn à 5 bits = 80 bits entropi; brute force er urealistisk.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const PREFIX = "SPFR";
const GROUPS = 4;
const GROUP_LENGTH = 4;

export function generateCode(): string {
  const groups: string[] = [PREFIX];
  for (let g = 0; g < GROUPS; g++) {
    let group = "";
    for (let i = 0; i < GROUP_LENGTH; i++) {
      group += ALPHABET[randomInt(ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/** Normaliserer brukerinput: store bokstaver, uten bindestreker/mellomrom. */
export function normalizeCode(input: string): string | null {
  const stripped = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const expected = PREFIX.length + GROUPS * GROUP_LENGTH;
  if (stripped.length !== expected || !stripped.startsWith(PREFIX)) {
    return null;
  }
  for (const char of stripped.slice(PREFIX.length)) {
    if (!ALPHABET.includes(char)) return null;
  }
  return stripped;
}

export function hashCode(normalizedCode: string): string {
  return createHash("sha256").update(normalizedCode).digest("hex");
}

/** Pris per Opus-svar, i øre. */
export const PRICE_PER_ANSWER_ORE = 200;
