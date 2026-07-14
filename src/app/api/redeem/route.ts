import { hashCode, normalizeCode } from "@/lib/server/codes";
import { prisma } from "@/lib/server/db";
import { allowRequest } from "@/lib/server/ratelimit";

// Slår opp saldo for en kredittkode. Ingen logging av kode eller IP.

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!allowRequest(request)) {
    return Response.json(
      { error: "For mange forespørsler. Vent litt og prøv igjen." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  const rawCode = (body as { code?: unknown }).code;
  const normalized =
    typeof rawCode === "string" ? normalizeCode(rawCode) : null;
  if (!normalized) {
    return Response.json(
      { error: "Ugyldig kodeformat. Sjekk at du har skrevet den riktig." },
      { status: 400 },
    );
  }

  const entry = await prisma.creditCode.findUnique({
    where: { codeHash: hashCode(normalized) },
    select: { saldoOre: true },
  });

  if (!entry) {
    return Response.json(
      { error: "Koden finnes ikke. Sjekk at du har skrevet den riktig." },
      { status: 404 },
    );
  }

  return Response.json({ saldo_ore: entry.saldoOre });
}
