import { createHash, createHmac, randomBytes } from "node:crypto";

// Proof-of-work uten lagring av klientdata. Utfordringen er selvbærende:
// "<utløpstidspunkt>.<tilfeldig nonce>.<HMAC>" signert med en hemmelighet som
// kun finnes i minnet og roteres ved omstart. Brukte utfordringer holdes i et
// sett i minnet (kun utfordrings-ID, aldri noe klientrelatert) for å hindre
// gjenbruk av samme løsning.

const SECRET = randomBytes(32);
export const POW_DIFFICULTY_BITS = 15;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const usedChallenges = new Map<string, number>(); // id -> utløper (epoch ms)

function pruneUsed(now: number) {
  for (const [id, expires] of usedChallenges) {
    if (expires < now) usedChallenges.delete(id);
  }
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createChallenge(): { challenge: string; difficulty: number } {
  const expires = Date.now() + CHALLENGE_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${expires}.${nonce}`;
  return {
    challenge: `${payload}.${sign(payload)}`,
    difficulty: POW_DIFFICULTY_BITS,
  };
}

function hasLeadingZeroBits(hash: Buffer, bits: number): boolean {
  let remaining = bits;
  for (const byte of hash) {
    if (remaining >= 8) {
      if (byte !== 0) return false;
      remaining -= 8;
    } else if (remaining > 0) {
      return byte >> (8 - remaining) === 0;
    } else {
      return true;
    }
  }
  return remaining <= 0;
}

export function verifySolution(challenge: unknown, solution: unknown): boolean {
  if (typeof challenge !== "string" || typeof solution !== "string") {
    return false;
  }
  if (challenge.length > 200 || solution.length > 32) return false;

  const parts = challenge.split(".");
  if (parts.length !== 3) return false;
  const [expiresRaw, nonce, mac] = parts;

  const payload = `${expiresRaw}.${nonce}`;
  if (sign(payload) !== mac) return false;

  const now = Date.now();
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < now) return false;

  pruneUsed(now);
  if (usedChallenges.has(nonce)) return false;

  const hash = createHash("sha256")
    .update(`${challenge}.${solution}`)
    .digest();
  if (!hasLeadingZeroBits(hash, POW_DIFFICULTY_BITS)) return false;

  usedChallenges.set(nonce, expires);
  return true;
}
