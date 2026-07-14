import { isValidDenomination } from "@/lib/pricing";
import { createBtcpayInvoice, btcpayConfigured } from "@/lib/server/btcpay";
import { newReference } from "@/lib/server/claims";
import { allowRequest } from "@/lib/server/ratelimit";
import { createVippsPayment, vippsConfigured } from "@/lib/server/vipps";

// Starter et kjøp. Referansen er en tilfeldig ID uten kobling til person.
// Ingen logging av IP eller innhold.

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

  const { amount_ore: amountOre, method } = body as {
    amount_ore?: unknown;
    method?: unknown;
  };

  if (!isValidDenomination(amountOre)) {
    return Response.json({ error: "Ugyldig valør." }, { status: 400 });
  }
  if (method !== "vipps" && method !== "lightning") {
    return Response.json(
      { error: "Ugyldig betalingsmetode." },
      { status: 400 },
    );
  }

  const reference = newReference();
  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/buy/complete?ref=${reference}&m=${method}`;

  try {
    if (method === "vipps") {
      if (!vippsConfigured()) {
        return Response.json(
          { error: "Vipps er ikke konfigurert ennå." },
          { status: 503 },
        );
      }
      const redirectUrl = await createVippsPayment(
        reference,
        amountOre,
        returnUrl,
      );
      return Response.json({ redirectUrl, reference });
    }

    if (!btcpayConfigured()) {
      return Response.json(
        { error: "Lightning-betaling er ikke konfigurert ennå." },
        { status: 503 },
      );
    }
    const redirectUrl = await createBtcpayInvoice(
      reference,
      amountOre,
      returnUrl,
    );
    return Response.json({ redirectUrl, reference });
  } catch {
    return Response.json(
      { error: "Klarte ikke å starte betalingen. Prøv igjen." },
      { status: 502 },
    );
  }
}
