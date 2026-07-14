import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/server/db";

// Kortlevd lager i minnet for utstedte koder som venter på henting.
// Koblingen betaling→kode finnes KUN her, i maks 15 minutter, og slettes
// i det koden hentes. Ingenting av dette skrives til disk.

const CLAIM_TTL_MS = 15 * 60 * 1000;

type PendingCode = { code: string; expiresAt: number };
const pending = new Map<string, PendingCode>();

function prune() {
  const now = Date.now();
  for (const [key, value] of pending) {
    if (value.expiresAt < now) pending.delete(key);
  }
}

export function newReference(): string {
  return randomBytes(16).toString("hex");
}

export function hashReference(reference: string): string {
  return createHash("sha256").update(reference).digest("hex");
}

/** Legg en nyutstedt kode klar til henting (kalles fra webhook/claim). */
export function stashCode(reference: string, code: string) {
  prune();
  pending.set(hashReference(reference), {
    code,
    expiresAt: Date.now() + CLAIM_TTL_MS,
  });
}

/** Hent koden ÉN gang. Sletter koblingen i det den hentes. */
export function takeCode(reference: string): string | null {
  prune();
  const key = hashReference(reference);
  const entry = pending.get(key);
  if (!entry) return null;
  pending.delete(key);
  return entry.code;
}

/**
 * Markerer en betalingsreferanse som brukt, varig (kun hash + tidspunkt).
 * Returnerer false hvis den allerede var brukt.
 */
export async function markClaimed(reference: string): Promise<boolean> {
  try {
    await prisma.claimedPayment.create({
      data: { referenceHash: hashReference(reference) },
    });
    return true;
  } catch {
    return false;
  }
}
