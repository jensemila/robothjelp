import { isPaymentMethod, isValidDenomination } from "@/lib/pricing";
import { createBtcpayInvoice, btcpayConfigured } from "@/lib/server/btcpay";
import { newReference } from "@/lib/server/claims";
import { allowRequest } from "@/lib/server/ratelimit";
import { SITE_URL } from "@/lib/site";
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

  // Metoden må valideres FØR valøren, siden gyldige valører avhenger av den.
  if (!isPaymentMethod(method)) {
    return Response.json(
      { error: "Ugyldig betalingsmetode." },
      { status: 400 },
    );
  }
  if (!isValidDenomination(amountOre, method)) {
    return Response.json({ error: "Ugyldig valør." }, { status: 400 });
  }

  const reference = newReference();
  // Bak reverse proxy er request.url den interne adressen (127.0.0.1:3000),
  // så retur-URL-en må bygges av det offentlige domenet. Lokal utvikling
  // bruker fortsatt request-origin så flyten virker på localhost.
  const origin =
    process.env.NODE_ENV === "production"
      ? SITE_URL
      : new URL(request.url).origin;
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
