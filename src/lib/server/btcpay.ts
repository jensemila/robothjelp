import { createHmac, timingSafeEqual } from "node:crypto";

// BTCPay Server Greenfield API (PLAN.md seksjon 7). Selve serveren settes
// opp senere på egen VPS; her er app-siden av koblingen.

export function btcpayConfigured(): boolean {
  return Boolean(
    process.env.BTCPAY_URL &&
      process.env.BTCPAY_API_KEY &&
      process.env.BTCPAY_STORE_ID,
  );
}

export async function createBtcpayInvoice(
  reference: string,
  amountOre: number,
  redirectUrl: string,
): Promise<string> {
  const base = process.env.BTCPAY_URL!.replace(/\/$/, "");
  const response = await fetch(
    `${base}/api/v1/stores/${process.env.BTCPAY_STORE_ID}/invoices`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${process.env.BTCPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: (amountOre / 100).toFixed(2),
        currency: "NOK",
        checkout: { redirectURL: redirectUrl },
        // Referansen er en tilfeldig ID uten kobling til person.
        metadata: { orderId: reference, amountOre },
      }),
    },
  );
  if (!response.ok) throw new Error("btcpay_create_failed");
  const data = (await response.json()) as { checkoutLink?: string };
  if (!data.checkoutLink) throw new Error("btcpay_create_failed");
  return data.checkoutLink;
}

/** Verifiserer BTCPay-Sig-headeren (HMAC-SHA256 av rå body). */
export function verifyBtcpaySignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}
