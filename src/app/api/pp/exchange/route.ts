import {
  PRICE_PER_ANSWER_ORE,
  hashCode,
  normalizeCode,
} from "@/lib/server/codes";
import { prisma } from "@/lib/server/db";
import { blindSignBatch, ppConfigured } from "@/lib/server/privacypass";
import { allowRequest } from "@/lib/server/ratelimit";

// Veksler kredittkode-saldo inn i anonyme Privacy Pass-tokens.
// Serveren signerer blindede meldinger og kan ikke senere gjenkjenne
// hvilke tokens som stammer fra hvilken kode. Ingen logging.

export const runtime = "nodejs";

const MAX_TOKENS_PER_EXCHANGE = 100;
const MAX_BLINDED_LENGTH = 1024;

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return Response.json(
      { error: "For mange forespørsler. Vent litt og prøv igjen." },
      { status: 429 },
    );
  }
  if (!ppConfigured()) {
    return Response.json(
      { error: "Privacy Pass er ikke aktivert på serveren." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  const { code: rawCode, blinded } = body as {
    code?: unknown;
    blinded?: unknown;
  };

  const normalized =
    typeof rawCode === "string" ? normalizeCode(rawCode) : null;
  if (
    !normalized ||
    !Array.isArray(blinded) ||
    blinded.length === 0 ||
    blinded.length > MAX_TOKENS_PER_EXCHANGE ||
    !blinded.every(
      (item): item is string =>
        typeof item === "string" &&
        item.length > 0 &&
        item.length <= MAX_BLINDED_LENGTH,
    )
  ) {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  const costOre = blinded.length * PRICE_PER_ANSWER_ORE;
  const codeHash = hashCode(normalized);

  const deducted = await prisma.creditCode.updateMany({
    where: { codeHash, saldoOre: { gte: costOre } },
    data: { saldoOre: { decrement: costOre } },
  });
  if (deducted.count === 0) {
    return Response.json(
      { error: "Ikke nok saldo på koden til så mange tokens." },
      { status: 402 },
    );
  }

  try {
    const signatures = await blindSignBatch(blinded);
    return Response.json({ signatures });
  } catch {
    // Signering feilet: legg saldoen tilbake.
    try {
      await prisma.creditCode.update({
        where: { codeHash },
        data: { saldoOre: { increment: costOre } },
      });
    } catch {
      // Beste forsøk.
    }
    return Response.json(
      { error: "Klarte ikke å utstede tokens. Prøv igjen." },
      { status: 500 },
    );
  }
}
