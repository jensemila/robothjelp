// Vipps ePayment API. Alle nøkler kun i miljøvariabler.
// Uten konfigurasjon svarer kjøpsflyten 503; ingenting annet påvirkes.

const VIPPS_API = process.env.VIPPS_API_URL ?? "https://apitest.vipps.no";

export function vippsConfigured(): boolean {
  return Boolean(
    process.env.VIPPS_CLIENT_ID &&
      process.env.VIPPS_CLIENT_SECRET &&
      process.env.VIPPS_SUBSCRIPTION_KEY &&
      process.env.VIPPS_MSN,
  );
}

async function accessToken(): Promise<string> {
  const response = await fetch(`${VIPPS_API}/accesstoken/get`, {
    method: "POST",
    headers: {
      client_id: process.env.VIPPS_CLIENT_ID!,
      client_secret: process.env.VIPPS_CLIENT_SECRET!,
      "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    },
  });
  if (!response.ok) throw new Error("vipps_token_failed");
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("vipps_token_failed");
  return data.access_token;
}

async function vippsHeaders(idempotencyKey: string) {
  return {
    Authorization: `Bearer ${await accessToken()}`,
    "Ocp-Apim-Subscription-Key": process.env.VIPPS_SUBSCRIPTION_KEY!,
    "Merchant-Serial-Number": process.env.VIPPS_MSN!,
    "Idempotency-Key": idempotencyKey,
    "Content-Type": "application/json",
  };
}

export async function createVippsPayment(
  reference: string,
  amountOre: number,
  returnUrl: string,
): Promise<string> {
  const response = await fetch(`${VIPPS_API}/epayment/v1/payments`, {
    method: "POST",
    headers: await vippsHeaders(reference),
    body: JSON.stringify({
      amount: { currency: "NOK", value: amountOre },
      paymentMethod: { type: "WALLET" },
      reference,
      returnUrl,
      userFlow: "WEB_REDIRECT",
      paymentDescription: "Kredittkode",
    }),
  });
  if (!response.ok) throw new Error("vipps_create_failed");
  const data = (await response.json()) as { redirectUrl?: string };
  if (!data.redirectUrl) throw new Error("vipps_create_failed");
  return data.redirectUrl;
}

export async function getVippsPaymentState(
  reference: string,
): Promise<{ state: string; amountOre: number }> {
  const response = await fetch(
    `${VIPPS_API}/epayment/v1/payments/${reference}`,
    { headers: await vippsHeaders(`get-${reference}`) },
  );
  if (!response.ok) throw new Error("vipps_get_failed");
  const data = (await response.json()) as {
    state?: string;
    amount?: { value?: number };
  };
  return {
    state: data.state ?? "UNKNOWN",
    amountOre: data.amount?.value ?? 0,
  };
}

export async function captureVippsPayment(
  reference: string,
  amountOre: number,
): Promise<void> {
  const response = await fetch(
    `${VIPPS_API}/epayment/v1/payments/${reference}/capture`,
    {
      method: "POST",
      headers: await vippsHeaders(`capture-${reference}`),
      body: JSON.stringify({
        modificationAmount: { currency: "NOK", value: amountOre },
      }),
    },
  );
  if (!response.ok) throw new Error("vipps_capture_failed");
}
