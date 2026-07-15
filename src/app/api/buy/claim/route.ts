import { isValidDenomination } from "@/lib/pricing";
import { markClaimed, takeCode } from "@/lib/server/claims";
import { issueCode } from "@/lib/server/issue";
import { allowRequest } from "@/lib/server/ratelimit";
import {
  captureVippsPayment,
  getVippsPaymentState,
  vippsConfigured,
} from "@/lib/server/vipps";

// Utleverer kredittkoden ETTER betaling. Koden vises én gang, og
// koblingen betaling→kode slettes i samme øyeblikk.

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

  const { reference, method } = body as { reference?: unknown; method?: unknown };
  if (
    typeof reference !== "string" ||
    !/^[0-9a-f]{32}$/.test(reference) ||
    (method !== "vipps" && method !== "lightning")
  ) {
    return Response.json({ error: "Ugyldig forespørsel." }, { status: 400 });
  }

  // Allerede utstedt og klar til henting (BTCPay-webhook, eller retry).
  const stashed = takeCode(reference);
  if (stashed) {
    return Response.json({ code: stashed });
  }

  if (method === "lightning") {
    // Koden utstedes av webhooken når fakturaen er betalt.
    return Response.json({ pending: true });
  }

  // Vipps: sjekk betalingsstatus, merk referansen som brukt, kapre og utsted.
  if (!vippsConfigured()) {
    return Response.json(
      { error: "Vipps er ikke konfigurert ennå." },
      { status: 503 },
    );
  }

  try {
    const { state, amountOre } = await getVippsPaymentState(reference);
    if (state === "CREATED") {
      return Response.json({ pending: true });
    }
    if (state !== "AUTHORIZED" || !isValidDenomination(amountOre, "vipps")) {
      return Response.json(
        { error: "Betalingen er ikke gjennomført." },
        { status: 402 },
      );
    }
    if (!(await markClaimed(reference))) {
      return Response.json(
        { error: "Koden for denne betalingen er allerede hentet." },
        { status: 409 },
      );
    }
    await captureVippsPayment(reference, amountOre);
    const code = await issueCode(amountOre);
    return Response.json({ code });
  } catch {
    return Response.json(
      { error: "Klarte ikke å bekrefte betalingen. Prøv igjen." },
      { status: 502 },
    );
  }
}
