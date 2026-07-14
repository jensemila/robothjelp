import { isValidDenomination } from "@/lib/pricing";
import { verifyBtcpaySignature } from "@/lib/server/btcpay";
import { markClaimed, stashCode } from "@/lib/server/claims";
import { issueCode } from "@/lib/server/issue";

// BTCPay-webhook: betalt faktura → anonym kredittkode (PLAN.md seksjon 7).
// Koden legges klar til henting i minnet; ingen kobling lagres varig.

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyBtcpaySignature(rawBody, request.headers.get("BTCPay-Sig"))) {
    return Response.json({ error: "Ugyldig signatur." }, { status: 401 });
  }

  let event: {
    type?: string;
    metadata?: { orderId?: string; amountOre?: number };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  if (event.type !== "InvoiceSettled") {
    return Response.json({ ok: true });
  }

  const reference = event.metadata?.orderId;
  const amountOre = event.metadata?.amountOre;
  if (
    typeof reference !== "string" ||
    !/^[0-9a-f]{32}$/.test(reference) ||
    !isValidDenomination(amountOre)
  ) {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  // Webhooker kan leveres flere ganger; utsted kun én gang per referanse.
  if (await markClaimed(reference)) {
    const code = await issueCode(amountOre);
    stashCode(reference, code);
  }

  return Response.json({ ok: true });
}
