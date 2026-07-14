import { ppConfigured, ppPublicKeyB64 } from "@/lib/server/privacypass";

export const runtime = "nodejs";

export async function GET() {
  if (!ppConfigured()) {
    return Response.json({ enabled: false });
  }
  return Response.json({ enabled: true, publicKey: ppPublicKeyB64() });
}
