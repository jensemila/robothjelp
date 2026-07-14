import { generateCode, hashCode, normalizeCode } from "@/lib/server/codes";
import { prisma } from "@/lib/server/db";

/**
 * Utsteder en ny kredittkode. Klarteksten returneres ÉN gang (til visning
 * for kjøperen) og lagres aldri; databasen får kun hashen og saldoen.
 * Ingen kobling til betaling lagres (PLAN.md seksjon 10).
 */
export async function issueCode(saldoOre: number): Promise<string> {
  if (!Number.isInteger(saldoOre) || saldoOre <= 0) {
    throw new Error("saldoOre må være et positivt heltall (øre)");
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    // Hash alltid den normaliserte formen (uten bindestreker), samme form
    // som brukes ved oppslag når brukeren løser inn koden.
    const normalized = normalizeCode(code);
    if (!normalized) continue;
    try {
      await prisma.creditCode.create({
        data: { codeHash: hashCode(normalized), saldoOre },
      });
      return code;
    } catch {
      // Kollisjon på hash er astronomisk usannsynlig, men prøv på nytt.
    }
  }
  throw new Error("Klarte ikke å utstede kode");
}
